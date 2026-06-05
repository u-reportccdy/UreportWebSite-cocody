from urllib.parse import quote
import httpx
from django.conf import settings


class SupabaseError(RuntimeError):
    pass


def _base_url() -> str:
    if not settings.SUPABASE_URL:
        raise SupabaseError("SUPABASE_URL is not configured")
    return settings.SUPABASE_URL.rstrip("/")


def _headers(prefer: str | None = None) -> dict[str, str]:
    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise SupabaseError("SUPABASE_SERVICE_ROLE_KEY is not configured")

    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def select(table: str, params: str = "select=*"):
    url = f"{_base_url()}/rest/v1/{table}"
    if params:
        url = f"{url}?{params}"
    response = httpx.get(url, headers=_headers(), timeout=20)
    response.raise_for_status()
    return response.json()


def insert(table: str, payload: dict):
    response = httpx.post(
        f"{_base_url()}/rest/v1/{table}",
        json=payload,
        headers=_headers("return=representation"),
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def update(table: str, field: str, value: str, payload: dict):
    safe_value = quote(str(value), safe="")
    response = httpx.patch(
        f"{_base_url()}/rest/v1/{table}?{field}=eq.{safe_value}",
        json=payload,
        headers=_headers("return=representation"),
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def delete(table: str, field: str, value: str):
    safe_value = quote(str(value), safe="")
    response = httpx.delete(
        f"{_base_url()}/rest/v1/{table}?{field}=eq.{safe_value}",
        headers=_headers(),
        timeout=20,
    )
    response.raise_for_status()
