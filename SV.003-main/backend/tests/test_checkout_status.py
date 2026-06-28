"""Regression tests for checkout status fulfillment."""
from __future__ import annotations

import asyncio
import os
import sys
import unittest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import server_simple  # noqa: E402


class CheckoutStatusTests(unittest.TestCase):
    def test_simulated_checkout_status_does_not_mark_paid_or_apply_credits(self):
        transaction = {
            "session_id": "sim_regression",
            "type": "consultation_credits",
            "credits": 5,
            "status": "open",
            "payment_status": "unpaid",
            "veterinarian_id": "vet-1",
        }
        calls = {"transaction_updates": [], "profile_updates": []}

        original_stripe = server_simple.stripe
        original_stripe_key = server_simple.STRIPE_API_KEY
        original_get_transaction = server_simple.get_payment_transaction_by_session_id
        original_update_transaction = server_simple.update_payment_transaction
        original_get_profile = server_simple.get_profile
        original_update_profile = server_simple.update_profile

        def fake_get_transaction(session_id):
            self.assertEqual(session_id, "sim_regression")
            return transaction, None

        def fake_update_transaction(session_id, fields):
            calls["transaction_updates"].append((session_id, fields))
            return None

        def fake_get_profile(vet_id):
            return {"id": vet_id, "consultations_remaining": 1}, None

        def fake_update_profile(vet_id, fields):
            calls["profile_updates"].append((vet_id, fields))
            return None

        try:
            server_simple.stripe = None
            server_simple.STRIPE_API_KEY = ""
            server_simple.get_payment_transaction_by_session_id = fake_get_transaction
            server_simple.update_payment_transaction = fake_update_transaction
            server_simple.get_profile = fake_get_profile
            server_simple.update_profile = fake_update_profile

            response = asyncio.run(
                server_simple.get_checkout_status(
                    "sim_regression",
                    x_veterinarian_id="vet-1",
                )
            )
        finally:
            server_simple.stripe = original_stripe
            server_simple.STRIPE_API_KEY = original_stripe_key
            server_simple.get_payment_transaction_by_session_id = original_get_transaction
            server_simple.update_payment_transaction = original_update_transaction
            server_simple.get_profile = original_get_profile
            server_simple.update_profile = original_update_profile

        self.assertEqual(response["status"], "open")
        self.assertEqual(response["payment_status"], "unpaid")
        self.assertEqual(calls["transaction_updates"], [])
        self.assertEqual(calls["profile_updates"], [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
