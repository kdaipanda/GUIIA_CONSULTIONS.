"""Tests for appointment request approval safety."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from unittest.mock import AsyncMock, Mock

import pytest
from fastapi import HTTPException

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

import auth_security  # noqa: E402
import clinic_routes  # noqa: E402


def _pending_request(**overrides):
    row = {
        "id": "request-1",
        "organization_id": "org-1",
        "status": "pending",
        "client_name": "Ana",
        "patient_name": "Luna",
        "species": "perro",
        "preferred_starts_at": None,
        "reason": "Consulta",
    }
    row.update(overrides)
    return row


def _run_approval(body):
    auth_security.set_request_vet_id("vet-1")
    try:
        return asyncio.run(
            clinic_routes.api_update_appointment_request(
                "request-1",
                body,
                x_veterinarian_id="vet-1",
            )
        )
    finally:
        auth_security.set_request_vet_id(None)


def test_approve_request_with_invalid_start_date_does_not_update(monkeypatch):
    monkeypatch.setattr(
        clinic_routes,
        "_resolve_org_context",
        AsyncMock(return_value={"organization_id": "org-1", "role": "admin"}),
    )
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "get_appointment_request",
        Mock(return_value=(_pending_request(), None)),
    )
    update_request = Mock()
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "update_appointment_request",
        update_request,
    )

    with pytest.raises(HTTPException) as exc:
        _run_approval(
            clinic_routes.AppointmentRequestUpdate(
                status="approved",
                starts_at="not-a-date",
            )
        )

    assert exc.value.status_code == 400
    update_request.assert_not_called()


def test_approve_request_with_appointment_insert_failure_keeps_request_pending(monkeypatch):
    monkeypatch.setattr(
        clinic_routes,
        "_resolve_org_context",
        AsyncMock(return_value={"organization_id": "org-1", "role": "admin"}),
    )
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "get_appointment_request",
        Mock(return_value=(_pending_request(), None)),
    )
    monkeypatch.setattr(clinic_routes.clinic_db, "list_clients", Mock(return_value=([], None)))
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "insert_client",
        Mock(return_value=({"id": "client-1"}, None)),
    )
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "insert_patient",
        Mock(return_value=({"id": "patient-1"}, None)),
    )
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "insert_appointment",
        Mock(return_value=(None, "db unavailable")),
    )
    update_request = Mock()
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "update_appointment_request",
        update_request,
    )

    with pytest.raises(HTTPException) as exc:
        _run_approval(clinic_routes.AppointmentRequestUpdate(status="approved"))

    assert exc.value.status_code == 500
    update_request.assert_not_called()
