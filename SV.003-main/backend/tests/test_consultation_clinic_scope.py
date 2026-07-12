"""Tests de alcance de consultorios al crear consultas."""

from __future__ import annotations

import asyncio
import sys
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

import server_simple


def _stage_one_payload(**overrides):
    data = {
        "veterinarian_id": "vet-1",
        "category": "general",
        "consultation_data": {"motivo": "control"},
    }
    data.update(overrides)
    return server_simple.ConsultationStageOne(**data)


@pytest.fixture(autouse=True)
def _consultation_create_base_mocks(monkeypatch):
    monkeypatch.setattr(server_simple, "_require_vet_id", lambda _header: "vet-1")
    monkeypatch.setattr(
        server_simple,
        "get_profile",
        lambda _vet_id: (
            {
                "id": "vet-1",
                "email": "vet@example.com",
                "membership_type": "premium",
                "consultations_remaining": 0,
            },
            None,
        ),
    )
    monkeypatch.setattr(server_simple, "has_unlimited_consultations", lambda _email: False)
    monkeypatch.setattr(server_simple, "validate_trial_consultations_limit", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(server_simple, "validate_consultation_category", lambda *_args, **_kwargs: None)


def test_create_consultation_rejects_spoofed_organization(monkeypatch):
    inserted_rows = []
    fake_clinic_db = SimpleNamespace(
        ensure_organization_for_profile=lambda _vet_id: (
            {"organization": {"id": "org-owned"}, "membership": {"organization_id": "org-owned"}},
            None,
        )
    )
    monkeypatch.setitem(sys.modules, "clinic_db", fake_clinic_db)
    monkeypatch.setattr(
        server_simple,
        "insert_consultation",
        lambda row: inserted_rows.append(row) or (row, None),
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            server_simple.create_consultation(
                _stage_one_payload(organization_id="org-victim"),
                x_veterinarian_id="vet-1",
            )
        )

    assert exc.value.status_code == 403
    assert inserted_rows == []


def test_create_consultation_rejects_patient_outside_owned_organization(monkeypatch):
    inserted_rows = []
    fake_clinic_db = SimpleNamespace(
        ensure_organization_for_profile=lambda _vet_id: (
            {"organization": {"id": "org-owned"}, "membership": {"organization_id": "org-owned"}},
            None,
        ),
        get_patient=lambda _patient_id, _org_id: (None, None),
    )
    monkeypatch.setitem(sys.modules, "clinic_db", fake_clinic_db)
    monkeypatch.setattr(
        server_simple,
        "insert_consultation",
        lambda row: inserted_rows.append(row) or (row, None),
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            server_simple.create_consultation(
                _stage_one_payload(patient_id="patient-foreign"),
                x_veterinarian_id="vet-1",
            )
        )

    assert exc.value.status_code == 404
    assert inserted_rows == []
