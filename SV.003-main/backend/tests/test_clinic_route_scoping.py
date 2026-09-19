"""Regression tests for clinic route tenant scoping."""

from __future__ import annotations

import asyncio
import os
import sys

import pytest
from fastapi import HTTPException

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import clinic_routes  # noqa: E402


async def _org_context(_vet_id: str) -> dict:
    return {
        "organization_id": "org-1",
        "role": "admin",
        "profile": {"id": "vet-1", "membership_type": "premium"},
    }


def test_create_appointment_rejects_patient_client_mismatch(monkeypatch):
    monkeypatch.setattr(clinic_routes, "_require_vet_id", lambda _header: "vet-1")
    monkeypatch.setattr(clinic_routes, "_resolve_org_context", _org_context)
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "get_patient",
        lambda patient_id, org_id: ({"id": patient_id, "client_id": "client-a"}, None),
    )
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "get_client",
        lambda client_id, org_id: ({"id": client_id}, None),
    )
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "insert_appointment",
        lambda row: pytest.fail("appointment should not be inserted"),
    )

    body = clinic_routes.AppointmentCreate(
        patient_id="patient-1",
        client_id="client-b",
        starts_at="2026-07-14T12:00:00Z",
        ends_at="2026-07-14T12:30:00Z",
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(clinic_routes.api_create_appointment(body, x_veterinarian_id="vet-1"))

    assert exc.value.status_code == 400
    assert "no pertenece" in exc.value.detail


def test_update_appointment_rejects_foreign_client(monkeypatch):
    monkeypatch.setattr(clinic_routes, "_require_vet_id", lambda _header: "vet-1")
    monkeypatch.setattr(clinic_routes, "_resolve_org_context", _org_context)
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "get_appointment",
        lambda appointment_id, org_id: (
            {"id": appointment_id, "patient_id": "patient-1", "client_id": "client-a"},
            None,
        ),
    )
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "get_patient",
        lambda patient_id, org_id: ({"id": patient_id, "client_id": "client-a"}, None),
    )
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "get_client",
        lambda client_id, org_id: (None, None),
    )
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "update_appointment",
        lambda appointment_id, org_id, fields: pytest.fail("appointment should not be updated"),
    )

    body = clinic_routes.AppointmentUpdate(client_id="client-from-other-org")

    with pytest.raises(HTTPException) as exc:
        asyncio.run(clinic_routes.api_update_appointment("appt-1", body, x_veterinarian_id="vet-1"))

    assert exc.value.status_code == 404
    assert exc.value.detail == "Cliente no encontrado"


def test_create_invoice_rejects_foreign_patient(monkeypatch):
    monkeypatch.setattr(clinic_routes, "_require_vet_id", lambda _header: "vet-1")
    monkeypatch.setattr(clinic_routes, "_resolve_org_context", _org_context)
    monkeypatch.setattr(clinic_routes, "_require_membership_feature", lambda ctx, feature: None)
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "get_patient",
        lambda patient_id, org_id: (None, None),
    )
    monkeypatch.setattr(
        clinic_routes.clinic_db,
        "create_invoice_with_items",
        lambda *args, **kwargs: pytest.fail("invoice should not be created"),
    )

    body = clinic_routes.InvoiceCreate(
        patient_id="patient-from-other-org",
        items=[clinic_routes.InvoiceItemCreate(description="Consulta", quantity=1, unit_price=500)],
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(clinic_routes.api_create_invoice(body, x_veterinarian_id="vet-1"))

    assert exc.value.status_code == 404
    assert exc.value.detail == "Paciente no encontrado"
