"""Tests de contraseñas bcrypt."""
from __future__ import annotations

import pytest

from password_auth import (
    hash_password,
    strip_sensitive_profile_fields,
    validate_password,
    verify_password,
)


def test_validate_password_min_length():
    with pytest.raises(ValueError):
        validate_password("abc")
    assert validate_password("12345678") == "12345678"


def test_hash_and_verify_password():
    hashed = hash_password("MiClaveSegura123")
    assert verify_password("MiClaveSegura123", hashed)
    assert not verify_password("otra-clave", hashed)


def test_strip_sensitive_profile_fields():
    profile = {"id": "1", "email": "a@b.com", "password_hash": "secret"}
    clean = strip_sensitive_profile_fields(profile)
    assert "password_hash" not in clean
    assert clean["has_password"] is True
    assert clean["email"] == "a@b.com"
