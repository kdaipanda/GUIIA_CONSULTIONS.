"""Presencia de usuarios (heartbeat + last_seen)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Tuple

from supabase_client import update_profile

# Ventana de "en línea": heartbeat cada ~60s → umbral 3 min
ONLINE_WINDOW_SECONDS = 180


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_last_seen(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    text = str(value).strip()
    if not text:
        return None
    try:
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        dt = datetime.fromisoformat(text)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def is_online(last_seen: Any, *, now: Optional[datetime] = None) -> bool:
    dt = parse_last_seen(last_seen)
    if not dt:
        return False
    ref = now or utc_now()
    return (ref - dt) <= timedelta(seconds=ONLINE_WINDOW_SECONDS)


def presence_fields(profile: dict, *, now: Optional[datetime] = None) -> dict:
    last_seen = profile.get("last_seen")
    return {
        "last_seen": last_seen,
        "is_online": is_online(last_seen, now=now),
    }


def touch_last_seen(profile_id: str) -> Tuple[Optional[str], Optional[str]]:
    """Actualiza last_seen. Retorna (iso_timestamp, error)."""
    now = utc_now()
    iso = now.isoformat()
    err = update_profile(profile_id, {"last_seen": iso})
    if err:
        return None, err
    return iso, None
