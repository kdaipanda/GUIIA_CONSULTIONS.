"""Hashing de contraseñas y saneado de perfiles."""
from __future__ import annotations

from typing import Any, Dict, Optional

from passlib.context import CryptContext

MIN_PASSWORD_LENGTH = 8

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def validate_password(password: Optional[str]) -> str:
    value = (password or "").strip()
    if len(value) < MIN_PASSWORD_LENGTH:
        raise ValueError(
            f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres"
        )
    return value


def hash_password(password: str) -> str:
    return _pwd_context.hash(validate_password(password))


def verify_password(plain: Optional[str], hashed: Optional[str]) -> bool:
    if not plain or not hashed:
        return False
    try:
        return _pwd_context.verify(plain.strip(), hashed)
    except Exception:  # noqa: BLE001
        return False


def strip_sensitive_profile_fields(profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not profile:
        return {}
    has_password = bool((profile.get("password_hash") or "").strip())
    data = dict(profile)
    data.pop("password_hash", None)
    data.pop("_id", None)
    data["has_password"] = has_password
    return data
