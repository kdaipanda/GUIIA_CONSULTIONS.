import json
import os
import re
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
    - SUPABASE_SERVICE_ROLE_KEY (preferred)
    - SUPABASE_KEY (legacy fallback)
    """
    if create_client is None:
        raise SupabaseConfigError(
            "Paquete 'supabase' no instalado. Instala dependencias completas (requirements.txt) "
            "o configura el modo local sin Supabase."
        )
    url = os.getenv("SUPABASE_URL")
    # Compatibilidad: en algunos despliegues antiguos se usa SUPABASE_KEY.
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise SupabaseConfigError(
            "SUPABASE_URL y (SUPABASE_SERVICE_ROLE_KEY o SUPABASE_KEY) deben estar configurados"
        )
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
    normalized_email = (email or "").strip().lower()
    if not normalized_email:
        return (None, "Email requerido")
    try:
        # Usar ilike para tolerar diferencias de mayúsculas/minúsculas.
        resp = client.table("profiles").select("*").ilike("email", normalized_email).limit(1).execute()
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
    normalized_email = (email or "").strip().lower()
    normalized_cedula = (cedula or "").strip()
    if not normalized_email or not normalized_cedula:
        return (None, "Email y cédula requeridos")
    try:
        resp = (
            client.table("profiles")
            .select("*")
            .ilike("email", normalized_email)
            .eq("cedula_profesional", normalized_cedula)
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


def delete_profile_by_email(email: str) -> Tuple[bool, Optional[str]]:
    """Elimina un perfil por email. Retorna (success, error_message)."""
    client = get_supabase_client()
    try:
        # Primero buscar el perfil por email
        profile, err = get_profile_by_email(email)
        if err:
            return (False, f"Error buscando perfil: {err}")
        if not profile:
            return (False, f"Usuario con email {email} no encontrado")
        
        # Eliminar el perfil
        profile_id = profile.get("id")
        if not profile_id:
            return (False, "Perfil no tiene ID")
        
        client.table("profiles").delete().eq("id", profile_id).execute()
        return (True, None)
    except Exception as exc:  # noqa: BLE001
        return (False, str(exc))


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


def _merge_medical_image_stripped(current: Dict[str, Any], removed_col: str, val: Any) -> None:
    """Si una columna no existe en BD, fusiona su contenido en analysis o findings."""
    if removed_col in ("findings", "recommendations", "additional_context"):
        if removed_col == "findings" and isinstance(val, list):
            extra = "\n\n## Hallazgos\n" + "\n".join(f"- {x}" for x in val)
        elif removed_col == "recommendations" and isinstance(val, list):
            extra = "\n\n## Recomendaciones\n" + "\n".join(f"- {x}" for x in val)
        elif removed_col == "additional_context" and val:
            extra = "\n\n## Contexto adicional\n" + str(val)
        else:
            extra = f"\n\n## {removed_col}\n{json.dumps(val) if isinstance(val, (list, dict)) else val}"
        current["analysis"] = (current.get("analysis") or "") + extra
    elif removed_col in ("image_type", "patient_name") and val:
        label = "Tipo de estudio" if removed_col == "image_type" else "Paciente"
        current["analysis"] = f"[{label}: {val}]\n\n" + (current.get("analysis") or "")
    elif removed_col == "consultation_id" and val:
        current["analysis"] = (current.get("analysis") or "") + f"\n\n[ID consulta ligada: {val}]\n"
    elif removed_col == "analysis" and val is not None:
        prev = current.get("findings")
        block = [str(val)]
        if isinstance(prev, list):
            current["findings"] = block + prev
        else:
            current["findings"] = block


def insert_medical_image(row: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Inserta en medical_images. Si PostgREST indica columna inexistente (PGRST204),
    reintenta quitando esa columna y fusionando datos en analysis/findings.
    """
    client = get_supabase_client()
    current = dict(row)
    last_err = ""
    for _ in range(14):
        try:
            resp = client.table("medical_images").insert(current, returning="representation").execute()
            return (resp.data[0] if resp.data else None, None)
        except Exception as exc:  # noqa: BLE001
            last_err = str(exc)
            if "PGRST204" not in last_err and "schema cache" not in last_err.lower():
                return (None, last_err)
            m = re.search(r"the '([^']+)' column", last_err, re.I)
            if not m:
                return (None, last_err)
            bad = m.group(1)
            if bad in ("id", "user_id", "created_at"):
                return (None, last_err)
            if bad not in current:
                return (None, last_err)
            val = current.pop(bad)
            _merge_medical_image_stripped(current, bad, val)
            continue
    return (None, last_err or "insert_medical_image: demasiados reintentos")


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
