"""Eliminación completa de cuentas veterinarias (Admin GUIAA)."""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional, Tuple

from supabase_client import get_profile, get_profile_by_email, get_supabase_client


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, TypeError):
        return False


def _count_deleted(resp: Any) -> int:
    data = getattr(resp, "data", None)
    if isinstance(data, list):
        return len(data)
    return 0


def purge_user_related_data(profile_id: str, email: str) -> Dict[str, int]:
    """Borra datos asociados al usuario antes de eliminar el perfil."""
    client = get_supabase_client()
    email_norm = (email or "").strip().lower()
    removed: Dict[str, int] = {
        "consultations": 0,
        "medical_images": 0,
        "payment_transactions": 0,
        "organization_members": 0,
        "support_tickets": 0,
        "platform_admins": 0,
        "storage_objects": 0,
    }

    if profile_id:
        removed["consultations"] = _count_deleted(
            client.table("consultations").delete().eq("user_id", profile_id).execute()
        )
        removed["medical_images"] = _count_deleted(
            client.table("medical_images").delete().eq("user_id", profile_id).execute()
        )
        removed["payment_transactions"] = _count_deleted(
            client.table("payment_transactions")
            .delete()
            .eq("veterinarian_id", profile_id)
            .execute()
        )
        removed["organization_members"] = _count_deleted(
            client.table("organization_members").delete().eq("profile_id", profile_id).execute()
        )

        if _is_uuid(profile_id):
            removed["platform_admins"] = _count_deleted(
                client.table("platform_admins").delete().eq("profile_id", profile_id).execute()
            )
            removed["support_tickets"] = _count_deleted(
                client.table("support_tickets").delete().eq("user_id", profile_id).execute()
            )

    if email_norm:
        removed["platform_admins"] += _count_deleted(
            client.table("platform_admins").delete().ilike("email", email_norm).execute()
        )
        removed["support_tickets"] += _count_deleted(
            client.table("support_tickets").delete().ilike("user_email", email_norm).execute()
        )

    removed["storage_objects"] = _purge_user_storage(profile_id)

    return removed


def _purge_user_storage(profile_id: str) -> int:
    """Elimina archivos del bucket uploads del usuario (cédula, etc.)."""
    if not profile_id:
        return 0
    client = get_supabase_client()
    prefix = f"user-{profile_id}"
    removed = 0
    try:
        bucket = client.storage.from_("uploads")
        to_remove: list[str] = []

        def collect_paths(folder: str) -> None:
            nonlocal removed
            items = bucket.list(folder) or []
            for item in items:
                if not isinstance(item, dict):
                    continue
                name = item.get("name")
                if not name:
                    continue
                path = f"{folder}/{name}".strip("/")
                # Carpetas en Supabase storage no tienen id de archivo
                if item.get("id") is None:
                    collect_paths(path)
                else:
                    to_remove.append(path)

        collect_paths(prefix)
        if to_remove:
            bucket.remove(to_remove)
            removed = len(to_remove)
    except Exception:
        return removed
    return removed


def delete_user_account(email: str) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """
    Elimina un usuario y sus datos relacionados.
    Retorna (ok, error, detalle).
    """
    normalized = (email or "").strip().lower()
    if not normalized:
        return (False, "Email requerido", {})

    profile, err = get_profile_by_email(normalized)
    if err:
        return (False, f"Error buscando perfil: {err}", {})
    if not profile:
        return (False, f"Usuario con email {email} no encontrado", {})

    profile_id = str(profile.get("id") or "").strip()
    profile_email = (profile.get("email") or email).strip()
    if not profile_id:
        return (False, "Perfil sin ID", {})

    removed = purge_user_related_data(profile_id, profile_email)

    client = get_supabase_client()
    try:
        delete_resp = client.table("profiles").delete().eq("id", profile_id).execute()
        removed["profiles"] = _count_deleted(delete_resp) or 1
    except Exception as exc:  # noqa: BLE001
        return (False, str(exc), {"removed": removed})

    still, verify_err = get_profile(profile_id)
    if verify_err:
        return (False, f"Error verificando eliminación: {verify_err}", {"removed": removed})
    if still:
        return (
            False,
            "El perfil sigue existiendo en Supabase tras el borrado. Revisa restricciones FK.",
            {"removed": removed, "profile_id": profile_id},
        )

    by_email, email_err = get_profile_by_email(profile_email)
    if email_err:
        return (False, f"Error verificando email: {email_err}", {"removed": removed})
    if by_email:
        return (
            False,
            "Aún existe un perfil con ese email después del borrado.",
            {"removed": removed, "profile_id": by_email.get("id")},
        )

    return (
        True,
        None,
        {
            "removed": removed,
            "profile_id": profile_id,
            "email": profile_email,
            "verified": True,
        },
    )


def delete_profile_by_email(email: str) -> Tuple[bool, Optional[str]]:
    """Compatibilidad con scripts existentes."""
    ok, error, _detail = delete_user_account(email)
    return (ok, error)
