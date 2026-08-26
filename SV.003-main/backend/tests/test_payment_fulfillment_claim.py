"""Tests for one-time payment fulfillment claiming."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import supabase_client  # noqa: E402


class _FakeResponse:
    def __init__(self, data):
        self.data = data


class _FakePaymentQuery:
    def __init__(self, response_data):
        self.response_data = response_data
        self.updated_fields = None
        self.eq_calls = []
        self.or_clause = None

    def update(self, fields):
        self.updated_fields = fields
        return self

    def eq(self, field, value):
        self.eq_calls.append((field, value))
        return self

    def or_(self, clause):
        self.or_clause = clause
        return self

    def execute(self):
        return _FakeResponse(self.response_data)


class _FakeSupabase:
    def __init__(self, query):
        self.query = query
        self.tables = []

    def table(self, name):
        self.tables.append(name)
        return self.query


class PaymentFulfillmentClaimTests(unittest.TestCase):
    def test_claim_marks_flag_only_when_unfulfilled(self):
        query = _FakePaymentQuery(
            [
                {
                    "session_id": "cs_paid",
                    "credits_applied": True,
                    "credits": 10,
                }
            ]
        )
        fake_client = _FakeSupabase(query)

        with patch.object(supabase_client, "get_supabase_client", return_value=fake_client):
            row, err = supabase_client.claim_payment_transaction_fulfillment(
                "cs_paid",
                "credits_applied",
                {"credits_applied_at": "2026-08-26T12:00:00+00:00"},
            )

        self.assertIsNone(err)
        self.assertEqual(row["session_id"], "cs_paid")
        self.assertEqual(fake_client.tables, ["payment_transactions"])
        self.assertEqual(query.eq_calls, [("session_id", "cs_paid")])
        self.assertEqual(query.or_clause, "credits_applied.is.null,credits_applied.eq.false")
        self.assertEqual(
            query.updated_fields,
            {
                "credits_applied": True,
                "credits_applied_at": "2026-08-26T12:00:00+00:00",
            },
        )

    def test_claim_returns_none_when_another_worker_already_claimed(self):
        query = _FakePaymentQuery([])
        fake_client = _FakeSupabase(query)

        with patch.object(supabase_client, "get_supabase_client", return_value=fake_client):
            row, err = supabase_client.claim_payment_transaction_fulfillment(
                "cs_paid",
                "membership_activated",
                {"membership_activated_at": "2026-08-26T12:00:00+00:00"},
            )

        self.assertIsNone(err)
        self.assertIsNone(row)
        self.assertEqual(
            query.or_clause,
            "membership_activated.is.null,membership_activated.eq.false",
        )

    def test_rejects_unknown_fulfillment_flag(self):
        row, err = supabase_client.claim_payment_transaction_fulfillment(
            "cs_paid",
            "unexpected_flag",
            {},
        )

        self.assertIsNone(row)
        self.assertEqual(err, "Flag de fulfillment inválido")


if __name__ == "__main__":
    unittest.main(verbosity=2)
