"""Hashing de contraseñas y saneado de perfiles."""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from passlib.context import CryptContext

try:
    from passlib.exc import PasswordSizeError
except ImportError:  # pragma: no cover
    PasswordSizeError = ValueError  # type: ignore[misc, assignment]

MIN_PASSWORD_LENGTH = 6
BCRYPT_MAX_BYTES = 72

PASSWORD_HELP_INTRO = (
    "Crea una contraseña personal que solo tú conozcas. La usarás cada vez que entres a GUIAA."
)

PASSWORD_EXAMPLE_TEXT = "Ejemplos válidos: Vet2024, Luna08, clinica1"

PASSWORD_REQUIREMENTS_TEXT = (
    "Al menos 6 caracteres, con letras y números."
)

PASSWORD_HASH_ERROR_MESSAGE = (
    "No se pudo guardar la contraseña. Usa una entre 6 y 72 caracteres, con letras y números."
)

_HAS_LETTER = re.compile(r"[A-Za-záéíóúñÁÉÍÓÚÑ]")
_HAS_DIGIT = re.compile(r"\d")

_pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__truncate_error=False,
)


_CHECK_HELP = {
    "length": f"Usa al menos {MIN_PASSWORD_LENGTH} caracteres.",
    "letter": "Incluye letras, por ejemplo el nombre de tu clínica o mascota.",
    "digit": "Agrega un número, por ejemplo el año o el día de tu cumpleaños.",
}


def _password_byte_length(value: str) -> int:
    return len(value.encode("utf-8"))


def _truncate_for_bcrypt(value: str) -> str:
    """Recorta a 72 bytes UTF-8 (límite técnico de bcrypt) sin romper caracteres."""
    trimmed = value or ""
    while trimmed and _password_byte_length(trimmed) > BCRYPT_MAX_BYTES:
        trimmed = trimmed[:-1]
    return trimmed


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


def prepare_password_for_bcrypt(password: str) -> str:
    """Valida reglas de negocio y adapta la contraseña al límite de bcrypt."""
    return _truncate_for_bcrypt(validate_password(password))


def hash_password(password: str) -> str:
    prepared = prepare_password_for_bcrypt(password)
    try:
        return _pwd_context.hash(prepared)
    except Exception as exc:  # noqa: BLE001
        if _is_bcrypt_length_error(exc):
            prepared = _truncate_for_bcrypt(prepared)
            try:
                return _pwd_context.hash(prepared)
            except Exception as retry_exc:  # noqa: BLE001
                raise ValueError(PASSWORD_HASH_ERROR_MESSAGE) from retry_exc
        raise ValueError(PASSWORD_HASH_ERROR_MESSAGE) from exc


def verify_password(plain: Optional[str], hashed: Optional[str]) -> bool:
    if not plain or not hashed:
        return False
    value = _truncate_for_bcrypt(plain.strip())
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
