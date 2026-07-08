"""Tests de contraseñas bcrypt."""
from __future__ import annotations

import pytest

from password_auth import (
    MIN_PASSWORD_LENGTH,
    PASSWORD_REQUIREMENTS_TEXT,
    hash_password,
    password_validation_errors,
    prepare_password_for_bcrypt,
    strip_sensitive_profile_fields,
    validate_password,
    verify_password,
)


def test_validate_password_min_length():
    with pytest.raises(ValueError, match="6 caracteres"):
        validate_password("ab1")
    assert validate_password("vet001") == "vet001"


def test_validate_password_requires_letter_and_digit():
    assert validate_password("Vet2024") == "Vet2024"
    with pytest.raises(ValueError, match="letras"):
        validate_password("123456")
    with pytest.raises(ValueError, match="número"):
        validate_password("solito")


def test_password_validation_errors_lists_missing_rules():
    errors = password_validation_errors("123")
    assert any("6 caracteres" in item for item in errors)
    assert any("letras" in item for item in errors)


def test_password_requirements_text_is_documented():
    assert str(MIN_PASSWORD_LENGTH) in PASSWORD_REQUIREMENTS_TEXT


def test_hash_password_accepts_long_password():
    long_password = "Vet1" + ("x" * 80)
    hashed = hash_password(long_password)
    assert verify_password(long_password, hashed)
    assert verify_password("Vet1" + ("x" * 80), hashed)


def test_prepare_password_for_bcrypt_truncates_bytes():
    long_password = "á" * 40  # >72 bytes in utf-8
    prepared = prepare_password_for_bcrypt("Vet1" + long_password)
    assert len(prepared.encode("utf-8")) <= 72


def test_hash_password_maps_bcrypt_errors(monkeypatch):
    def boom(_value, _salt):
        raise ValueError("bcrypt backend failure")

    monkeypatch.setattr("password_auth.bcrypt.hashpw", boom)
    with pytest.raises(ValueError, match="No se pudo guardar"):
        hash_password("Vet2024")


def test_hash_and_verify_password():
    hashed = hash_password("Vet2024")
    assert verify_password("Vet2024", hashed)
    assert not verify_password("otra-clave", hashed)


def test_strip_sensitive_profile_fields():
    profile = {"id": "1", "email": "a@b.com", "password_hash": "secret"}
    clean = strip_sensitive_profile_fields(profile)
    assert "password_hash" not in clean
    assert clean["has_password"] is True
    assert clean["email"] == "a@b.com"
