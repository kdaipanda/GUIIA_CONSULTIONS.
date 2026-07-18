from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-credit-tests")
os.environ.setdefault("ENVIRONMENT", "development")

import auth_security  # noqa: E402
import server_simple  # noqa: E402
import supabase_client  # noqa: E402


class _FakeSupabaseResponse:
    def __init__(self, data):
        self.data = data


class _FakeProfileTable:
    def __init__(self, existing_remaining: int):
        self.existing_remaining = existing_remaining
        self.fields = {}
        self.filters = []
        self.returning = None

    def update(self, fields, returning=None):
        self.fields = fields
        self.returning = returning
        return self

    def eq(self, key, value):
        self.filters.append((key, value))
        return self

    def execute(self):
        if ("consultations_remaining", self.existing_remaining) not in self.filters:
            return _FakeSupabaseResponse([])
        return _FakeSupabaseResponse(
            [{"consultations_remaining": self.fields["consultations_remaining"]}]
        )


class _FakeSupabaseClient:
    def __init__(self, existing_remaining: int):
        self.existing_remaining = existing_remaining
        self.tables = []

    def table(self, name: str):
        assert name == "profiles"
        table = _FakeProfileTable(self.existing_remaining)
        self.tables.append(table)
        return table


def test_debit_profile_consultation_credit_is_conditional(monkeypatch):
    fake_client = _FakeSupabaseClient(existing_remaining=1)
    monkeypatch.setattr(supabase_client, "get_supabase_client", lambda: fake_client)

    new_remaining, err = supabase_client.debit_profile_consultation_credit("vet-1", 1)

    assert err is None
    assert new_remaining == 0
    assert ("id", "vet-1") in fake_client.tables[0].filters
    assert ("consultations_remaining", 1) in fake_client.tables[0].filters
    assert fake_client.tables[0].returning == "representation"


def test_debit_profile_consultation_credit_reports_conflict(monkeypatch):
    fake_client = _FakeSupabaseClient(existing_remaining=0)
    monkeypatch.setattr(supabase_client, "get_supabase_client", lambda: fake_client)

    new_remaining, err = supabase_client.debit_profile_consultation_credit("vet-1", 1)

    assert new_remaining is None
    assert err == "consultations_remaining_conflict"


def test_create_consultation_does_not_insert_when_credit_reservation_conflicts(monkeypatch):
    auth_security.set_request_vet_id("vet-1")
    inserted = {"called": False}

    monkeypatch.setattr(
        server_simple,
        "get_profile",
        lambda vet_id: (
            {
                "id": vet_id,
                "email": "trial@example.com",
                "membership_type": None,
                "consultations_remaining": 1,
            },
            None,
        ),
    )
    monkeypatch.setattr(server_simple, "has_unlimited_consultations", lambda email: False)
    monkeypatch.setattr(
        server_simple,
        "debit_profile_consultation_credit",
        lambda vet_id, remaining: (None, "consultations_remaining_conflict"),
    )

    def _insert_consultation(_row):
        inserted["called"] = True
        return ({"id": "consultation-1"}, None)

    monkeypatch.setattr(server_simple, "insert_consultation", _insert_consultation)

    payload = server_simple.ConsultationStageOne(
        veterinarian_id="vet-1",
        category="perros",
        consultation_data={"nombre_mascota": "Moka"},
    )

    try:
        with pytest.raises(HTTPException) as exc:
            asyncio.run(
                server_simple.create_consultation(payload, x_veterinarian_id="vet-1")
            )
        assert exc.value.status_code == 409
        assert inserted["called"] is False
    finally:
        auth_security.set_request_vet_id(None)
