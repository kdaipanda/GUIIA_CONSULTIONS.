"""Tests de autenticación JWT, nonce de cédula e IDOR."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-auth-tests")
os.environ.setdefault("ENVIRONMENT", "development")

import auth_security  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_request_context():
    auth_security.set_request_vet_id(None)
    auth_security._cedula_flow_store.clear()
    yield
    auth_security.set_request_vet_id(None)
    auth_security._cedula_flow_store.clear()


def test_resolve_authenticated_vet_id_uses_jwt_sub():
    auth_security.set_request_vet_id("vet-a")
    assert auth_security.resolve_authenticated_vet_id(None) == "vet-a"
    assert auth_security.resolve_authenticated_vet_id("vet-a") == "vet-a"


def test_resolve_authenticated_vet_id_rejects_header_mismatch():
    auth_security.set_request_vet_id("vet-a")
    with pytest.raises(HTTPException) as exc:
        auth_security.resolve_authenticated_vet_id("vet-b")
    assert exc.value.status_code == 403


def test_cedula_flow_nonce_accepts_matching_vet():
    nonce = auth_security.create_cedula_flow_nonce("vet-123")
    assert auth_security.verify_cedula_flow_nonce(nonce, "vet-123") == "vet-123"


def test_cedula_flow_nonce_rejects_wrong_vet():
    nonce = auth_security.create_cedula_flow_nonce("vet-123")
    assert auth_security.verify_cedula_flow_nonce(nonce, "other-vet") is None


def test_checkout_status_not_public():
    assert auth_security.is_public_api_route(
        "GET", "/api/payments/checkout/status/cs_test_123"
    ) is False
