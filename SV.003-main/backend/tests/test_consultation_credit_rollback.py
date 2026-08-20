from __future__ import annotations

import asyncio

import pytest
from fastapi import HTTPException

import server_simple


def test_create_consultation_rolls_back_when_credit_debit_fails(monkeypatch):
    deleted_ids: list[str] = []

    monkeypatch.setattr(server_simple, "_require_vet_id", lambda _header: "vet-1")
    monkeypatch.setattr(
        server_simple,
        "get_profile",
        lambda _vet_id: (
            {
                "id": "vet-1",
                "email": "trial@example.com",
                "membership_type": None,
                "consultations_remaining": 1,
            },
            None,
        ),
    )
    monkeypatch.setattr(server_simple, "insert_consultation", lambda row: (dict(row), None))
    monkeypatch.setattr(server_simple, "update_profile", lambda _vet_id, _fields: "supabase timeout")

    def fake_delete_consultation(consultation_id: str):
        deleted_ids.append(consultation_id)
        return None

    monkeypatch.setattr(server_simple, "delete_consultation", fake_delete_consultation)

    payload = server_simple.ConsultationStageOne(
        veterinarian_id="vet-1",
        category="perros",
        consultation_data={"motivo": "tos"},
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(server_simple.create_consultation(payload, x_veterinarian_id="vet-1"))

    assert exc.value.status_code == 500
    assert deleted_ids
