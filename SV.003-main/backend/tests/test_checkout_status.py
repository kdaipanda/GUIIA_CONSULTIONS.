"""Tests for checkout status safety."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from unittest.mock import Mock

import pytest
from fastapi import HTTPException

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

import auth_security  # noqa: E402
import server_simple  # noqa: E402


def _run_status(session_id: str):
    auth_security.set_request_vet_id("vet-1")
    try:
        return asyncio.run(
            server_simple.get_checkout_status(
                session_id,
                x_veterinarian_id="vet-1",
            )
        )
    finally:
        auth_security.set_request_vet_id(None)


def test_real_stripe_session_without_stripe_is_not_marked_paid(monkeypatch):
    update_payment = Mock()
    monkeypatch.setattr(server_simple, "stripe", None)
    monkeypatch.setattr(server_simple, "STRIPE_API_KEY", "")
    monkeypatch.setattr(
        server_simple,
        "get_payment_transaction_by_session_id",
        Mock(
            return_value=(
                {
                    "session_id": "cs_test_123",
                    "status": "open",
                    "payment_status": "unpaid",
                    "veterinarian_id": "vet-1",
                    "type": "membership",
                    "package": "premium",
                },
                None,
            )
        ),
    )
    monkeypatch.setattr(server_simple, "update_payment_transaction", update_payment)

    with pytest.raises(HTTPException) as exc:
        _run_status("cs_test_123")

    assert exc.value.status_code == 503
    update_payment.assert_not_called()


def test_checkout_status_rejects_transactions_without_owner(monkeypatch):
    update_payment = Mock()
    monkeypatch.setattr(
        server_simple,
        "get_payment_transaction_by_session_id",
        Mock(
            return_value=(
                {
                    "session_id": "sim_orphan",
                    "status": "open",
                    "payment_status": "unpaid",
                    "veterinarian_id": "",
                    "type": "consultation_credits",
                    "credits": 5,
                },
                None,
            )
        ),
    )
    monkeypatch.setattr(server_simple, "update_payment_transaction", update_payment)

    with pytest.raises(HTTPException) as exc:
        _run_status("sim_orphan")

    assert exc.value.status_code == 403
    update_payment.assert_not_called()
