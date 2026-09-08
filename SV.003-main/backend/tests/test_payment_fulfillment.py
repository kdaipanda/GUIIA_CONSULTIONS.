"""QA: activación de membresía/créditos al confirmar un pago."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from payment_fulfillment import fulfill_paid_transaction  # noqa: E402


class PaymentFulfillmentTests(unittest.TestCase):
    def test_membership_writes_profile_not_memory(self):
        profile = {
            "id": "vet-1",
            "email": "vet@guiaa.vet",
            "membership_type": None,
            "consultations_remaining": 1,
        }
        updates = {}

        def fake_update_profile(profile_id, fields):
            updates["profile"] = (profile_id, fields)
            profile.update(fields)
            return None

        def fake_update_tx(session_id, fields):
            updates["tx"] = (session_id, fields)
            return None

        def fake_get_profile(profile_id):
            return (profile, None)

        tx = {
            "session_id": "cs_live_test",
            "type": "membership",
            "package": "professional",
            "billing_cycle": "monthly",
            "veterinarian_id": "vet-1",
            "membership_activated": False,
        }
        with patch("payment_fulfillment.update_profile", fake_update_profile), patch(
            "payment_fulfillment.update_payment_transaction", fake_update_tx
        ), patch("payment_fulfillment.get_profile", fake_get_profile):
            updated, err, applied = fulfill_paid_transaction(tx)

        self.assertIsNone(err)
        self.assertTrue(applied)
        self.assertEqual(updates["profile"][0], "vet-1")
        self.assertEqual(updates["profile"][1]["membership_type"], "professional")
        self.assertEqual(updates["profile"][1]["consultations_remaining"], 35)
        self.assertTrue(updates["tx"][1]["membership_activated"])
        self.assertEqual(updated["membership_type"], "professional")

    def test_membership_is_idempotent(self):
        tx = {
            "session_id": "cs_live_test",
            "type": "membership",
            "package": "premium",
            "veterinarian_id": "vet-1",
            "membership_activated": True,
        }
        with patch(
            "payment_fulfillment.get_profile",
            return_value=({"id": "vet-1", "membership_type": "premium"}, None),
        ), patch("payment_fulfillment.update_profile") as upd:
            _, err, applied = fulfill_paid_transaction(tx)
        self.assertIsNone(err)
        self.assertFalse(applied)
        upd.assert_not_called()

    def test_unknown_package_errors(self):
        tx = {
            "session_id": "cs_live_test",
            "type": "membership",
            "package": "gold",
            "veterinarian_id": "vet-1",
        }
        profile, err, applied = fulfill_paid_transaction(tx)
        self.assertIsNone(profile)
        self.assertFalse(applied)
        self.assertIn("desconocido", err or "")


if __name__ == "__main__":
    unittest.main()
