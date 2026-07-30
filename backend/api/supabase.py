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


def upload_avatar(file_name: str, file_bytes: bytes, content_type: str = "image/jpeg") -> str:
    """Téléverse un fichier binaire dans le bucket public 'avatars' de Supabase Storage.
    Retourne l'URL publique de l'image."""
    # En-têtes pour l'upload de stockage
    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true" # Écrase le fichier s'il existe déjà
    }
    
    # URL de stockage Supabase
    url = f"{_base_url()}/storage/v1/object/avatars/{file_name}"
    
    response = httpx.post(url, content=file_bytes, headers=headers, timeout=20)
    response.raise_for_status()
    
    # URL publique pour accéder à l'image
    return f"{_base_url()}/storage/v1/object/public/avatars/{file_name}"
