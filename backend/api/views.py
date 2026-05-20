from datetime import datetime, timezone
import os
import json
import time
import uuid
from pathlib import Path
from django.http import JsonResponse
from django.conf import settings as django_settings
from django.contrib.auth.hashers import make_password, check_password
from . import supabase
from .utils import api_view, body_json, data_response, error_response, status_response, create_admin_token, parse_admin_token

_LOGIN_ATTEMPTS: dict[str, dict[str, float | int]] = {}
_LOGIN_WINDOW_SECONDS = 15 * 60
_LOGIN_MAX_ATTEMPTS = 8
ADMIN_AUTH_FILE = Path(django_settings.BASE_DIR) / "admin_auth.json"


def _prune_login_attempts(now_ts: float):
    stale = [key for key, value in _LOGIN_ATTEMPTS.items() if (now_ts - float(value.get("ts", 0))) > _LOGIN_WINDOW_SECONDS]
    for key in stale:
        _LOGIN_ATTEMPTS.pop(key, None)


def _get_client_ip(request) -> str:
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def _require_superadmin(request):
    token_data = parse_admin_token(request.headers.get("Authorization"))
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


def _list_create(table, order="created_at.desc"):
    @api_view(["GET", "POST"])
    def view(request):
        if request.method == "GET":
            return data_response(supabase.select(table, f"select=*&order={order}"))
        return data_response(supabase.insert(table, body_json(request)), 201)

    return view


def _detail(table):
    @api_view(["GET", "PATCH", "DELETE"])
    def view(request, record_id):
        if request.method == "GET":
            rows = supabase.select(table, f"select=*&id=eq.{record_id}")
            if not rows:
                return error_response("Not found", 404)
            return data_response(rows[0])
        if request.method == "PATCH":
            return data_response(supabase.update(table, "id", record_id, body_json(request)))
        supabase.delete(table, "id", record_id)
        return status_response()

    return view


articles = _list_create("articles")
article_detail = _detail("articles")
events = _list_create("events", "event_date.desc")
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
    ip_state = _LOGIN_ATTEMPTS.get(ip, {"count": 0, "ts": now_ts})
    if int(ip_state.get("count", 0)) >= _LOGIN_MAX_ATTEMPTS and (now_ts - float(ip_state.get("ts", now_ts))) < _LOGIN_WINDOW_SECONDS:
        return error_response("Trop de tentatives. Réessayez dans quelques minutes.", 429)

    email = _normalize_email(payload.get("email"))
    password = payload.get("password") or ""
    auth_data = _load_admin_auth()
    matched_role = None
    matched_user = None
    super_user = auth_data.get("superadmin") or {}
    if email and email == _normalize_email(super_user.get("email")):
        matched_role = "superadmin"
        matched_user = super_user
    else:
        for admin in auth_data.get("admins", []):
            if email and email == _normalize_email(admin.get("email")):
                matched_role = "admin"
                matched_user = admin
                break

    if not matched_role or not matched_user:
        _LOGIN_ATTEMPTS[ip] = {"count": int(ip_state.get("count", 0)) + 1, "ts": now_ts}
        return error_response("Identifiants incorrects.", 401)

    if matched_user.get("active") is False:
        _LOGIN_ATTEMPTS[ip] = {"count": int(ip_state.get("count", 0)) + 1, "ts": now_ts}
        return error_response("Compte désactivé.", 403)
    password_hash = matched_user.get("password_hash") or ""
    if not password_hash or not check_password(password, password_hash):
        _LOGIN_ATTEMPTS[ip] = {"count": int(ip_state.get("count", 0)) + 1, "ts": now_ts}
        return error_response("Identifiants incorrects.", 401)

    _LOGIN_ATTEMPTS.pop(ip, None)
    if matched_role == "superadmin":
        return error_response("Utilisez la route superadmin dédiée.", 403)
    token = create_admin_token(email, matched_role)
    return data_response({"token": token, "role": matched_role, "email": email})


