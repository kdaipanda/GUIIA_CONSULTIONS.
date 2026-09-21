"""Tests de seguridad para verificación de cédula."""
from __future__ import annotations

import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-cedula-tests")
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("ALLOW_INSECURE_VET_HEADER", "true")

import server_simple  # noqa: E402


def test_cedula_verify_does_not_trust_client_supplied_expected_name(monkeypatch):
    """Client input must not rewrite the stored name used by automatic SEP checks."""
    profile = {
        "id": "vet-123",
        "email": "vet@example.com",
        "nombre": "Nombre Registrado",
        "cedula_profesional": "12345678",
        "cedula_profesional_key": "12345678",
        "cedula_document_url": "https://storage.example/cedula.pdf",
    }
    updates: list[tuple[str, dict]] = []

    monkeypatch.setattr(server_simple, "_require_vet_id", lambda header=None: "vet-123")
    monkeypatch.setattr(server_simple, "get_profile", lambda vet_id: (profile, None))

    def fake_update_profile(profile_id: str, fields: dict):
        updates.append((profile_id, fields))
        return None

    async def fake_verify_profile_cedula(profile_id: str):
        return {
            "ok": True,
            "verification_status": server_simple.CEDULA_STATUS_PENDING,
            "message": "Documento recibido.",
        }

    monkeypatch.setattr(server_simple, "update_profile", fake_update_profile)
    monkeypatch.setattr(
        server_simple.cedula_verification,
        "verify_profile_cedula",
        fake_verify_profile_cedula,
    )
    monkeypatch.setattr(
        server_simple.auth_security,
        "attach_auth_tokens",
        lambda p: {"access_token": "token", "token_type": "bearer", "id": p["id"]},
    )

    client = TestClient(server_simple.app)
    response = client.post(
        "/api/cedula/verify",
        headers={"x-veterinarian-id": "vet-123"},
        json={
            "veterinarian_id": "vet-123",
            "cedula_profesional": "12345678",
            "expected_nombre": "Nombre SEP Robado",
        },
    )

    assert response.status_code == 200
    assert all(fields.get("nombre") != "Nombre SEP Robado" for _, fields in updates)
    assert profile["nombre"] == "Nombre Registrado"
