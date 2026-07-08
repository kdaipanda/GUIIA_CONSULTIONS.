"""Hashing de contraseñas y saneado de perfiles."""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from passlib.context import CryptContext

try:
    from passlib.exc import PasswordSizeError
except ImportError:  # pragma: no cover
    PasswordSizeError = ValueError  # type: ignore[misc, assignment]

MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_BYTES = 72  # Límite de bcrypt

PASSWORD_HELP_INTRO = (
    "Crea una contraseña personal que solo tú conozcas. La usarás cada vez que entres a GUIAA."
)

PASSWORD_EXAMPLE_TEXT = "Ejemplos válidos: Clinica2024, LunaVet08 o mipassword1"

PASSWORD_REQUIREMENTS_TEXT = (
    "Al menos 8 caracteres, con letras y números. Máximo 72 caracteres."
)

PASSWORD_TOO_LONG_MESSAGE = (
    "La contraseña es demasiado larga; usa como máximo 72 caracteres."
)

_HAS_LETTER = re.compile(r"[A-Za-záéíóúñÁÉÍÓÚÑ]")
_HAS_DIGIT = re.compile(r"\d")

# truncate_error=False evita el error críptico en inglés si algo se escapa de la validación.
_pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__truncate_error=False,
)


_CHECK_HELP = {
    "length": "Usa al menos 8 caracteres; entre más larga, más segura.",
    "too_long": PASSWORD_TOO_LONG_MESSAGE,
    "letter": "Incluye letras, por ejemplo el nombre de tu clínica o mascota.",
    "digit": "Agrega un número, por ejemplo el año o el día de tu cumpleaños.",
}


def _password_byte_length(value: str) -> int:
    return len(value.encode("utf-8"))


def _is_bcrypt_length_error(exc: BaseException) -> bool:
    if isinstance(exc, PasswordSizeError):
        return True
    msg = str(exc).lower()
    return "72" in msg and "byte" in msg


def password_validation_errors(password: Optional[str]) -> List[str]:
    value = (password or "").strip()
    errors: List[str] = []
    if len(value) < MIN_PASSWORD_LENGTH:
        errors.append(_CHECK_HELP["length"])
    if _password_byte_length(value) > MAX_PASSWORD_BYTES:
        errors.append(_CHECK_HELP["too_long"])
    if not _HAS_LETTER.search(value):
        errors.append(_CHECK_HELP["letter"])
    if not _HAS_DIGIT.search(value):
        errors.append(_CHECK_HELP["digit"])
    return errors


def validate_password(password: Optional[str]) -> str:
    value = (password or "").strip()
    errors = password_validation_errors(value)
    if errors:
        raise ValueError(errors[0])
    return value


def hash_password(password: str) -> str:
    value = validate_password(password)
    try:
        return _pwd_context.hash(value)
    except Exception as exc:  # noqa: BLE001
        if _is_bcrypt_length_error(exc):
            raise ValueError(PASSWORD_TOO_LONG_MESSAGE) from exc
        raise


def verify_password(plain: Optional[str], hashed: Optional[str]) -> bool:
    if not plain or not hashed:
        return False
    value = plain.strip()
    if _password_byte_length(value) > MAX_PASSWORD_BYTES:
        return False
    try:
        return _pwd_context.verify(value, hashed)
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
