from datetime import datetime, timezone
import os
import json
import time
import uuid
from pathlib import Path
from django.http import JsonResponse
from django.conf import settings as django_settings
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from . import supabase
from .utils import (
    api_view,
    body_json,
    data_response,
    error_response,
    status_response,
    create_admin_token,
    parse_admin_token,
    create_member_token,
    parse_member_token,
)

_LOGIN_ATTEMPTS: dict[str, dict[str, float | int]] = {}
_LOGIN_WINDOW_SECONDS = 15 * 60
_LOGIN_MAX_ATTEMPTS = 100
ADMIN_AUTH_FILE = Path(django_settings.BASE_DIR) / "admin_auth.json"
ADMIN_COOKIE_NAME = "admin_session"
MEMBER_COOKIE_NAME = "member_session"


def _prune_login_attempts(now_ts: float):
    stale = [key for key, value in _LOGIN_ATTEMPTS.items() if (now_ts - float(value.get("ts", 0))) > _LOGIN_WINDOW_SECONDS]
    for key in stale:
        _LOGIN_ATTEMPTS.pop(key, None)


def _is_rate_limited(key: str, now_ts: float) -> bool:
    state = _LOGIN_ATTEMPTS.get(key, {"count": 0, "ts": now_ts})
    return int(state.get("count", 0)) >= _LOGIN_MAX_ATTEMPTS and (now_ts - float(state.get("ts", now_ts))) < _LOGIN_WINDOW_SECONDS


def _record_failed_attempt(key: str, now_ts: float):
    state = _LOGIN_ATTEMPTS.get(key, {"count": 0, "ts": now_ts})
    _LOGIN_ATTEMPTS[key] = {"count": int(state.get("count", 0)) + 1, "ts": now_ts}


def _get_client_ip(request) -> str:
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def _set_session_cookie(response, name: str, value: str, max_age: int):
    is_prod = not django_settings.DEBUG
    response.set_cookie(
        key=name,
        value=value,
        max_age=max_age,
        httponly=True,
        samesite="None" if is_prod else "Lax",
        secure=is_prod,
        path="/",
    )
    return response


def _clear_session_cookie(response, name: str):
    is_prod = not django_settings.DEBUG
    # delete_cookie ne supporte pas le paramètre 'secure' en Django.
    # On utilise set_cookie avec max_age=0 et une date d'expiration passée
    # pour forcer la suppression sur tous les navigateurs en respectant SameSite/Secure.
    response.set_cookie(
        name,
        value="",
        max_age=0,
        expires="Thu, 01 Jan 1970 00:00:00 GMT",
        path="/",
        samesite="None" if is_prod else "Lax",
        secure=is_prod,
    )
    return response


def _require_superadmin(request):
    token_data = parse_admin_token(request.headers.get("Authorization") or request.COOKIES.get(ADMIN_COOKIE_NAME))
    if not token_data or token_data.get("role") != "superadmin":
        return None, error_response("Accès réservé au superadmin.", 403)
    return token_data, None


