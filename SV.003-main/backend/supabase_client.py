import os
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple

try:
    from supabase import Client, create_client  # type: ignore
except Exception:  # noqa: BLE001
    # En modo local simple, Supabase es opcional. Si no está instalado,
    # levantamos el servidor igual y fallamos con un error claro al usarlo.
    Client = Any  # type: ignore
    create_client = None  # type: ignore


class SupabaseConfigError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """
    Returns a cached Supabase client using service role key.

    Env vars required:
    - SUPABASE_URL
    - SUPABASE_SERVICE_ROLE_KEY
    """
    if create_client is None:
        raise SupabaseConfigError(
            "Paquete 'supabase' no instalado. Instala dependencias completas (requirements.txt) "
            "o configura el modo local sin Supabase."
        )
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise SupabaseConfigError("SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados")
    return create_client(url, key)


def upsert_profile(profile: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Upsert de perfiles (id = auth.uid). Retorna (row, error_message).
    """
    client = get_supabase_client()
    try:
        resp = client.table("profiles").upsert(profile, returning="representation").execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def insert_consultation(row: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Inserta una consulta. row debe incluir user_id.
    """
    client = get_supabase_client()
    try:
        resp = client.table("consultations").insert(row, returning="representation").execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def list_consultations(user_id: str, limit: int = 20) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """
    Obtiene consultas de un usuario.
    """
    client = get_supabase_client()
    try:
        resp = (
            client.table("consultations")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def get_profile(profile_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    client = get_supabase_client()
    try:
        resp = client.table("profiles").select("*").eq("id", profile_id).limit(1).execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def get_profile_by_email(email: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Busca perfil por email."""
    client = get_supabase_client()
    try:
        resp = client.table("profiles").select("*").eq("email", email).limit(1).execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def get_profile_by_cedula(cedula: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Busca perfil por cédula profesional."""
    client = get_supabase_client()
    try:
        resp = client.table("profiles").select("*").eq("cedula_profesional", cedula).limit(1).execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def get_profile_by_credentials(email: str, cedula: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Busca perfil por email Y cédula (para login)."""
    client = get_supabase_client()
    try:
        resp = (
            client.table("profiles")
            .select("*")
            .eq("email", email)
            .eq("cedula_profesional", cedula)
            .limit(1)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def update_profile(profile_id: str, fields: Dict[str, Any]) -> Optional[str]:
    """Actualiza un perfil."""
    client = get_supabase_client()
    try:
        client.table("profiles").update(fields).eq("id", profile_id).execute()
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def get_consultation_by_id(consultation_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    client = get_supabase_client()
    try:
        resp = (
            client.table("consultations")
            .select("*")
            .eq("id", consultation_id)
            .limit(1)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def update_consultation(consultation_id: str, fields: Dict[str, Any]) -> Optional[str]:
    client = get_supabase_client()
    try:
        client.table("consultations").update(fields).eq("id", consultation_id).execute()
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def count_consultations_by_user(user_id: str) -> Tuple[int, Optional[str]]:
    client = get_supabase_client()
    try:
        resp = (
            client.table("consultations")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        return (resp.count or 0, None)
    except Exception as exc:  # noqa: BLE001
        return (0, str(exc))


def insert_medical_image(row: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    client = get_supabase_client()
    try:
        resp = client.table("medical_images").insert(row, returning="representation").execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def list_medical_images(user_id: str, limit: int = 20) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    client = get_supabase_client()
    try:
        print(f"[DEBUG] list_medical_images: Buscando para user_id={user_id}, limit={limit}")
        resp = (
            client.table("medical_images")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        print(f"[DEBUG] list_medical_images: Encontrados {len(resp.data or [])} registros")
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        print(f"[ERROR] list_medical_images: Error: {exc}")
        return ([], str(exc))


def upload_bytes_to_storage(bucket: str, path: str, data: bytes, content_type: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Sube bytes al bucket y devuelve public URL.
    """
    client = get_supabase_client()
    try:
        client.storage.from_(bucket).upload(
            path,
            data,
            # Nota: supabase-py espera strings en headers/opciones; usar bool puede romper con "'bool' object has no attribute 'encode'"
            file_options={"content-type": content_type, "upsert": "true"},
        )
        url_resp = client.storage.from_(bucket).get_public_url(path)
        # Dependiendo de la versión, get_public_url puede devolver dict o string.
        if isinstance(url_resp, str):
            return (url_resp, None)
        if isinstance(url_resp, dict):
            return (url_resp.get("publicUrl") or url_resp.get("public_url"), None)
        # Fallback defensivo
        return (str(url_resp), None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def insert_payment_transaction(row: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Inserta una transacción de pago.
    """
    client = get_supabase_client()
    try:
        resp = client.table("payment_transactions").insert(row, returning="representation").execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def get_payment_transaction_by_session_id(session_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Obtiene una transacción de pago por session_id.
    """
    client = get_supabase_client()
    try:
        resp = (
            client.table("payment_transactions")
            .select("*")
            .eq("session_id", session_id)
            .limit(1)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def update_payment_transaction(session_id: str, fields: Dict[str, Any]) -> Optional[str]:
    """
    Actualiza una transacción de pago.
    """
    client = get_supabase_client()
    try:
        client.table("payment_transactions").update(fields).eq("session_id", session_id).execute()
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def list_profiles(limit: int = 1000) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """
    Obtiene todos los perfiles (para uso administrativo).
    """
    client = get_supabase_client()
    try:
        resp = (
            client.table("profiles")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))
