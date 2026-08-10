"""Regresiones del orden 2FA -> flujo de cédula."""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-login-2fa")
os.environ.setdefault("ENVIRONMENT", "development")

import server_simple  # noqa: E402


def _unverified_2fa_profile() -> dict:
    return {
        "id": "vet-2fa-cedula",
        "email": "seguridad@example.com",
        "nombre": "MVZ Seguridad",
        "password_hash": "stored-hash",
        "two_factor_enabled": True,
        "cedula_profesional": "ABC123",
        "cedula_verification_status": server_simple.CEDULA_STATUS_UNSUBMITTED,
        "cedula_document_url": None,
        "cedula_skip_count": 0,
    }


def test_login_requires_2fa_before_issuing_cedula_flow_nonce(monkeypatch):
    profile = _unverified_2fa_profile()
    server_simple.MEMORY_DB["temp_2fa_codes"] = {}

    monkeypatch.setattr(server_simple.rate_limit, "check_rate_limit", lambda *args, **kwargs: None)
    monkeypatch.setattr(server_simple.rate_limit, "reset_rate_limit", lambda *args, **kwargs: None)
    monkeypatch.setattr(server_simple.password_auth, "verify_password", lambda *args, **kwargs: True)
    monkeypatch.setattr(server_simple, "get_profile_by_email", lambda email: (profile.copy(), None))
    monkeypatch.setattr(server_simple, "get_profile", lambda vet_id: (profile.copy(), None))
    monkeypatch.setattr(server_simple, "generate_2fa_code", lambda: "123456")
    monkeypatch.setattr(server_simple, "generate_nonce", lambda: "nonce-2fa")
    monkeypatch.setattr(
        server_simple.cedula_verification,
        "maybe_send_cedula_upload_reminder",
        lambda *args, **kwargs: None,
    )

    async def noop_email_background(*args, **kwargs):
        return None

    monkeypatch.setattr(server_simple, "_email_background", noop_email_background)

    async def scenario():
        login_response = await server_simple.login_veterinarian(
            server_simple.VeterinarianLogin(
                email="seguridad@example.com",
                password="correct-password",
            ),
            request=object(),
        )

        assert login_response == {
            "status": "pending_2fa",
            "nonce": "nonce-2fa",
            "message": "Enviamos un código de verificación a tu email.",
        }
        assert "cedula_flow_nonce" not in login_response
        assert "access_token" not in login_response

        cedula_response = await server_simple.verify_2fa(
            server_simple.TwoFactorVerify(nonce="nonce-2fa", code="123456"),
            request=object(),
        )

        assert cedula_response["status"] == "requires_cedula_flow"
        assert cedula_response["veterinarian_id"] == profile["id"]
        assert cedula_response["cedula_flow_nonce"]
        assert "access_token" not in cedula_response

    asyncio.run(scenario())
