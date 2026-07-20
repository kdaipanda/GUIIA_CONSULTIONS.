"""Tests de validación de registro: contraseña + teléfono."""
from __future__ import annotations

import re

import pytest

from password_auth import hash_password, validate_password, verify_password


def phone_digits(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def is_valid_phone(value: str) -> bool:
    return len(phone_digits(value)) >= 8


def test_valid_password_roundtrip():
    password = "Vet2024"
    assert validate_password(password) == password
    hashed = hash_password(password)
    assert verify_password(password, hashed)
    assert not verify_password("Vet2025", hashed)


@pytest.mark.parametrize(
    "password",
    ["abc", "123456", "abcdef", "ab1", ""],
)
def test_invalid_passwords_rejected(password: str):
    with pytest.raises(ValueError):
        validate_password(password)


@pytest.mark.parametrize(
    "phone,ok",
    [
        ("+52 55 1234 5678", True),
        ("5512345678", True),
        ("+57 300 123 4567", True),
        ("123", False),
        ("", False),
        ("12-34", False),
        ("+52 55 12", False),
    ],
)
def test_phone_digit_rule(phone: str, ok: bool):
    assert is_valid_phone(phone) is ok
