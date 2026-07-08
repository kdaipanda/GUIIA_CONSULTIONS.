"""Hashing de contraseñas y saneado de perfiles."""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from passlib.context import CryptContext

MIN_PASSWORD_LENGTH = 8

PASSWORD_REQUIREMENTS_TEXT = (
    "Mínimo 8 caracteres, con al menos una mayúscula, una minúscula, "
    "un número y un carácter especial (p. ej. !@#$%)."
)

_HAS_UPPER = re.compile(r"[A-ZÁÉÍÓÚÑ]")
_HAS_LOWER = re.compile(r"[a-záéíóúñ]")
_HAS_DIGIT = re.compile(r"\d")
_HAS_SPECIAL = re.compile(r"[^A-Za-z0-9áéíóúñÁÉÍÓÚÑ]")

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def password_validation_errors(password: Optional[str]) -> List[str]:
    value = (password or "").strip()
    errors: List[str] = []
    if len(value) < MIN_PASSWORD_LENGTH:
        errors.append(f"Al menos {MIN_PASSWORD_LENGTH} caracteres")
    if not _HAS_UPPER.search(value):
        errors.append("Una letra mayúscula")
    if not _HAS_LOWER.search(value):
        errors.append("Una letra minúscula")
    if not _HAS_DIGIT.search(value):
        errors.append("Un número")
    if not _HAS_SPECIAL.search(value):
        errors.append("Un carácter especial (!@#$%…)")
    return errors


def validate_password(password: Optional[str]) -> str:
    value = (password or "").strip()
    errors = password_validation_errors(value)
    if errors:
        raise ValueError(
            f"La contraseña no cumple los requisitos: {errors[0].lower()}."
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
