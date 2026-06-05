import json
import time
from pathlib import Path
from typing import Any
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core import signing
from . import supabase


def data_response(data, status=200):
    return JsonResponse({"data": data}, status=status, safe=False)


def status_response(status=200):
    return JsonResponse({"status": "ok"}, status=status)


def error_response(message: str, status=500):
    return JsonResponse({"detail": message}, status=status)


def body_json(request) -> dict:
    if not request.body:
        return {}
    return json.loads(request.body.decode("utf-8"))


_SETTINGS_CACHE: dict[str, Any] = {"ts": 0, "data": {}}
_SETTINGS_TTL_SEC = 20


def _get_runtime_settings() -> dict[str, Any]:
    now = time.time()
    if now - _SETTINGS_CACHE["ts"] < _SETTINGS_TTL_SEC:
        return _SETTINGS_CACHE["data"]
    try:
        rows = supabase.select("settings", "select=*")
        data = rows[0] if rows else {}
    except Exception:
        # Fallback local file when Supabase settings read fails
        local_settings_path = Path(settings.BASE_DIR) / "site_settings.json"
        if local_settings_path.exists():
            try:
                data = json.loads(local_settings_path.read_text(encoding="utf-8"))
            except Exception:
                data = {}
        else:
            data = {}
    _SETTINGS_CACHE["ts"] = now
    _SETTINGS_CACHE["data"] = data
    return data


def create_admin_token(email: str, role: str) -> str:
    signer = signing.TimestampSigner(salt="admin-auth")
    payload = signing.dumps({"email": email, "role": role})
    return signer.sign(payload)


def create_member_token(member_id: str, phone: str) -> str:
    signer = signing.TimestampSigner(salt="member-auth")
    payload = signing.dumps({"member_id": member_id, "phone": phone})
    return signer.sign(payload)


def parse_admin_token(auth_header: str | None) -> dict[str, Any] | None:
    token = ""
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    elif auth_header:
        token = auth_header.strip()
    if not token:
        return None
    signer = signing.TimestampSigner(salt="admin-auth")
    try:
        unsigned = signer.unsign(token, max_age=getattr(settings, "ADMIN_TOKEN_TTL_SECONDS", 3600 * 8))
        return signing.loads(unsigned)
    except Exception:
        return None


def parse_member_token(request) -> dict[str, Any] | None:
    token = (request.headers.get("X-Member-Token") or request.COOKIES.get("member_session") or "").strip()
    if not token:
        return None
    signer = signing.TimestampSigner(salt="member-auth")
    try:
        unsigned = signer.unsign(token, max_age=getattr(settings, "MEMBER_TOKEN_TTL_SECONDS", 3600 * 24 * 30))
        return signing.loads(unsigned)
    except Exception:
        return None


def _is_admin_request(path: str, method: str) -> bool:
    if method == "GET" and (path == "/api/team-members" or path.startswith("/api/team-members/")):
        return False

    if method == "GET":
        if path in {"/api/articles", "/api/events", "/api/partners", "/api/testimonials", "/api/gallery/albums", "/api/gallery/photos", "/api/stats", "/api/settings"}:
            return False
        if path.startswith("/api/articles/") or path.startswith("/api/events/") or path.startswith("/api/partners/") or path.startswith("/api/testimonials/"):
            if "/registrations" in path or path.endswith("/attendance-summary"):
                return True
            return False
        if path == "/api/newsletter/subscribers":
            return True
        if path.startswith("/api/members"):
            return True
        if path.startswith("/api/contributions"):
            return True
        if path.startswith("/api/team-members"):
            return False
        return False
    if path.endswith("/register") and method == "POST":
        return False
    if path == "/api/newsletter/subscribe" and method == "POST":
        return False
    if path == "/api/members" and method == "POST":
        return False
    if path == "/api/members/login" and method == "POST":
        return False
    if path == "/api/contributions/initiate" and method == "POST":
        return False
    if path == "/api/auth/admin/login":
        return False
    if path == "/api/auth/superadmin/login":
        return False
    return True


def _is_maintenance_blocked(path: str, method: str, token_data: dict[str, Any] | None) -> tuple[bool, str]:
    if token_data and token_data.get("role") in {"admin", "superadmin"}:
        return False, ""
    if path.startswith("/api/auth/admin/login"):
        return False, ""
    if path.startswith("/api/auth/superadmin/login"):
        return False, ""
    settings_data = _get_runtime_settings()
    is_on = bool(settings_data.get("site_under_maintenance"))
    if not is_on:
        return False, ""
    allowed_public = (
        (path.startswith("/api/settings") and method == "GET")
        or (path.startswith("/api/auth/superadmin/login"))
        or (path.startswith("/api/health"))
    )
    if allowed_public:
        return False, ""
    return True, str(settings_data.get("maintenance_message") or "Le site est temporairement en maintenance.")


def api_view(methods):
    def decorator(func):
        @csrf_exempt
        def wrapper(request, *args, **kwargs):
            if request.method == "OPTIONS":
                return status_response()
            if request.method not in methods:
                return error_response("Method not allowed", 405)
            try:
                token_data = parse_admin_token(request.headers.get("Authorization") or request.COOKIES.get("admin_session"))
                blocked, message = _is_maintenance_blocked(request.path, request.method, token_data)
                if blocked:
                    return error_response(message, 503)
                if _is_admin_request(request.path, request.method):
                    if not token_data or token_data.get("role") not in {"admin", "superadmin"}:
                        return error_response("Unauthorized", 401)
                return func(request, *args, **kwargs)
            except json.JSONDecodeError:
                return error_response("Invalid JSON payload", 400)
            except Exception:
                return error_response("Une erreur technique est survenue.", 500)

        return wrapper

    return decorator
