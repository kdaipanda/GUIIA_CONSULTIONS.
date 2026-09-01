"""Tests del bloqueo de cédula antes de emitir JWT tras 2FA."""
from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-twofa-tests")
os.environ.setdefault("ENVIRONMENT", "development")

from server_simple import (  # noqa: E402
    CEDULA_STATUS_PENDING,
    CEDULA_STATUS_REJECTED,
    CEDULA_STATUS_VERIFIED,
    _cedula_auth_gate_response,
)


def _profile(**overrides):
    return {
        "id": "vet-2fa",
        "email": "vet@example.com",
        "nombre": "Dra. 2FA",
        "cedula_verification_status": CEDULA_STATUS_VERIFIED,
        "cedula_document_url": "cedulas/vet-2fa.pdf",
        "cedula_skip_count": 0,
        **overrides,
    }


def test_rejected_profile_requires_cedula_flow_before_issuing_2fa_jwt():
    response = _cedula_auth_gate_response(
        _profile(
            cedula_verification_status=CEDULA_STATUS_REJECTED,
            cedula_document_url="cedulas/vet-2fa.pdf",
        )
    )

    assert response is not None
    assert response["status"] == "requires_cedula_flow"
    assert response["verification_status"] == CEDULA_STATUS_REJECTED
    assert response["can_skip"] is False
    assert "access_token" not in response


def test_pending_profile_with_uploaded_document_can_complete_2fa():
    response = _cedula_auth_gate_response(
        _profile(cedula_verification_status=CEDULA_STATUS_PENDING)
    )

    assert response is None