def _log_superadmin_action(actor_email: str, action: str, target: str = "", details: dict | None = None):
    payload = {
        "actor_email": actor_email,
        "action": action,
        "target": target,
        "details": details or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        supabase.insert("superadmin_logs", payload)
    except Exception:
        fallback = Path(django_settings.BASE_DIR) / "superadmin_logs.json"
        logs = []
        if fallback.exists():
            try:
                logs = json.loads(fallback.read_text(encoding="utf-8"))
            except Exception:
                logs = []
        try:
            safe_payload = {
                **payload,
                "details": json.loads(json.dumps(payload.get("details", {}), default=str)),
            }
            logs.insert(0, safe_payload)
            fallback.write_text(json.dumps(logs[:300], ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            # Never break critical admin actions because of audit logging failure.
            pass


def _save_admin_auth(data: dict) -> None:
    ADMIN_AUTH_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _normalize_email(value: str | None) -> str:
    return (value or "").strip().lower()


def _normalize_phone(value: str | None) -> str:
    return "".join(ch for ch in str(value or "") if ch.isdigit())


def _phones_match(phone1: str | None, phone2: str | None) -> bool:
    p1 = "".join(ch for ch in str(phone1 or "") if ch.isdigit())
    p2 = "".join(ch for ch in str(phone2 or "") if ch.isdigit())
    if not p1 or not p2:
        return False
    if len(p1) >= 9 and len(p2) >= 9:
        return p1[-9:] == p2[-9:]
    return p1 == p2


def _normalize_name(value: str | None) -> str:
    return " ".join(str(value or "").strip().lower().split())


def _public_member_payload(member: dict) -> dict:
    return {
        "id": member.get("id"),
        "full_name": member.get("full_name"),
        "phone": member.get("phone"),
        "email": member.get("email"),
        "status": member.get("status"),
        "sex": member.get("sex"),
        "commune": member.get("commune"),
        "birth_date": member.get("birth_date"),
        "avatar_url": member.get("avatar_url"),
        "created_at": member.get("created_at"),
    }


def _require_member(request, member_id: str | None = None):
    token_data = parse_member_token(request)
    if not token_data:
        return None, error_response("Session membre invalide ou expirée.", 401)
    token_member_id = str(token_data.get("member_id") or "")
    if member_id and token_member_id != str(member_id):
        return None, error_response("Accès membre refusé.", 403)
    rows = supabase.select("members", f"select=*&id=eq.{token_member_id}")
    if not rows:
        return None, error_response("Membre introuvable.", 404)
    member = rows[0]
    if not _phones_match(member.get("phone"), token_data.get("phone")):
        return None, error_response("Session membre invalide ou expirée.", 401)
    return member, None


def _bootstrap_admin_auth() -> dict:
    admin_email = _normalize_email(os.getenv("ADMIN_EMAIL"))
    admin_password = os.getenv("ADMIN_PASSWORD") or ""
    super_email = _normalize_email(os.getenv("SUPERADMIN_EMAIL"))
    super_password = os.getenv("SUPERADMIN_PASSWORD") or ""
    data = {
        "superadmin": {
            "email": super_email,
            "password_hash": make_password(super_password) if super_email and super_password else "",
            "active": True,
        },
        "admins": [],
    }
    if admin_email:
        data["admins"].append(
            {
                "id": str(uuid.uuid4()),
                "email": admin_email,
                "password_hash": make_password(admin_password) if admin_password else "",
                "active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
    _save_admin_auth(data)
    return data


def _load_admin_auth() -> dict:
    if ADMIN_AUTH_FILE.exists():
        try:
            data = json.loads(ADMIN_AUTH_FILE.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                # Migration vers un format avec plusieurs admins
                if "admins" not in data:
                    legacy_admin = data.get("admin") or {}
                    data["admins"] = []
                    if legacy_admin.get("email"):
                        data["admins"].append(
                            {
                                "id": str(uuid.uuid4()),
                                "email": _normalize_email(legacy_admin.get("email")),
                                "password_hash": legacy_admin.get("password_hash") or "",
                                "active": True,
                                "created_at": datetime.now(timezone.utc).isoformat(),
                            }
                        )
                    data.pop("admin", None)
                if "superadmin" not in data:
                    data["superadmin"] = {"email": "", "password_hash": "", "active": True}
                if not _normalize_email((data.get("superadmin") or {}).get("email")) and _normalize_email(os.getenv("SUPERADMIN_EMAIL")):
                    return _bootstrap_admin_auth()
                _save_admin_auth(data)
                return data
        except Exception:
            pass
    return _bootstrap_admin_auth()


def _bootstrap_admins() -> list[dict]:
    auth_data = _load_admin_auth()
    super_user = auth_data.get("superadmin") or {}
    legacy_admins = auth_data.get("admins") or []
    
    bootstrapped = []
    if super_user.get("email"):
        super_payload = {
            "email": _normalize_email(super_user.get("email")),
            "password_hash": super_user.get("password_hash"),
            "role": "superadmin",
            "active": super_user.get("active", True)
        }
        try:
            supabase.insert("admins", super_payload)
            bootstrapped.append(super_payload)
        except Exception:
            pass

    for admin in legacy_admins:
        if admin.get("email"):
            admin_payload = {
                "email": _normalize_email(admin.get("email")),
                "password_hash": admin.get("password_hash"),
                "role": admin.get("role", "communication"),
                "active": admin.get("active", True)
            }
            try:
                supabase.insert("admins", admin_payload)
                bootstrapped.append(admin_payload)
            except Exception:
                pass
    return bootstrapped


def _get_admin_by_email(email: str) -> dict | None:
    normalized = _normalize_email(email)
    try:
        rows = supabase.select("admins", f"select=*&email=eq.{normalized}")
        if rows:
            return rows[0]
        
        # Check if table exists but is empty
        all_rows = supabase.select("admins", "select=id")
        if not all_rows:
            _bootstrap_admins()
            rows = supabase.select("admins", f"select=*&email=eq.{normalized}")
            if rows:
                return rows[0]
    except Exception:
        # Fallback to local admin_auth.json
        pass

    # Fallback: read local admin_auth.json
    auth_data = _load_admin_auth()
    super_user = auth_data.get("superadmin") or {}
    if normalized == _normalize_email(super_user.get("email")):
        return {
            "id": "legacy-superadmin",
            "email": super_user.get("email"),
            "password_hash": super_user.get("password_hash"),
            "role": "superadmin",
            "active": super_user.get("active", True),
        }
    for admin in auth_data.get("admins", []):
        if normalized == _normalize_email(admin.get("email")):
            return {
                "id": admin.get("id"),
                "email": admin.get("email"),
                "password_hash": admin.get("password_hash"),
                "role": admin.get("role", "communication"),  # Default role for legacy admins
                "active": admin.get("active", True),
            }
    return None


def _list_create(table, order="created_at.desc"):
    @api_view(["GET", "POST"])
    def view(request):
        if request.method == "GET":
            try:
                return data_response(supabase.select(table, f"select=*&order={order}"))
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error fetching from {table}: {e}")
                return data_response([])
        try:
            return data_response(supabase.insert(table, body_json(request)), 201)
        except Exception as e:
            return error_response(f"Création impossible: {str(e)}", 400)

    return view


def _detail(table):
    @api_view(["GET", "PATCH", "DELETE"])
    def view(request, record_id):
        if request.method == "GET":
            try:
                rows = supabase.select(table, f"select=*&id=eq.{record_id}")
                if not rows:
                    return error_response("Not found", 404)
                return data_response(rows[0])
            except Exception as e:
                return error_response(f"Not found: {str(e)}", 404)
        if request.method == "PATCH":
            try:
                return data_response(supabase.update(table, "id", record_id, body_json(request)))
            except Exception as e:
                return error_response(f"Modification impossible: {str(e)}", 400)
        try:
            supabase.delete(table, "id", record_id)
            return status_response()
        except Exception as e:
            return error_response(f"Suppression impossible: {str(e)}", 400)

    return view


articles = _list_create("articles")
article_detail = _detail("articles")
@api_view(["GET", "POST"])
def events(request):
    if request.method == "GET":
        order = "event_date.desc"
        try:
            return data_response(supabase.select("events", f"select=*&order={order}"))
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error fetching events: {e}")
            return data_response([])
    
    # POST
    payload = body_json(request)
    try:
        new_event = supabase.insert("events", payload)
        # Trigger event bus
        try:
            from . import event_bus
            event_bus.dispatch("event.created", new_event)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Event bus dispatch failed: {e}")
        return data_response(new_event, 201)
    except Exception as e:
        return error_response(f"Création d'événement impossible: {str(e)}", 400)

event_detail = _detail("events")
partners = _list_create("partners")
partner_detail = _detail("partners")
testimonials = _list_create("testimonials")
testimonial_detail = _detail("testimonials")
gallery_albums = _list_create("gallery_albums")
gallery_album_detail = _detail("gallery_albums")
gallery_photos = _list_create("gallery_photos")
gallery_photo_detail = _detail("gallery_photos")
team_members = _list_create("team_members", "sort_order.asc,created_at.desc")
team_member_detail = _detail("team_members")


@api_view(["POST"])
def admin_login(request):
    payload = body_json(request)
    now_ts = time.time()
    _prune_login_attempts(now_ts)
    ip = _get_client_ip(request)
    if _is_rate_limited(ip, now_ts):
        return error_response("Trop de tentatives. Réessayez dans quelques minutes.", 429)

    email = _normalize_email(payload.get("email"))
    password = payload.get("password") or ""
    admin = _get_admin_by_email(email)

    if not admin:
        _record_failed_attempt(ip, now_ts)
        return error_response("Identifiants incorrects.", 401)

    if admin.get("active") is False:
        _record_failed_attempt(ip, now_ts)
        return error_response("Compte désactivé.", 403)
    password_hash = admin.get("password_hash") or ""
    if not password_hash or not check_password(password, password_hash):
        _record_failed_attempt(ip, now_ts)
        return error_response("Identifiants incorrects.", 401)

    _LOGIN_ATTEMPTS.pop(ip, None)
    role = admin.get("role", "communication")
    if role == "superadmin":
        return error_response("Utilisez la route superadmin dédiée.", 403)
    token = create_admin_token(email, role)
    response = data_response({"role": role, "email": email})
    return _set_session_cookie(response, ADMIN_COOKIE_NAME, token, django_settings.ADMIN_TOKEN_TTL_SECONDS)


@api_view(["POST"])
def superadmin_login(request):
    payload = body_json(request)
    now_ts = time.time()
    _prune_login_attempts(now_ts)
    ip = _get_client_ip(request)
    if _is_rate_limited(ip, now_ts):
        return error_response("Trop de tentatives. Réessayez dans quelques minutes.", 429)

    email = _normalize_email(payload.get("email"))
    password = payload.get("password") or ""
    admin = _get_admin_by_email(email)

    if not admin or admin.get("role") != "superadmin":
        _record_failed_attempt(ip, now_ts)
        return error_response("Identifiants incorrects.", 401)
    if admin.get("active") is False:
        _record_failed_attempt(ip, now_ts)
        return error_response("Compte superadmin désactivé.", 403)
    password_hash = admin.get("password_hash") or ""
    if not password_hash or not check_password(password, password_hash):
        _record_failed_attempt(ip, now_ts)
        return error_response("Identifiants incorrects.", 401)

    _LOGIN_ATTEMPTS.pop(ip, None)
    token = create_admin_token(email, "superadmin")
    response = data_response({"role": "superadmin", "email": email})
    return _set_session_cookie(response, ADMIN_COOKIE_NAME, token, django_settings.ADMIN_TOKEN_TTL_SECONDS)


@api_view(["POST"])
def portal_login(request):
    payload = body_json(request)
    now_ts = time.time()
    _prune_login_attempts(now_ts)
    ip = _get_client_ip(request)
    if _is_rate_limited(ip, now_ts):
        return error_response("Trop de tentatives. Réessayez dans quelques minutes.", 429)

    email = _normalize_email(payload.get("email"))
    password = payload.get("password") or ""
    admin = _get_admin_by_email(email)

    if not admin:
        _record_failed_attempt(ip, now_ts)
        return error_response("Identifiants incorrects.", 401)

    if admin.get("active") is False:
        _record_failed_attempt(ip, now_ts)
        return error_response("Compte désactivé.", 403)
    password_hash = admin.get("password_hash") or ""
    if not password_hash or not check_password(password, password_hash):
        _record_failed_attempt(ip, now_ts)
        return error_response("Identifiants incorrects.", 401)

    _LOGIN_ATTEMPTS.pop(ip, None)
    role = admin.get("role", "communication")
    token = create_admin_token(email, role)
    response = data_response({"role": role, "email": email})
    return _set_session_cookie(response, ADMIN_COOKIE_NAME, token, django_settings.ADMIN_TOKEN_TTL_SECONDS)


@api_view(["POST"])
def admin_logout(request):
    try:
        response = data_response("Déconnecté avec succès")
        return _clear_session_cookie(response, ADMIN_COOKIE_NAME)
    except Exception:
        return data_response("Déconnecté avec succès")


@api_view(["GET"])
def admin_me(request):
    token_data = parse_admin_token(request.headers.get("Authorization") or request.COOKIES.get(ADMIN_COOKIE_NAME))
    if not token_data:
        return error_response("Unauthorized", 401)
    return data_response({"role": token_data.get("role"), "email": token_data.get("email")})


@api_view(["POST"])
def member_logout(request):
    try:
        response = data_response("Déconnecté avec succès")
        return _clear_session_cookie(response, MEMBER_COOKIE_NAME)
    except Exception:
        return data_response("Déconnecté avec succès")


@api_view(["POST"])
def admin_change_credentials(request):
    token_data = parse_admin_token(request.headers.get("Authorization") or request.COOKIES.get(ADMIN_COOKIE_NAME))
    if not token_data:
        return error_response("Unauthorized", 401)

    caller_role = token_data.get("role")
    if caller_role != "superadmin":
        return error_response("Accès réservé au superadmin.", 403)

    payload = body_json(request)
    target_role = str(payload.get("target_role") or "").strip().lower()
    target_email = _normalize_email(payload.get("target_email"))
    new_password = payload.get("new_password") or ""

    if target_role not in {"admin", "superadmin"}:
        return error_response("target_role invalide.", 422)

    if not target_email:
        return error_response("L'email cible est requis.", 422)

    if new_password and len(new_password) < 10:
        return error_response("Le nouveau mot de passe doit contenir au moins 10 caractères.", 422)

    auth_data = _load_admin_auth()
    target_user = {}
    target_admin_index = -1
    if target_role == "superadmin":
        target_user = auth_data.get("superadmin") or {}
    else:
        for idx, adm in enumerate(auth_data.get("admins", [])):
            if _normalize_email(adm.get("email")) == target_email:
                target_user = adm
                target_admin_index = idx
                break
        if not target_user and auth_data.get("admins"):
            if caller_role == "admin":
                for idx, adm in enumerate(auth_data.get("admins", [])):
                    if _normalize_email(adm.get("email")) == caller_email:
                        target_user = adm
                        target_admin_index = idx
                        break

    current_email_stored = _normalize_email(target_user.get("email"))
    current_hash = target_user.get("password_hash") or ""

    target_user["email"] = target_email
    if new_password:
        target_user["password_hash"] = make_password(new_password)
    if target_role == "superadmin":
        auth_data["superadmin"] = target_user
    else:
        if target_admin_index >= 0:
            auth_data["admins"][target_admin_index] = target_user
        else:
            target_user.setdefault("id", str(uuid.uuid4()))
            target_user.setdefault("active", True)
            target_user.setdefault("created_at", datetime.now(timezone.utc).isoformat())
            auth_data.setdefault("admins", []).append(target_user)
    _save_admin_auth(auth_data)

    return data_response(
        {
            "updated_role": target_role,
            "updated_email": target_email,
            "password_updated": bool(new_password),
        }
    )


@api_view(["GET"])
def superadmin_dashboard(request):
    token_data, error = _require_superadmin(request)
    if error:
        return error
    members_rows = supabase.select("members", "select=id")
    events_rows = supabase.select("events", "select=id")
    registrations = supabase.select("event_registrations", "select=id")
    auth_data = _load_admin_auth()
    super_email = _normalize_email((auth_data.get("superadmin") or {}).get("email"))
    admins = [a for a in auth_data.get("admins", []) if _normalize_email(a.get("email")) != super_email]
    local_settings = load_local_settings()
    settings_data = local_settings if local_settings is not None else DEFAULT_SETTINGS
    try:
        rows = supabase.select("settings", "select=*")
        if rows:
            settings_data = rows[0]
    except Exception:
        pass
    logs = superadmin_logs(request).content
    logs_json = json.loads(logs.decode("utf-8")).get("data", [])
    return data_response(
        {
            "total_users": len(members_rows),
            "total_admins": len([a for a in admins if a.get("active", True)]),
            "total_activities": len(events_rows),
            "total_registrations": len(registrations),
            "site_under_maintenance": bool(settings_data.get("site_under_maintenance")),
            "maintenance_message": settings_data.get("maintenance_message") or "",
            "last_actions": logs_json[:10],
            "actor": token_data.get("email"),
        }
    )


@api_view(["GET", "POST"])
def superadmin_admins(request):
    token_data, error = _require_superadmin(request)
    if error:
        return error
    auth_data = _load_admin_auth()
    super_email = _normalize_email((auth_data.get("superadmin") or {}).get("email"))
    
    if request.method == "GET":
        try:
            rows = supabase.select("admins", "select=*&order=created_at.desc")
            admins = [
                {
                    "id": admin.get("id"),
                    "email": admin.get("email"),
                    "role": admin.get("role"),
                    "active": bool(admin.get("active", True)),
                    "created_at": admin.get("created_at"),
                }
                for admin in rows
                if _normalize_email(admin.get("email")) != super_email
            ]
            return data_response(admins)
        except Exception:
            admins = [
                {
                    "id": admin.get("id"),
                    "email": admin.get("email"),
                    "role": admin.get("role", "communication"),
                    "active": bool(admin.get("active", True)),
                    "created_at": admin.get("created_at"),
                }
                for admin in auth_data.get("admins", [])
                if _normalize_email(admin.get("email")) != super_email
            ]
            return data_response(admins)

    payload = body_json(request)
    email = _normalize_email(payload.get("email"))
    password = payload.get("password") or ""
    role = payload.get("role") or "communication"
    
    if role not in {"superadmin", "president", "communication", "programme", "logistique", "finances", "secretariat"}:
        return error_response("Département / Rôle invalide.", 422)
    if not email or not password or len(password) < 10:
        return error_response("Email et mot de passe (>=10 caractères) requis.", 422)
    if email == super_email:
        return error_response("Impossible d'utiliser l'email du superadmin pour un admin.", 422)
        
    existing = _get_admin_by_email(email)
    if existing:
        return error_response("Cet admin existe déjà.", 409)
        
    new_admin = {
        "email": email,
        "password_hash": make_password(password),
        "role": role,
        "active": True
    }
    
    try:
        created = supabase.insert("admins", new_admin)
        admin_row = created[0] if isinstance(created, list) and created else created
        _log_superadmin_action(token_data.get("email", ""), "admin_created", email, {"admin_id": admin_row.get("id"), "role": role})
        return data_response({"id": admin_row.get("id"), "email": email, "role": role, "active": True}, 201)
    except Exception:
        new_admin["id"] = str(uuid.uuid4())
        new_admin["created_at"] = datetime.now(timezone.utc).isoformat()
        auth_data.setdefault("admins", []).append(new_admin)
        _save_admin_auth(auth_data)
        _log_superadmin_action(token_data.get("email", ""), "admin_created (local)", email, {"admin_id": new_admin["id"], "role": role})
        return data_response({"id": new_admin["id"], "email": email, "role": role, "active": True}, 201)


@api_view(["PATCH", "DELETE"])
def superadmin_admin_detail(request, admin_id):
    token_data, error = _require_superadmin(request)
    if error:
        return error
    payload = body_json(request)
    
    if request.method == "DELETE":
        try:
            supabase.delete("admins", "id", admin_id)
            _log_superadmin_action(token_data.get("email", ""), "admin_deleted", "", {"admin_id": str(admin_id)})
            return status_response()
        except Exception:
            auth_data = _load_admin_auth()
            auth_data["admins"] = [adm for adm in auth_data.get("admins", []) if str(adm.get("id")) != str(admin_id)]
            _save_admin_auth(auth_data)
            return status_response()

    # PATCH
    try:
        rows = supabase.select("admins", f"select=*&id=eq.{admin_id}")
        if not rows:
            return error_response("Admin introuvable.", 404)
        admin = rows[0]
        
        update_payload = {}
        if "email" in payload:
            email = _normalize_email(payload.get("email"))
            if not email:
                return error_response("Email invalide.", 422)
            update_payload["email"] = email
        if "active" in payload:
            update_payload["active"] = bool(payload.get("active"))
        if "role" in payload:
            role = payload.get("role")
            if role not in {"superadmin", "president", "communication", "programme", "logistique", "finances", "secretariat"}:
                return error_response("Rôle/Département invalide.", 422)
            update_payload["role"] = role
        if payload.get("new_password"):
            new_password = str(payload.get("new_password"))
            if len(new_password) < 10:
                return error_response("Mot de passe trop court.", 422)
            update_payload["password_hash"] = make_password(new_password)
            
        updated = supabase.update("admins", "id", admin_id, update_payload)
        admin_row = updated[0] if isinstance(updated, list) and updated else updated
        _log_superadmin_action(token_data.get("email", ""), "admin_updated", admin_row.get("email", ""), {"admin_id": str(admin_id)})
        return data_response({
            "id": admin_row.get("id"),
            "email": admin_row.get("email"),
            "role": admin_row.get("role"),
            "active": bool(admin_row.get("active", True))
        })
    except Exception:
        auth_data = _load_admin_auth()
        admins = auth_data.get("admins", [])
        idx = next((i for i, adm in enumerate(admins) if str(adm.get("id")) == str(admin_id)), -1)
        if idx < 0:
            return error_response("Admin introuvable.", 404)
        admin = admins[idx]
        if "email" in payload:
            admin["email"] = _normalize_email(payload.get("email"))
        if "active" in payload:
            admin["active"] = bool(payload.get("active"))
        if "role" in payload:
            admin["role"] = payload.get("role")
        if payload.get("new_password"):
            new_password = str(payload.get("new_password"))
            admin["password_hash"] = make_password(new_password)
        admins[idx] = admin
        auth_data["admins"] = admins
        _save_admin_auth(auth_data)
        return data_response({
            "id": admin.get("id"),
            "email": admin.get("email"),
            "role": admin.get("role", "communication"),
            "active": bool(admin.get("active", True))
        })


@api_view(["POST"])
def superadmin_reset_codes(request):
    token_data, error = _require_superadmin(request)
    if error:
        return error
    payload = body_json(request)
    auth_data = _load_admin_auth()
    admin_new = payload.get("admin_password")
    super_new = payload.get("superadmin_password")
    if admin_new:
        if len(admin_new) < 10:
            return error_response("Mot de passe admin trop court.", 422)
        for i, adm in enumerate(auth_data.get("admins", [])):
            auth_data["admins"][i]["password_hash"] = make_password(admin_new)
    if super_new:
        if len(super_new) < 10:
            return error_response("Mot de passe superadmin trop court.", 422)
        auth_data["superadmin"]["password_hash"] = make_password(super_new)
    _save_admin_auth(auth_data)
    _log_superadmin_action(token_data.get("email", ""), "codes_reset", "all", {"admin_reset": bool(admin_new), "superadmin_reset": bool(super_new)})
    return data_response({"status": "ok"})


@api_view(["GET"])
def superadmin_logs(request):
    token_data, error = _require_superadmin(request)
    if error:
        return error
    try:
        rows = supabase.select("superadmin_logs", "select=*&order=created_at.desc")
        return data_response(rows)
    except Exception:
        fallback = Path(django_settings.BASE_DIR) / "superadmin_logs.json"
        if fallback.exists():
            try:
                rows = json.loads(fallback.read_text(encoding="utf-8"))
                return data_response(rows)
            except Exception:
                pass
        return data_response([])


@api_view(["GET", "POST"])
def members(request):
    if request.method == "GET":
        rows = supabase.select("members", "select=*&order=created_at.desc")
        q = (request.GET.get("q") or "").strip().lower()
        if not q:
            return data_response(rows)
        lower_q = q.lower()
        filtered = [
            row
            for row in rows
            if lower_q in (row.get("full_name") or "").lower()
            or lower_q in (row.get("email") or "").lower()
            or lower_q in (row.get("phone") or "").lower()
            or lower_q in (row.get("status") or "").lower()
        ]
        return data_response(filtered)
    payload = body_json(request)
    payload["full_name"] = " ".join(str(payload.get("full_name") or "").split())
    payload["phone"] = str(payload.get("phone") or "").strip()
    payload["email"] = _normalize_email(payload.get("email"))
    # Status is always aspirant at inscription — cannot be self-assigned
    payload["status"] = "aspirant"
    if not payload["full_name"] or not _normalize_phone(payload["phone"]):
        return error_response("Nom complet et numéro de téléphone requis.", 422)

    existing = supabase.select("members", "select=*&order=created_at.desc")
    duplicate = next((member for member in existing if _phones_match(member.get("phone"), payload["phone"])), None)
    if duplicate:
        return error_response("Ce numéro de téléphone est déjà enregistré. Veuillez vous connecter.", 409)

    created = supabase.insert("members", payload)
    member = created[0] if isinstance(created, list) and created else created
    token = create_member_token(str(member.get("id")), str(member.get("phone") or ""))
    response = data_response({"member": _public_member_payload(member)}, 201)
    return _set_session_cookie(response, MEMBER_COOKIE_NAME, token, django_settings.MEMBER_TOKEN_TTL_SECONDS)


@api_view(["POST"])
def member_login(request):
    now_ts = time.time()
    _prune_login_attempts(now_ts)
    rate_limit_key = f"member:{_get_client_ip(request)}"
    if _is_rate_limited(rate_limit_key, now_ts):
        return error_response("Trop de tentatives. Réessayez dans quelques minutes.", 429)
    payload = body_json(request)
    full_name = _normalize_name(payload.get("full_name"))
    phone = _normalize_phone(payload.get("phone"))
    if not full_name or not phone:
        return error_response("Nom complet et numéro de téléphone requis.", 422)

    members_rows = supabase.select("members", "select=*&order=created_at.desc")
    match = next(
        (
            row
            for row in members_rows
            if _phones_match(row.get("phone"), phone) and _normalize_name(row.get("full_name")) == full_name
        ),
        None,
    )
    if not match:
        _record_failed_attempt(rate_limit_key, now_ts)
        return error_response("Aucun membre correspondant. Vérifiez le nom complet et le numéro.", 401)

    _LOGIN_ATTEMPTS.pop(rate_limit_key, None)
    token = create_member_token(str(match.get("id")), str(match.get("phone") or ""))
    response = data_response({"member": _public_member_payload(match)})
    return _set_session_cookie(response, MEMBER_COOKIE_NAME, token, django_settings.MEMBER_TOKEN_TTL_SECONDS)


@api_view(["PATCH"])
def member_status(request, member_id):
    token_data = parse_admin_token(request.headers.get("Authorization") or request.COOKIES.get(ADMIN_COOKIE_NAME))
    if not token_data or token_data.get("role") not in {"admin", "superadmin", "president", "secretariat"}:
        return error_response("Forbidden: Seul le secrétariat ou le superadmin peut modifier le statut.", 403)
    return data_response(supabase.update("members", "id", member_id, body_json(request)))


@api_view(["GET", "PATCH"])
def member_detail(request, member_id):
    token_data = parse_admin_token(request.headers.get("Authorization") or request.COOKIES.get(ADMIN_COOKIE_NAME))
    allowed_admin_roles = {"admin", "superadmin", "president", "secretariat", "logistique", "programme", "activites"}
    if not token_data or token_data.get("role") not in allowed_admin_roles:
        current_member, error = _require_member(request, str(member_id))
        if error:
            return error
    else:
        current_member = None

    if request.method == "GET":
        rows = supabase.select("members", f"select=*&id=eq.{member_id}")
        if not rows:
            return error_response("Member not found", 404)
        return data_response(_public_member_payload(rows[0]) if not token_data else rows[0])

    # PATCH
    payload = body_json(request)
    if token_data:
        admin_role = token_data.get("role")
        if admin_role not in {"admin", "superadmin", "president", "secretariat", "logistique"}:
            return error_response("Forbidden: Votre rôle ne vous permet pas de modifier les membres.", 403)
        
        if admin_role == "logistique":
            allowed_fields = {"interview_passed", "tshirt_received", "is_pco", "commission", "integration_note"}
            payload = {k: v for k, v in payload.items() if k in allowed_fields}
    elif current_member:
        payload = {
            "full_name": " ".join(str(payload.get("full_name") or current_member.get("full_name") or "").split()),
            "phone": str(payload.get("phone") or current_member.get("phone") or "").strip(),
            "email": _normalize_email(payload.get("email") or current_member.get("email")),
            "sex": payload.get("sex") or current_member.get("sex") or "non_precise",
            "birth_date": payload.get("birth_date", current_member.get("birth_date")),
            "commune": payload.get("commune") or current_member.get("commune") or "",
        }
        if "avatar_url" in body_json(request):
            raw = body_json(request).get("avatar_url")
            if raw is None or (isinstance(raw, str) and len(raw) < 5_000_000):
                payload["avatar_url"] = raw
    else:
        return error_response("Accès refusé.", 403)

    return data_response(supabase.update("members", "id", member_id, payload))


@api_view(["GET"])
def member_activities(request, member_id):
    token_data = parse_admin_token(request.headers.get("Authorization") or request.COOKIES.get(ADMIN_COOKIE_NAME))
    allowed_admin_roles = {"admin", "superadmin", "president", "secretariat", "logistique", "programme", "activites", "finances", "communication"}
    if not token_data or token_data.get("role") not in allowed_admin_roles:
        _, error = _require_member(request, str(member_id))
        if error:
            return error
    member_rows = supabase.select("members", f"select=*&id=eq.{member_id}")
    if not member_rows:
        return error_response("Member not found", 404)
    member = member_rows[0]

    registrations = supabase.select(
        "event_registrations",
        f"select=*&member_id=eq.{member_id}&order=created_at.desc",
    )
    events = supabase.select("events", "select=id,title,event_date,location")
    event_map = {event["id"]: event for event in events}
    detailed = []
    attended_count = 0
    for reg in registrations:
        event = event_map.get(reg.get("event_id"), {})
        attended = reg.get("attended") is True
        if attended:
            attended_count += 1
        detailed.append(
            {
                **reg,
                "event_title": event.get("title"),
                "event_date": event.get("event_date"),
                "event_location": event.get("location"),
            }
        )

    age = None
    birth_date = member.get("birth_date")
    if birth_date:
        try:
            dob = datetime.strptime(birth_date, "%Y-%m-%d").date()
            today = datetime.now(timezone.utc).date()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        except Exception:
            age = None

    return data_response(
        {
            "member": member,
            "summary": {
                "registrations_total": len(registrations),
                "activities_participated": attended_count,
                "status": member.get("status", "aspirant"),
                "birth_date": birth_date,
                "age": age,
            },
            "activities": detailed,
        }
    )


@api_view(["POST"])
def event_register(request, event_id):
    payload = body_json(request)
    member, error = _require_member(request, str(payload.get("member_id") or ""))
    if error:
        return error
    rows = supabase.select("events", f"select=id,capacity,registered,event_date&id=eq.{event_id}")
    if not rows:
        return error_response("Event not found", 404)

    event = rows[0]
    
    event_date_str = event.get("event_date")
    if event_date_str:
        try:
            event_date = datetime.strptime(event_date_str[:10], "%Y-%m-%d").date()
            if event_date < datetime.now(timezone.utc).date():
                return error_response("Cette activité est passée. Les inscriptions sont fermées.", 400)
        except Exception:
            pass

    capacity = event.get("capacity") or 0
    registered = event.get("registered") or 0
    if capacity and registered >= capacity:
        return error_response("Event capacity reached", 409)

    member_id = member.get("id")
    if not member_id:
        return error_response("Authentication required: member_id is required", 401)
    payload["full_name"] = member.get("full_name") or ""
    payload["phone"] = member.get("phone") or ""
    payload["email"] = member.get("email") or ""
    payload["member_status"] = payload.get("member_status") or member.get("status") or "aspirant"
    payload["sex"] = payload.get("sex") or member.get("sex") or "non_precise"
    if not payload.get("full_name") or not payload.get("phone"):
        return error_response("full_name and phone are required", 422)

    # Check if already registered (with phone prefix tolerance)
    registrations = supabase.select("event_registrations", f"select=*&event_id=eq.{event_id}")
    duplicate_reg = next(
        (r for r in registrations if str(r.get("member_id")) == str(member_id) or _phones_match(r.get("phone"), payload.get("phone"))),
        None
    )
    if duplicate_reg:
        return error_response("Vous êtes déjà inscrit à cette activité.", 409)

    payload["event_id"] = str(event_id)
    payload["member_status"] = payload.get("member_status") or payload.get("status") or "aspirant"
    payload["attended"] = False
    try:
        created = supabase.insert("event_registrations", payload)
    except Exception as exc:
        msg = str(exc)
        if "duplicate key value violates unique constraint" in msg or "event_registrations_event_id_phone_key" in msg:
            return error_response("Vous êtes déjà inscrit à cette activité avec ce numéro.", 409)
        return error_response("Une erreur technique est survenue. Veuillez réessayer.", 500)
    supabase.update("events", "id", event_id, {"registered": registered + 1})
    return data_response(created, 201)


@api_view(["POST"])
def event_quick_checkin(request, event_id):
    payload = body_json(request)
    
    # 1. Fetch event to verify existence and capacity
    rows = supabase.select("events", f"select=id,capacity,registered,title,whatsapp_link,event_date&id=eq.{event_id}")
    if not rows:
        return error_response("Activité introuvable.", 404)
    event = rows[0]

    event_date_str = event.get("event_date")
    if event_date_str:
        try:
            event_date = datetime.strptime(event_date_str[:10], "%Y-%m-%d").date()
            if event_date < datetime.now(timezone.utc).date():
                return error_response("Cette activité est passée. Les inscriptions sont fermées.", 400)
        except Exception:
            pass
    
    phone = _normalize_phone(payload.get("phone"))
    if not phone:
        return error_response("Numéro de téléphone requis.", 422)

    # 2. Check if member exists in the database
    members_rows = supabase.select("members", "select=*")
    member = next(
        (m for m in members_rows if _phones_match(m.get("phone"), phone)),
        None
    )

    if not member:
        # If it's just checking phone number lookup, return not_found status
        if not payload.get("full_name"):
            return data_response({"status": "not_member", "phone": phone})
            
        # Create a new member since info is provided
        new_member_payload = {
            "full_name": " ".join(str(payload.get("full_name") or "").split()),
            "phone": payload.get("phone"),
            "sex": payload.get("sex") or "non_precise",
            "commune": payload.get("commune") or "Cocody",
            "birth_date": payload.get("birth_date") or None,
            "status": "aspirant"
        }
        if not new_member_payload["full_name"]:
            return error_response("Nom complet requis pour l'inscription.", 422)
            
        try:
            created_members = supabase.insert("members", new_member_payload)
            member = created_members[0] if isinstance(created_members, list) and created_members else created_members
        except Exception as exc:
            return error_response(f"Erreur lors de la création du membre: {str(exc)}", 500)

    # 3. Register member to the event and mark as attended
    registrations = supabase.select("event_registrations", f"select=*&event_id=eq.{event_id}")
    existing_reg = next(
        (r for r in registrations if str(r.get("member_id")) == str(member.get("id")) or _phones_match(r.get("phone"), phone)),
        None
    )

    already_registered = False
    if existing_reg:
        already_registered = True
        # Mark as attended if not already done
        if not existing_reg.get("attended"):
            supabase.update("event_registrations", "id", existing_reg.get("id"), {"attended": True})
    else:
        # Check capacity
        capacity = event.get("capacity") or 0
        registered = event.get("registered") or 0
        if capacity and registered >= capacity:
            return error_response("La capacité maximale de cette activité est atteinte.", 409)
            
        # Create registration with attended=True
        reg_payload = {
            "event_id": str(event_id),
            "member_id": str(member.get("id")),
            "full_name": member.get("full_name"),
            "phone": member.get("phone"),
            "email": member.get("email") or "",
            "member_status": member.get("status") or "aspirant",
            "sex": member.get("sex") or "non_precise",
            "attended": True
        }
        try:
            supabase.insert("event_registrations", reg_payload)
            supabase.update("events", "id", event_id, {"registered": registered + 1})
        except Exception as exc:
            return error_response(f"Erreur d'inscription: {str(exc)}", 500)

    return data_response({
        "status": "success",
        "member": {
            "id": member.get("id"),
            "full_name": member.get("full_name"),
            "phone": member.get("phone"),
            "status": member.get("status"),
        },
        "already_registered": already_registered,
        "event": {
            "id": event.get("id"),
            "title": event.get("title"),
            "whatsapp_link": event.get("whatsapp_link"),
        }
    })


@api_view(["GET"])
def event_registrations(request, event_id):
    rows = supabase.select("event_registrations", f"select=*&event_id=eq.{event_id}&order=created_at.desc")
    return data_response(rows)


@api_view(["GET"])
def event_is_registered(request, event_id):
    member, error = _require_member(request, str(request.GET.get("member_id") or ""))
    if error:
        return error
    member_id = (request.GET.get("member_id") or "").strip()
    rows = supabase.select("event_registrations", f"select=member_id,phone&event_id=eq.{event_id}")
    exists = False
    for row in rows:
        if member_id and str(row.get("member_id") or "") == member_id:
            exists = True
            break
        if _phones_match(row.get("phone"), member.get("phone")):
            exists = True
            break
    return data_response({"registered": exists})


@api_view(["PATCH"])
def event_attendance(request, event_id, registration_id):
    payload = body_json(request)
    attended = bool(payload.get("attended", payload.get("present", True)))
    updated = supabase.update(
        "event_registrations",
        "id",
        registration_id,
        {"attended": attended, "checked_in_at": datetime.now(timezone.utc).isoformat() if attended else None},
    )
    return data_response(updated)


@api_view(["GET"])
def attendance_summary(request, event_id):
    rows = supabase.select("event_registrations", f"select=*&event_id=eq.{event_id}")
    total = len(rows)
    attended = sum(1 for row in rows if row.get("attended") is True)
    return data_response(
        {
            "event_id": event_id,
            "total_registered": total,
            "attended": attended,
            "percentage_attended": (attended / total * 100) if total else 0,
        }
    )


@api_view(["GET", "POST"])
def contributions(request):
    if request.method == "GET":
        return data_response(supabase.select("contributions", "select=*&order=created_at.desc"))
    return initiate_contribution(request)


@api_view(["POST"])
def initiate_contribution(request):
    payload = body_json(request)
    amount = int(payload.get("amount") or 0)
    if amount <= 0:
        return error_response("Amount must be greater than 0", 422)

    payment_url = payload.get("payment_url")
    if not payment_url:
        links = supabase.select("payment_links", "select=*&active=eq.true&order=min_amount.desc")
        matching_links = [
            link
            for link in links
            if (link.get("min_amount") is None or amount >= link.get("min_amount"))
            and (link.get("max_amount") is None or amount <= link.get("max_amount"))
        ]
        if matching_links:
            payment_url = matching_links[0].get("url")

    if not payment_url:
        return error_response("No payment link configured for this amount", 422)

    payload["amount"] = amount
    payload["payment_url"] = payment_url
    payload.setdefault("status", "pending")
    return data_response(supabase.insert("contributions", payload), 201)


@api_view(["PATCH"])
def confirm_contribution(request, contribution_id):
    payload = body_json(request)
    if "providerReference" in payload:
        payload["provider_reference"] = payload.pop("providerReference")
    payload.setdefault("status", "paid")
    return data_response(supabase.update("contributions", "id", contribution_id, payload))


@api_view(["GET", "POST"])
def payment_links(request):
    if request.method == "GET":
        return data_response(supabase.select("payment_links", "select=*&order=min_amount.asc"))
    payload = body_json(request)
    payload.setdefault("active", True)
    return data_response(supabase.insert("payment_links", payload), 201)


@api_view(["PATCH", "DELETE"])
def payment_link_detail(request, link_id):
    if request.method == "PATCH":
        return data_response(supabase.update("payment_links", "id", link_id, body_json(request)))
    supabase.delete("payment_links", "id", link_id)
    return status_response()


@api_view(["POST"])
def newsletter_subscribe(request):
    payload = body_json(request)
    email = str(payload.get("email") or "").strip().lower()
    if not email or "@" not in email:
        return error_response("Adresse email invalide.", 422)

    created = supabase.insert("newsletter_subscribers", {"email": email})

    receiver_email = ""
    try:
        rows = supabase.select("settings", "select=*")
        if rows:
            receiver_email = str(rows[0].get("newsletter_receiver_email") or "").strip()
    except Exception:
        local_settings = load_local_settings() or DEFAULT_SETTINGS
        receiver_email = str(local_settings.get("newsletter_receiver_email") or "").strip()

    if not receiver_email:
        local_settings = load_local_settings() or DEFAULT_SETTINGS
        receiver_email = str(local_settings.get("newsletter_receiver_email") or "").strip()

    if receiver_email:
        try:
            send_mail(
                subject="Nouvel abonnement newsletter",
                message=f"Nouvel abonné newsletter: {email}",
                from_email=None,
                recipient_list=[receiver_email],
                fail_silently=True,
            )
        except Exception:
            pass

    return data_response({"subscription": created}, 201)


@api_view(["GET"])
def newsletter_subscribers(request):
    return data_response(supabase.select("newsletter_subscribers", "select=*&order=created_at.desc"))


@api_view(["GET"])
def stats(request):
    members_rows = supabase.select("members", "select=id")
    events_rows = supabase.select("events", "select=id")
    partners_rows = supabase.select("partners", "select=id")
    testimonials_rows = supabase.select("testimonials", "select=id")
    registrations = supabase.select("event_registrations", "select=attended")
    return data_response(
        {
            "ureporters_active": len(members_rows),
            "events_organized": len(events_rows),
            "partners_local": len(partners_rows),
            "testimonials_count": len(testimonials_rows),
            "registrations_total": len(registrations),
            "attendance_total": sum(1 for row in registrations if row.get("attended") is True),
        }
    )


SETTINGS_FILE_PATH = django_settings.BASE_DIR / "site_settings.json"

DEFAULT_SETTINGS = {
    "hero_title": "Engagez-vous pour Cocody",
    "hero_subtitle": "La voix de la jeunesse Ivoirienne",
    "hero_description": "Rejoignez la plus grande communauté de jeunes engagés. Participez à nos actions, donnez votre avis et contribuez au développement de notre commune.",
    "hero_image_url": "https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
    "about_title": "Plus qu'une communauté, un mouvement.",
    "about_description": "U-Report est une plateforme sociale développée par l'UNICEF pour engager les jeunes et les communautés. À Cocody, nous utilisons cet outil pour identifier les problèmes locaux, proposer des solutions et agir concrètement sur le terrain.",
    "facebook_url": "https://www.facebook.com/share/1DoAeSBX6n/?mibextid=wwXIfr",
    "instagram_url": "https://www.instagram.com/communaute_ureportcocody?igsh=cDk4Nm0wcDdyZThs",
    "tiktok_url": "https://www.tiktok.com/@ureportcocody?_r=1&_t=ZS-96SxX2CetXu",
    "whatsapp_group_link": "",
    "whatsapp_manager_link": "",
    "whatsapp_message_aspirant": "Bonjour, je suis {name} ({status_label}) et je viens de m'inscrire à l'activité \"{event_title}\". Merci de m'ajouter au groupe d'intégration.",
    "whatsapp_message_advanced": "Bonjour, je suis {name} ({status_label}) et je viens de m'inscrire à l'activité \"{event_title}\". Je souhaite finaliser mon intégration.",
    "footer_contact_title": "Contact",
    "footer_contact_address": "Mairie de Cocody,\nAbidjan, Côte d'Ivoire",
    "footer_contact_phone": "+225 00 00 00 00 00",
    "footer_contact_email": "contact@ureportcocody.ci",
    "footer_newsletter_title": "Newsletter",
    "footer_newsletter_text": "Restez informé de nos prochaines activités et opportunités d'engagement.",
    "footer_newsletter_placeholder": "Votre adresse email",
    "footer_newsletter_button": "S'abonner",
    "newsletter_receiver_email": "contact@ureportcocody.ci",
    "site_under_maintenance": False,
    "maintenance_message": "Le site est temporairement en maintenance.",
    "maintenance_image_url": "/images/logo-512.png",
}

def load_local_settings():
    if os.path.exists(SETTINGS_FILE_PATH):
        try:
            with open(SETTINGS_FILE_PATH, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                if isinstance(loaded, dict):
                    merged = dict(DEFAULT_SETTINGS)
                    merged.update({k: v for k, v in loaded.items() if v is not None})
                    return merged
        except Exception:
            pass
    return None

def save_local_settings(data):
    try:
        with open(SETTINGS_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def _merged_site_settings(remote_settings: dict | None = None, prefer_local: bool = True) -> dict:
    merged = dict(DEFAULT_SETTINGS)
    local_settings = load_local_settings()
    if prefer_local:
        if isinstance(remote_settings, dict):
            merged.update({k: v for k, v in remote_settings.items() if v is not None})
        if isinstance(local_settings, dict):
            merged.update({k: v for k, v in local_settings.items() if v is not None})
    else:
        if isinstance(local_settings, dict):
            merged.update({k: v for k, v in local_settings.items() if v is not None})
        if isinstance(remote_settings, dict):
            merged.update({k: v for k, v in remote_settings.items() if v is not None})
    return merged


@api_view(["GET", "PATCH"])
def site_settings(request):
    if request.method == "GET":
        try:
            rows = supabase.select("settings", "select=*")
            if rows:
                return data_response(_merged_site_settings(rows[0]))
        except Exception:
            local = load_local_settings()
            return data_response(local if local is not None else DEFAULT_SETTINGS)
        return data_response(_merged_site_settings())

    # PATCH
    payload = body_json(request)
    valid_fields = [
        "hero_title",
        "hero_subtitle",
        "hero_description",
        "hero_image_url",
        "about_title",
        "about_description",
        "facebook_url",
        "instagram_url",
        "tiktok_url",
        "whatsapp_group_link",
        "whatsapp_manager_link",
        "whatsapp_message_aspirant",
        "whatsapp_message_advanced",
        "footer_contact_title",
        "footer_contact_address",
        "footer_contact_phone",
        "footer_contact_email",
        "footer_newsletter_title",
        "footer_newsletter_text",
        "footer_newsletter_placeholder",
        "footer_newsletter_button",
        "newsletter_receiver_email",
        "site_under_maintenance",
        "maintenance_message",
        "maintenance_image_url",
    ]
    filtered_payload = {k: v for k, v in payload.items() if k in valid_fields}

    token_data = parse_admin_token(request.headers.get("Authorization") or request.COOKIES.get(ADMIN_COOKIE_NAME))
    if "site_under_maintenance" in filtered_payload or "maintenance_message" in filtered_payload:
        if not token_data or token_data.get("role") != "superadmin":
            filtered_payload.pop("site_under_maintenance", None)
            filtered_payload.pop("maintenance_message", None)
        else:
            _log_superadmin_action(
                token_data.get("email", ""),
                "maintenance_updated",
                "site",
                {
                    "site_under_maintenance": filtered_payload.get("site_under_maintenance"),
                    "maintenance_message": filtered_payload.get("maintenance_message"),
                },
            )

    try:
        rows = supabase.select("settings", "select=*")
        if rows:
            record_id = rows[0]["id"]
            updated = supabase.update("settings", "id", record_id, filtered_payload)
            payload = updated[0] if isinstance(updated, list) and updated else updated
            if isinstance(payload, dict):
                save_local_settings(_merged_site_settings(payload, prefer_local=False))
            return data_response(payload)
        else:
            inserted = supabase.insert("settings", filtered_payload)
            payload = inserted[0] if isinstance(inserted, list) and inserted else inserted
            if isinstance(payload, dict):
                save_local_settings(_merged_site_settings(payload, prefer_local=False))
            return data_response(payload, 201)
    except Exception:
        current = _merged_site_settings()
        current.update(filtered_payload)
        save_local_settings(current)
        return data_response(current)


# --- LOGISTICS & TASKS VIEWS ---

materials = _list_create("logistics_materials", "name.asc")
material_detail = _detail("logistics_materials")

@api_view(["GET", "POST"])
def logistics_requests(request):
    if request.method == "GET":
        try:
            reqs = supabase.select("logistics_requests", "select=*&order=created_at.desc")
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error fetching logistics_requests: {e}")
            reqs = []
        if reqs:
            try:
                materials_list = {m["id"]: m for m in supabase.select("logistics_materials", "select=id,name")}
                events_list = {e["id"]: e for e in supabase.select("events", "select=id,title")}
                for r in reqs:
                    r["material"] = materials_list.get(r["material_id"])
                    r["event"] = events_list.get(r["event_id"])
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error resolving logistics relations: {e}")
        return data_response(reqs)
    
    # POST
    payload = body_json(request)
    material_id = payload.get("material_id")
    quantity = int(payload.get("quantity") or 0)
    if not material_id or quantity <= 0:
        return error_response("Matériel ou quantité invalide.", 400)
    
    try:
        m_rows = supabase.select("logistics_materials", f"select=*&id=eq.{material_id}")
    except Exception as e:
        return error_response("Impossible d'accéder au matériel.", 500)
        
    if not m_rows:
        return error_response("Matériel introuvable.", 404)
    
    material = m_rows[0]
    if material.get("available_quantity", 0) < quantity:
        return error_response(f"Quantité demandée ({quantity}) supérieure au stock disponible ({material.get('available_quantity', 0)}).", 400)
        
    try:
        created = supabase.insert("logistics_requests", payload)
        return data_response(created, 201)
    except Exception as e:
        return error_response(f"Impossible de créer la demande: {str(e)}", 400)


@api_view(["GET", "PATCH", "DELETE"])
def logistics_request_detail(request, record_id):
    if request.method == "GET":
        try:
            rows = supabase.select("logistics_requests", f"select=*&id=eq.{record_id}")
            if not rows:
                return error_response("Demande introuvable", 404)
            req = rows[0]
            # Resolve relations
            try:
                m_rows = supabase.select("logistics_materials", f"select=id,name&id=eq.{req['material_id']}")
                req["material"] = m_rows[0] if m_rows else None
            except Exception:
                req["material"] = None
            try:
                e_rows = supabase.select("events", f"select=id,title&id=eq.{req['event_id']}")
                req["event"] = e_rows[0] if e_rows else None
            except Exception:
                req["event"] = None
            return data_response(req)
        except Exception as e:
            return error_response(f"Erreur lors de la récupération: {str(e)}", 500)
        
    if request.method == "PATCH":
        try:
            rows = supabase.select("logistics_requests", f"select=*&id=eq.{record_id}")
            if not rows:
                return error_response("Demande introuvable", 404)
            old_req = rows[0]
            old_status = old_req.get("status")
            
            payload = body_json(request)
            new_status = payload.get("status")
            
            # If status changes, handle material inventory adjustment
            if new_status and new_status != old_status:
                material_id = old_req["material_id"]
                qty = old_req["quantity"]
                
                try:
                    m_rows = supabase.select("logistics_materials", f"select=*&id=eq.{material_id}")
                    if m_rows:
                        material = m_rows[0]
                        available = material.get("available_quantity", 0)
                        total = material.get("total_quantity", 0)
                        
                        updated_available = available
                        if old_status in ("pending", "rejected") and new_status == "approved":
                            if available < qty:
                                return error_response(f"Stock insuffisant. Disponible: {available}, Demandé: {qty}", 400)
                            updated_available = available - qty
                        elif old_status == "approved" and new_status in ("returned", "rejected", "pending"):
                            updated_available = min(total, available + qty)
                        
                        if updated_available != available:
                            supabase.update("logistics_materials", "id", material_id, {"available_quantity": updated_available})
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).error(f"Inventory update skipped due to database error: {e}")
            
            updated = supabase.update("logistics_requests", "id", record_id, payload)
            return data_response(updated)
        except Exception as e:
            return error_response(f"Modification impossible: {str(e)}", 400)
        
    # DELETE
    try:
        rows = supabase.select("logistics_requests", f"select=*&id=eq.{record_id}")
        if rows:
            req = rows[0]
            if req.get("status") == "approved":
                try:
                    m_rows = supabase.select("logistics_materials", f"select=*&id=eq.{req['material_id']}")
                    if m_rows:
                        material = m_rows[0]
                        supabase.update("logistics_materials", "id", req['material_id'], {
                            "available_quantity": min(material.get("total_quantity", 0), material.get("available_quantity", 0) + req.get("quantity", 0))
                        })
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).error(f"Error returning inventory during request delete: {e}")
        supabase.delete("logistics_requests", "id", record_id)
        return status_response()
    except Exception as e:
        return error_response(f"Suppression impossible: {str(e)}", 400)


@api_view(["GET", "POST"])
def tasks(request):
    if request.method == "GET":
        dept = request.GET.get("department_code")
        event = request.GET.get("event_id")
        status = request.GET.get("status")
        
        url_params = "select=*&order=created_at.desc"
        if dept:
            url_params += f"&department_code=eq.{dept}"
        if event:
            url_params += f"&event_id=eq.{event}"
        if status:
            url_params += f"&status=eq.{status}"
            
        try:
            tasks_list = supabase.select("tasks", url_params)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error fetching tasks: {e}")
            tasks_list = []
        
        if tasks_list:
            try:
                events_list = {e["id"]: e for e in supabase.select("events", "select=id,title")}
                admins_list = {a["id"]: a for a in supabase.select("admins", "select=id,email,role")}
                for t in tasks_list:
                    t["event"] = events_list.get(t["event_id"]) if t.get("event_id") else None
                    t["assigned_user"] = admins_list.get(t["assigned_user_id"]) if t.get("assigned_user_id") else None
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error resolving task relations: {e}")
        return data_response(tasks_list)
        
    # POST
    payload = body_json(request)
    try:
        created = supabase.insert("tasks", payload)
        return data_response(created, 201)
    except Exception as e:
        return error_response(f"Création de tâche impossible: {str(e)}", 400)


@api_view(["GET", "PATCH", "DELETE"])
def task_detail(request, record_id):
    if request.method == "GET":
        try:
            rows = supabase.select("tasks", f"select=*&id=eq.{record_id}")
            if not rows:
                return error_response("Tâche introuvable", 404)
            t = rows[0]
            try:
                if t.get("event_id"):
                    e_rows = supabase.select("events", f"select=id,title&id=eq.{t['event_id']}")
                    t["event"] = e_rows[0] if e_rows else None
            except Exception:
                t["event"] = None
            try:
                if t.get("assigned_user_id"):
                    a_rows = supabase.select("admins", f"select=id,email,role&id=eq.{t['assigned_user_id']}")
                    t["assigned_user"] = a_rows[0] if a_rows else None
            except Exception:
                t["assigned_user"] = None
            return data_response(t)
        except Exception as e:
            return error_response(f"Erreur de récupération: {str(e)}", 500)
        
    if request.method == "PATCH":
        payload = body_json(request)
        try:
            updated = supabase.update("tasks", "id", record_id, payload)
            return data_response(updated)
        except Exception as e:
            return error_response(f"Modification impossible: {str(e)}", 400)
        
    try:
        supabase.delete("tasks", "id", record_id)
        return status_response()
    except Exception as e:
        return error_response(f"Suppression impossible: {str(e)}", 400)


@api_view(["GET"])
def member_contributions(request, member_id):
    token_data = parse_admin_token(request.headers.get("Authorization") or request.COOKIES.get(ADMIN_COOKIE_NAME))
    if not token_data or token_data.get("role") not in {"admin", "superadmin", "finances", "president"}:
        _, error = _require_member(request, str(member_id))
        if error:
            return error

    try:
        rows = supabase.select("contributions", f"select=*&member_id=eq.{member_id}&order=created_at.desc")
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error fetching contributions: {e}")
        rows = []
    return data_response(rows)


@api_view(["GET"])
def stats_report(request):
    token_data = parse_admin_token(request.headers.get("Authorization") or request.COOKIES.get(ADMIN_COOKIE_NAME))
    if not token_data or token_data.get("role") not in {"superadmin", "president", "secretariat", "finances"}:
        return error_response("Accès non autorisé pour votre rôle.", 403)
        
    try:
        # 1. Event/Attendance Stats
        try:
            events_summary = supabase.select("event_attendance_summary", "select=*&order=attendance_rate.desc")
        except Exception:
            events_summary = []
        
        # 2. Logistics Stats
        try:
            materials = supabase.select("logistics_materials", "select=*")
        except Exception:
            materials = []
            
        try:
            requests = supabase.select("logistics_requests", "select=*")
        except Exception:
            requests = []
        
        # 3. Contributions Stats
        try:
            contributions_rows = supabase.select("contributions", "select=*")
        except Exception:
            contributions_rows = []
        
        # Aggregating contributions
        total_collected = sum(c.get("amount") or 0 for c in contributions_rows if c.get("status") == "paid")
        total_pending = sum(c.get("amount") or 0 for c in contributions_rows if c.get("status") == "pending")
        paid_count = sum(1 for c in contributions_rows if c.get("status") == "paid")
        pending_count = sum(1 for c in contributions_rows if c.get("status") == "pending")
        
        # Aggregating logistics
        total_materials_qty = sum(m.get("total_quantity") or 0 for m in materials)
        available_materials_qty = sum(m.get("available_quantity") or 0 for m in materials)
        damaged_materials_qty = sum(m.get("total_quantity", 0) - m.get("available_quantity", 0) for m in materials if m.get("condition") == "damaged")
        
        pending_requests_count = sum(1 for r in requests if r.get("status") == "pending")
        approved_requests_count = sum(1 for r in requests if r.get("status") == "approved")
        
        # Aggregating general attendance
        total_registrations = sum(e.get("registered_count") or 0 for e in events_summary)
        total_attended = sum(e.get("attended_count") or 0 for e in events_summary)
        avg_attendance_rate = 0
        if total_registrations > 0:
            avg_attendance_rate = round((total_attended / total_registrations) * 100)
            
        return data_response({
            "events": {
                "summary": events_summary,
                "total_registrations": total_registrations,
                "total_attended": total_attended,
                "avg_attendance_rate": avg_attendance_rate
            },
            "logistics": {
                "total_items": len(materials),
                "total_qty": total_materials_qty,
                "available_qty": available_materials_qty,
                "damaged_qty": damaged_materials_qty,
                "requests": {
                    "total": len(requests),
                    "pending": pending_requests_count,
                    "approved": approved_requests_count
                }
            },
            "contributions": {
                "total_collected": total_collected,
                "total_pending": total_pending,
                "paid_count": paid_count,
                "pending_count": pending_count,
                "history": contributions_rows[:50] # Send last 50 contributions for preview
            }
        })
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Stats report error: {e}")
        return error_response(f"Erreur lors de la génération des statistiques : {e}", 500)


# ---------------------------------------------------------------------------
# Awards / Prix
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
def member_awards(request, member_id):
    """List or create awards/certificates for a member."""
    token_data = parse_admin_token(request.headers.get("Authorization") or request.COOKIES.get(ADMIN_COOKIE_NAME))

    if request.method == "GET":
        # Members can read their own awards; admins can read any.
        if not token_data or token_data.get("role") not in {"admin", "superadmin"}:
            _, error = _require_member(request, str(member_id))
            if error:
                return error
        try:
            rows = supabase.select("member_awards", f"select=*&member_id=eq.{member_id}&order=awarded_year.desc,created_at.desc")
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error fetching member_awards: {e}")
            rows = []
        return data_response(rows or [])

    # POST — admin or member themselves
    is_admin = token_data and token_data.get("role") in {"admin", "superadmin"}
    if not is_admin:
        _, error = _require_member(request, str(member_id))
        if error:
            return error

    # Check member exists
    try:
        member_rows = supabase.select("members", f"select=id&id=eq.{member_id}")
    except Exception as e:
        return error_response(f"Impossible de vérifier le membre: {str(e)}", 500)
        
    if not member_rows:
        return error_response("Membre introuvable.", 404)

    body = body_json(request)
    award_name = str(body.get("award_name") or "").strip()
    if not award_name:
        return error_response("Le nom du prix ou certificat est requis.", 422)

    VALID_TYPES = {"ugirl", "best_ureporter", "award", "custom", "certificate"}
    award_type = str(body.get("award_type") or "award").strip()
    if award_type not in VALID_TYPES:
        award_type = "custom"

    payload = {
        "member_id": str(member_id),
        "award_name": award_name,
        "award_type": award_type,
        "awarded_year": body.get("awarded_year") or datetime.now(timezone.utc).year,
        "description": str(body.get("description") or "").strip(),
        "document_url": str(body.get("document_url") or "").strip(),
        "issuer": str(body.get("issuer") or "").strip(),
    }
    try:
        created = supabase.insert("member_awards", payload)
        award = created[0] if isinstance(created, list) and created else created
        return data_response(award, 201)
    except Exception as e:
        return error_response(f"Impossible d'ajouter le certificat: {str(e)}", 400)


@api_view(["DELETE"])
def member_award_detail(request, member_id, award_id):
    """Delete an award/certificate."""
    token_data = parse_admin_token(request.headers.get("Authorization") or request.COOKIES.get(ADMIN_COOKIE_NAME))
    is_admin = token_data and token_data.get("role") in {"admin", "superadmin"}
    if not is_admin:
        _, error = _require_member(request, str(member_id))
        if error:
            return error

    try:
        rows = supabase.select("member_awards", f"select=id&id=eq.{award_id}&member_id=eq.{member_id}")
        if not rows:
            return error_response("Prix ou certificat introuvable.", 404)
        supabase.delete("member_awards", "id", str(award_id))
        return status_response("Prix ou certificat supprimé.", 200)
    except Exception as e:
        return error_response(f"Suppression impossible: {str(e)}", 400)