@api_view(["POST"])
def superadmin_login(request):
    payload = body_json(request)
    now_ts = time.time()
    _prune_login_attempts(now_ts)
    ip = _get_client_ip(request)
    ip_state = _LOGIN_ATTEMPTS.get(ip, {"count": 0, "ts": now_ts})
    if int(ip_state.get("count", 0)) >= _LOGIN_MAX_ATTEMPTS and (now_ts - float(ip_state.get("ts", now_ts))) < _LOGIN_WINDOW_SECONDS:
        return error_response("Trop de tentatives. Réessayez dans quelques minutes.", 429)

    email = _normalize_email(payload.get("email"))
    password = payload.get("password") or ""
    auth_data = _load_admin_auth()
    super_user = auth_data.get("superadmin") or {}

    if email != _normalize_email(super_user.get("email")):
        _LOGIN_ATTEMPTS[ip] = {"count": int(ip_state.get("count", 0)) + 1, "ts": now_ts}
        return error_response("Identifiants incorrects.", 401)
    if super_user.get("active") is False:
        _LOGIN_ATTEMPTS[ip] = {"count": int(ip_state.get("count", 0)) + 1, "ts": now_ts}
        return error_response("Compte superadmin désactivé.", 403)
    password_hash = super_user.get("password_hash") or ""
    if not password_hash or not check_password(password, password_hash):
        _LOGIN_ATTEMPTS[ip] = {"count": int(ip_state.get("count", 0)) + 1, "ts": now_ts}
        return error_response("Identifiants incorrects.", 401)

    _LOGIN_ATTEMPTS.pop(ip, None)
    token = create_admin_token(email, "superadmin")
    return data_response({"token": token, "role": "superadmin", "email": email})


