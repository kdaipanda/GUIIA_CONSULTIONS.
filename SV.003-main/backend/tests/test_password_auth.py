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
    with pytest.raises(ValueError, match="requisitos"):
        validate_password("abc")
    with pytest.raises(ValueError):
        validate_password("12345678")


def test_validate_password_requires_mixed_rules():
    assert validate_password("Segura123!") == "Segura123!"
    with pytest.raises(ValueError):
        validate_password("segura123!")
    with pytest.raises(ValueError):
        validate_password("SEGURA123!")
    with pytest.raises(ValueError):
        validate_password("SeguraSegura!")
    with pytest.raises(ValueError):
        validate_password("Segura1234")


def test_password_validation_errors_lists_all_missing_rules():
    errors = password_validation_errors("abc")
    assert f"Al menos {MIN_PASSWORD_LENGTH} caracteres" in errors
    assert "Una letra mayúscula" in errors
    assert "Un número" in errors


def test_password_requirements_text_is_documented():
    assert str(MIN_PASSWORD_LENGTH) in PASSWORD_REQUIREMENTS_TEXT


def test_hash_and_verify_password():
    hashed = hash_password("MiClaveSegura123!")
    assert verify_password("MiClaveSegura123!", hashed)
    assert not verify_password("otra-clave", hashed)


def test_strip_sensitive_profile_fields():
    profile = {"id": "1", "email": "a@b.com", "password_hash": "secret"}
    clean = strip_sensitive_profile_fields(profile)
    assert "password_hash" not in clean
    assert clean["has_password"] is True
    assert clean["email"] == "a@b.com"
