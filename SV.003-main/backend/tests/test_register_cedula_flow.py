"""Registro: no emitir JWT completo antes de subir documento profesional."""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-register-tests")
os.environ.setdefault("ENVIRONMENT", "development")

import auth_security  # noqa: E402
import server_simple  # noqa: E402


def test_register_non_dev_returns_limited_cedula_flow_nonce(monkeypatch):
    auth_security._cedula_flow_store.clear()
    saved_profiles = []

    monkeypatch.setattr(
        server_simple.rate_limit,
        "check_rate_limit",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        server_simple.rate_limit,
        "reset_rate_limit",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(server_simple, "get_profile_by_email", lambda email: (None, None))
    monkeypatch.setattr(server_simple, "get_profile_by_cedula", lambda cedula: (None, None))

    def fake_upsert_profile(profile):
        saved_profiles.append(profile)
        return profile, None

    monkeypatch.setattr(server_simple, "upsert_profile", fake_upsert_profile)
    monkeypatch.setattr(
        server_simple.cedula_verification,
        "maybe_send_cedula_upload_reminder",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        server_simple.email_notifications,
        "notify_admins_new_registration",
        lambda *args, **kwargs: None,
    )

    async def fake_track_complete_registration_capi(*args, **kwargs):
        return True

    monkeypatch.setattr(
        server_simple.meta_capi,
        "track_complete_registration_capi",
        fake_track_complete_registration_capi,
    )

    vet = server_simple.VeterinarianRegister(
        nombre="Dra. Ana Lopez",
        email="ana.lopez@example-vet.test",
        telefono="5551234567",
        cedula_profesional="MVZ-12345",
        profesional_pais="MX",
        especialidad="Medicina general",
        años_experiencia=8,
        institucion="Clinica Centro",
        password="Vet2024",
    )

    response = asyncio.run(server_simple.register_veterinarian(vet, object()))

    assert response["status"] == "requires_cedula_flow"
    assert response["veterinarian_id"] == saved_profiles[0]["id"]
    assert response["needs_upload"] is True
    assert "cedula_flow_nonce" in response
    assert "access_token" not in response
    assert (
        auth_security.verify_cedula_flow_nonce(
            response["cedula_flow_nonce"],
            response["veterinarian_id"],
        )
        == response["veterinarian_id"]
    )