@api_view(["POST"])
def admin_change_credentials(request):
    token_data = parse_admin_token(request.headers.get("Authorization"))
    if not token_data:
        return error_response("Unauthorized", 401)

    caller_role = token_data.get("role")
    caller_email = _normalize_email(token_data.get("email"))
    payload = body_json(request)
    target_role = str(payload.get("target_role") or "").strip().lower()
    target_email = _normalize_email(payload.get("target_email"))
    current_password = payload.get("current_password") or ""
    new_password = payload.get("new_password") or ""

    if target_role not in {"admin", "superadmin"}:
        return error_response("target_role invalide.", 422)

    if caller_role == "admin":
        if target_role != "admin":
            return error_response("Un admin ne peut modifier que son propre compte.", 403)
        if target_email and target_email != caller_email:
            return error_response("Un admin ne peut modifier que son propre compte.", 403)
    elif caller_role != "superadmin":
        return error_response("Unauthorized", 401)

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

    if caller_role == "admin":
        if caller_email != current_email_stored:
            return error_response("Session invalide. Reconnectez-vous.", 401)
        if not current_password or not current_hash or not check_password(current_password, current_hash):
            return error_response("Mot de passe actuel incorrect.", 403)

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
    settings_data = load_local_settings()
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
        admins = [
            {
                "id": admin.get("id"),
                "email": admin.get("email"),
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
    if not email or not password or len(password) < 10:
        return error_response("Email et mot de passe (>=10 caractères) requis.", 422)
    if email == super_email:
        return error_response("Impossible d'utiliser l'email du superadmin pour un admin.", 422)
    for adm in auth_data.get("admins", []):
        if _normalize_email(adm.get("email")) == email:
            return error_response("Cet admin existe déjà.", 409)
    new_admin = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": make_password(password),
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    auth_data.setdefault("admins", []).append(new_admin)
    _save_admin_auth(auth_data)
    _log_superadmin_action(token_data.get("email", ""), "admin_created", email, {"admin_id": new_admin["id"]})
    return data_response({"id": new_admin["id"], "email": email, "active": True}, 201)


@api_view(["PATCH"])
def superadmin_admin_detail(request, admin_id):
    token_data, error = _require_superadmin(request)
    if error:
        return error
    payload = body_json(request)
    auth_data = _load_admin_auth()
    admins = auth_data.get("admins", [])
    idx = next((i for i, adm in enumerate(admins) if str(adm.get("id")) == str(admin_id)), -1)
    if idx < 0:
        return error_response("Admin introuvable.", 404)
    admin = admins[idx]
    if "email" in payload:
        email = _normalize_email(payload.get("email"))
        if not email:
            return error_response("Email invalide.", 422)
        admin["email"] = email
    if "active" in payload:
        admin["active"] = bool(payload.get("active"))
    if payload.get("new_password"):
        new_password = str(payload.get("new_password"))
        if len(new_password) < 10:
            return error_response("Mot de passe trop court.", 422)
        admin["password_hash"] = make_password(new_password)
    admins[idx] = admin
    auth_data["admins"] = admins
    _save_admin_auth(auth_data)
    _log_superadmin_action(token_data.get("email", ""), "admin_updated", admin.get("email", ""), {"admin_id": str(admin_id)})
    return data_response({"id": admin.get("id"), "email": admin.get("email"), "active": bool(admin.get("active", True))})


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
        q = (request.GET.get("q") or "").strip()
        rows = supabase.select("members", "select=*&order=created_at.desc")
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
    payload.setdefault("status", "aspirant")
    return data_response(supabase.insert("members", payload), 201)


@api_view(["PATCH"])
def member_status(request, member_id):
    return data_response(supabase.update("members", "id", member_id, body_json(request)))

@api_view(["GET", "PATCH"])
def member_detail(request, member_id):
    if request.method == "GET":
        rows = supabase.select("members", f"select=*&id=eq.{member_id}")
        if not rows:
            return error_response("Member not found", 404)
        return data_response(rows[0])
    return data_response(supabase.update("members", "id", member_id, body_json(request)))


@api_view(["GET"])
def member_activities(request, member_id):
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
    rows = supabase.select("events", f"select=id,capacity,registered&id=eq.{event_id}")
    if not rows:
        return error_response("Event not found", 404)

    event = rows[0]
    capacity = event.get("capacity") or 0
    registered = event.get("registered") or 0
    if capacity and registered >= capacity:
        return error_response("Event capacity reached", 409)

    member_id = payload.get("member_id")
    if not member_id:
        return error_response("Authentication required: member_id is required", 401)

    member_rows = supabase.select("members", f"select=*&id=eq.{member_id}")
    if not member_rows:
        return error_response("Member not found", 404)
    member = member_rows[0]
    payload["full_name"] = payload.get("full_name") or member.get("full_name") or ""
    payload["phone"] = payload.get("phone") or member.get("phone") or ""
    payload["email"] = payload.get("email") or member.get("email") or ""
    payload["member_status"] = payload.get("member_status") or member.get("status") or "aspirant"
    payload["sex"] = payload.get("sex") or member.get("sex") or "non_precise"
    if not payload.get("full_name") or not payload.get("phone"):
        return error_response("full_name and phone are required", 422)

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


@api_view(["GET"])
def event_registrations(request, event_id):
    rows = supabase.select("event_registrations", f"select=*&event_id=eq.{event_id}&order=created_at.desc")
    return data_response(rows)


@api_view(["GET"])
def event_is_registered(request, event_id):
    member_id = (request.GET.get("member_id") or "").strip()
    phone = (request.GET.get("phone") or "").strip()
    if not member_id and not phone:
        return data_response({"registered": False})
    rows = supabase.select("event_registrations", f"select=member_id,phone&event_id=eq.{event_id}")
    normalized_phone = "".join(ch for ch in phone if ch.isdigit())
    exists = False
    for row in rows:
        if member_id and str(row.get("member_id") or "") == member_id:
            exists = True
            break
        reg_phone = "".join(ch for ch in str(row.get("phone") or "") if ch.isdigit())
        if normalized_phone and reg_phone and reg_phone == normalized_phone:
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
    return data_response(supabase.insert("newsletter_subscribers", body_json(request)), 201)


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
    "hero_description": "Rejoignez la plus grande communautÃ© de jeunes engagÃ©s. Participez Ã  nos actions, donnez votre avis et contribuez au dÃ©veloppement de notre commune.",
    "hero_image_url": "https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
    "about_title": "Plus qu'une communautÃ©, un mouvement.",
    "about_description": "U-Report est une plateforme sociale dÃ©veloppÃ©e par l'UNICEF pour engager les jeunes et les communautÃ©s. Ã€ Cocody, nous utilisons cet outil pour identifier les problÃ¨mes locaux, proposer des solutions et agir concrÃ¨tement sur le terrain.",
    "facebook_url": "https://www.facebook.com/share/1DoAeSBX6n/?mibextid=wwXIfr",
    "instagram_url": "https://www.instagram.com/communaute_ureportcocody?igsh=cDk4Nm0wcDdyZThs",
    "tiktok_url": "https://www.tiktok.com/@ureportcocody?_r=1&_t=ZS-96SxX2CetXu",
    "whatsapp_group_link": "",
    "whatsapp_manager_link": "",
    "whatsapp_message_aspirant": "Bonjour, je suis {name} ({status_label}) et je viens de m'inscrire Ã  l'activitÃ© \"{event_title}\". Merci de m'ajouter au groupe d'intÃ©gration.",
    "whatsapp_message_advanced": "Bonjour, je suis {name} ({status_label}) et je viens de m'inscrire Ã  l'activitÃ© \"{event_title}\". Je souhaite finaliser mon intÃ©gration.",
    "footer_contact_title": "Contact",
    "footer_contact_address": "Mairie de Cocody,\nAbidjan, CÃ´te d'Ivoire",
    "footer_contact_phone": "+225 00 00 00 00 00",
    "footer_contact_email": "contact@ureportcocody.ci",
    "footer_newsletter_title": "Newsletter",
    "footer_newsletter_text": "Restez informÃ© de nos prochaines activitÃ©s et opportunitÃ©s d'engagement.",
    "footer_newsletter_placeholder": "Votre adresse email",
    "footer_newsletter_button": "S'abonner",
    "site_under_maintenance": False,
    "maintenance_message": "Le site est temporairement en maintenance.",
    "maintenance_image_url": "/images/logo-512.png",
}

def load_local_settings():
    if os.path.exists(SETTINGS_FILE_PATH):
        try:
            with open(SETTINGS_FILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_SETTINGS

def save_local_settings(data):
    try:
        with open(SETTINGS_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


@api_view(["GET", "PATCH"])
def site_settings(request):
    if request.method == "GET":
        try:
            rows = supabase.select("settings", "select=*")
            if rows:
                return data_response(rows[0])
        except Exception:
            return data_response(load_local_settings())
        return data_response(DEFAULT_SETTINGS)

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
        "site_under_maintenance",
        "maintenance_message",
        "maintenance_image_url",
    ]
    filtered_payload = {k: v for k, v in payload.items() if k in valid_fields}

    if "site_under_maintenance" in filtered_payload or "maintenance_message" in filtered_payload:
        token_data = parse_admin_token(request.headers.get("Authorization"))
        if not token_data or token_data.get("role") != "superadmin":
            return error_response("Seul le superadmin peut modifier le mode maintenance.", 403)
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
            return data_response(updated[0] if isinstance(updated, list) and updated else updated)
        else:
            inserted = supabase.insert("settings", filtered_payload)
            return data_response(inserted[0] if isinstance(inserted, list) and inserted else inserted, 201)
    except Exception:
        current = load_local_settings()
        current.update(filtered_payload)
        save_local_settings(current)
        return data_response(current)

