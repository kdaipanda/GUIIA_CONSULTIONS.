"""Tests for Stripe webhook payment application."""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-webhook-tests")
os.environ.setdefault("ENVIRONMENT", "development")

import server_simple  # noqa: E402


class _FakeRequest:
    headers = {"stripe-signature": "sig_test"}

    async def body(self) -> bytes:
        return b"{}"


def test_stripe_webhook_applies_full_paid_credit_pack_for_non_member(monkeypatch):
    transaction = {
        "session_id": "cs_test_credits",
        "type": "consultation_credits",
        "credits": 10,
        "veterinarian_id": "vet-123",
        "credits_applied": False,
    }
    profile_updates: list[tuple[str, dict]] = []
    transaction_updates: list[tuple[str, dict]] = []

    class _FakeWebhook:
        @staticmethod
        def construct_event(**_kwargs):
            return {
                "type": "checkout.session.completed",
                "data": {
                    "object": {
                        "id": "cs_test_credits",
                        "payment_status": "paid",
                        "status": "complete",
                        "metadata": {
                            "type": "consultation_credits",
                            "credits": "10",
                            "veterinarian_id": "vet-123",
                        },
                    }
                },
            }

    class _FakeStripe:
        Webhook = _FakeWebhook

    monkeypatch.setattr(server_simple, "stripe", _FakeStripe)
    monkeypatch.setattr(server_simple, "STRIPE_WEBHOOK_SECRET", "whsec_test")
    monkeypatch.setattr(
        server_simple,
        "get_payment_transaction_by_session_id",
        lambda _session_id: (transaction, None),
    )
    monkeypatch.setattr(
        server_simple,
        "get_profile",
        lambda _vet_id: (
            {
                "id": "vet-123",
                "membership_type": None,
                "consultations_remaining": 0,
            },
            None,
        ),
    )
    monkeypatch.setattr(
        server_simple,
        "update_profile",
        lambda vet_id, data: profile_updates.append((vet_id, data)) or None,
    )
    monkeypatch.setattr(
        server_simple,
        "update_payment_transaction",
        lambda session_id, data: transaction_updates.append((session_id, data)) or None,
    )

    async def _noop_meta_purchase(*_args, **_kwargs):
        return None

    monkeypatch.setattr(server_simple, "_send_meta_purchase_if_needed", _noop_meta_purchase)

    result = asyncio.run(server_simple.stripe_webhook(_FakeRequest()))

    assert result == {"received": True}
    assert profile_updates == [
        ("vet-123", {"consultations_remaining": 10}),
    ]
    assert any(
        data.get("credits_applied") is True
        and data.get("consultations_remaining_after") == 10
        for _session_id, data in transaction_updates
    )
