"""Tests de contraseñas bcrypt."""
from __future__ import annotations

import pytest

from password_auth import (
    MIN_PASSWORD_LENGTH,
    PASSWORD_REQUIREMENTS_TEXT,
    hash_password,
    password_validation_errors,
    strip_sensitive_profile_fields,
    validate_password,
    verify_password,
)


def test_validate_password_min_length():
    with pytest.raises(ValueError, match="8 caracteres"):
        validate_password("abc1")
    assert validate_password("clinica1") == "clinica1"


def test_validate_password_requires_letter_and_digit():
    assert validate_password("Clinica2024") == "Clinica2024"
    with pytest.raises(ValueError, match="letras"):
        validate_password("12345678")
    with pytest.raises(ValueError, match="número"):
        validate_password("soloclaro")


def test_password_validation_errors_lists_missing_rules():
    errors = password_validation_errors("123")
    assert any("8 caracteres" in item for item in errors)
    assert any("letras" in item for item in errors)


def test_password_requirements_text_is_documented():
    assert str(MIN_PASSWORD_LENGTH) in PASSWORD_REQUIREMENTS_TEXT


def test_validate_password_rejects_too_long():
    too_long = "a1" + ("x" * 80)
    with pytest.raises(ValueError, match="demasiado larga"):
        validate_password(too_long)


def test_hash_and_verify_password():
    hashed = hash_password("Clinica2024")
    assert verify_password("Clinica2024", hashed)
    assert not verify_password("otra-clave", hashed)


def test_strip_sensitive_profile_fields():
    profile = {"id": "1", "email": "a@b.com", "password_hash": "secret"}
    clean = strip_sensitive_profile_fields(profile)
    assert "password_hash" not in clean
    assert clean["has_password"] is True
    assert clean["email"] == "a@b.com"
