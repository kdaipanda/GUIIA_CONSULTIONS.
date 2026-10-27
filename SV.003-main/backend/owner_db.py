"""Persistencia de consultas B2C (dueños) — tabla owner_consultations."""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from supabase_client import get_supabase_client

OWNER_SESSION_RESERVATION_CONFLICT = "No hay sesiones disponibles para reservar."


def reserve_owner_session(
    owner_id: str,
    expected_sessions: int,
) -> Tuple[Optional[int], Optional[str]]:
    """Reserva una sesión con compare-and-set para evitar doble gasto concurrente."""
    if expected_sessions <= 0:
        return (None, OWNER_SESSION_RESERVATION_CONFLICT)

    client = get_supabase_client()
    try:
        new_remaining = expected_sessions - 1
        resp = (
            client.table("profiles")
            .update({"owner_sessions_remaining": new_remaining})
            .eq("id", owner_id)
            .eq("owner_sessions_remaining", expected_sessions)
            .execute()
        )
        if not resp.data:
            return (None, OWNER_SESSION_RESERVATION_CONFLICT)
        return (new_remaining, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def restore_owner_session(
    owner_id: str,
    *,
    previous_sessions: int,
    reserved_sessions: int,
) -> Optional[str]:
    """Revierte una reserva si falló la creación de la consulta."""
    client = get_supabase_client()
    try:
        resp = (
            client.table("profiles")
            .update({"owner_sessions_remaining": previous_sessions})
            .eq("id", owner_id)
            .eq("owner_sessions_remaining", reserved_sessions)
            .execute()
        )
        if not resp.data:
            return "No se pudo revertir la reserva de sesión owner"
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def insert_owner_consultation(
    row: Dict[str, Any],
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    client = get_supabase_client()
    try:
        resp = (
            client.table("owner_consultations")
            .insert(row, returning="representation")
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def get_owner_consultation(
    consultation_id: str,
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    client = get_supabase_client()
    try:
        resp = (
            client.table("owner_consultations")
            .select("*")
            .eq("id", consultation_id)
            .limit(1)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def list_owner_consultations(
    owner_id: str,
    limit: int = 30,
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    client = get_supabase_client()
    try:
        resp = (
            client.table("owner_consultations")
            .select("*")
            .eq("owner_id", owner_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def update_owner_consultation(
    consultation_id: str,
    fields: Dict[str, Any],
) -> Optional[str]:
    client = get_supabase_client()
    try:
        client.table("owner_consultations").update(fields).eq("id", consultation_id).execute()
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)
