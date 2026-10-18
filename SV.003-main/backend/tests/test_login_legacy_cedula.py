"""Tests del login legado email + matrícula."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-login-tests")
os.environ.setdefault("ENVIRONMENT", "development")

import server_simple  # noqa: E402


def _profile(email: str, **extra):
    data = {
        "id": f"vet-{email}",
        "email": email,
        "cedula_profesional": "ABC-123",
        "password_hash": "",
    }
    data.update(extra)
    return data


def test_real_legacy_cedula_login_is_rejected(monkeypatch):
    profile = _profile("real@example.com")
    credential_lookup_called = False

    def fake_get_profile_by_credentials(_email, _cedula):
        nonlocal credential_lookup_called
        credential_lookup_called = True
        return profile, None

    monkeypatch.delenv("ENABLE_LEGACY_CEDULA_LOGIN", raising=False)
    monkeypatch.setattr(server_simple, "get_profile_by_email", lambda _email: (profile, None))
    monkeypatch.setattr(server_simple, "get_profile_by_credentials", fake_get_profile_by_credentials)

    with pytest.raises(HTTPException) as exc:
        server_simple._authenticate_login_profile(
            server_simple.VeterinarianLogin(
                email="real@example.com",
                cedula_profesional="ABC-123",
            )
        )

    assert exc.value.status_code == 403
    assert credential_lookup_called is False


def test_dev_legacy_cedula_login_remains_available(monkeypatch):
    profile = _profile("basico@guiaa.vet")

    monkeypatch.delenv("ENABLE_LEGACY_CEDULA_LOGIN", raising=False)
    monkeypatch.setattr(server_simple, "get_profile_by_email", lambda _email: (profile, None))
    monkeypatch.setattr(server_simple, "get_profile_by_credentials", lambda _email, _cedula: (profile, None))

    result = server_simple._authenticate_login_profile(
        server_simple.VeterinarianLogin(
            email="basico@guiaa.vet",
            cedula_profesional="ABC-123",
        )
    )

    assert result is profile


def test_legacy_cedula_login_can_be_temporarily_enabled(monkeypatch):
    profile = _profile("real@example.com")

    monkeypatch.setenv("ENABLE_LEGACY_CEDULA_LOGIN", "true")
    monkeypatch.setattr(server_simple, "get_profile_by_email", lambda _email: (profile, None))
    monkeypatch.setattr(server_simple, "get_profile_by_credentials", lambda _email, _cedula: (profile, None))

    result = server_simple._authenticate_login_profile(
        server_simple.VeterinarianLogin(
            email="real@example.com",
            cedula_profesional="ABC-123",
        )
    )

    assert result is profile
