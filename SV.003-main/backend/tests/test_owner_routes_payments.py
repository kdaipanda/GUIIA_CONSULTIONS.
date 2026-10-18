"""QA: los pagos B2C de dueños no se cumplen sin verificación real en producción."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import owner_routes  # noqa: E402


class OwnerPaymentRoutesTests(unittest.IsolatedAsyncioTestCase):
    async def test_production_checkout_without_stripe_blocks_simulation(self):
        payload = owner_routes.OwnerCheckoutRequest(
            origin_url="https://app.guiaa.mx",
            package_id="owner_single_consultation",
        )

        with patch.dict(os.environ, {"ENVIRONMENT": "production"}, clear=True), patch(
            "owner_routes._require_owner_id", return_value="owner-1"
        ), patch(
            "owner_routes._require_owner_profile",
            new=AsyncMock(return_value={"id": "owner-1", "email": "owner@example.com"}),
        ), patch(
            "owner_routes.insert_payment_transaction"
        ) as insert_tx, patch(
            "owner_routes.stripe_mod", None
        ):
            with self.assertRaises(HTTPException) as ctx:
                await owner_routes.create_owner_checkout(payload, request=None)

        self.assertEqual(ctx.exception.status_code, 503)
        insert_tx.assert_not_called()

    async def test_production_simulated_status_does_not_fulfill_owner_session(self):
        tx = {
            "session_id": "sim_owner_123",
            "type": owner_routes.OWNER_PAYMENT_TYPE,
            "veterinarian_id": "owner-1",
            "status": "open",
            "payment_status": "unpaid",
        }

        with patch.dict(os.environ, {"ENVIRONMENT": "production"}, clear=True), patch(
            "owner_routes._require_owner_id", return_value="owner-1"
        ), patch(
            "owner_routes._require_owner_profile",
            new=AsyncMock(return_value={"id": "owner-1"}),
        ), patch(
            "owner_routes.get_payment_transaction_by_session_id",
            return_value=(tx, None),
        ), patch(
            "owner_routes.sync_transaction_status"
        ) as sync_status, patch(
            "owner_routes.fulfill_paid_transaction"
        ) as fulfill:
            with self.assertRaises(HTTPException) as ctx:
                await owner_routes.owner_checkout_status("sim_owner_123")

        self.assertEqual(ctx.exception.status_code, 400)
        sync_status.assert_not_called()
        fulfill.assert_not_called()

    async def test_stripe_status_without_verifier_does_not_mark_paid(self):
        tx = {
            "session_id": "cs_live_123",
            "type": owner_routes.OWNER_PAYMENT_TYPE,
            "veterinarian_id": "owner-1",
            "status": "open",
            "payment_status": "unpaid",
            "stripe": True,
        }

        with patch.dict(os.environ, {"ENVIRONMENT": "development"}, clear=True), patch(
            "owner_routes._require_owner_id", return_value="owner-1"
        ), patch(
            "owner_routes._require_owner_profile",
            new=AsyncMock(return_value={"id": "owner-1"}),
        ), patch(
            "owner_routes.get_payment_transaction_by_session_id",
            return_value=(tx, None),
        ), patch(
            "owner_routes.sync_transaction_status"
        ) as sync_status, patch(
            "owner_routes.fulfill_paid_transaction"
        ) as fulfill, patch(
            "owner_routes.stripe_mod", None
        ):
            with self.assertRaises(HTTPException) as ctx:
                await owner_routes.owner_checkout_status("cs_live_123")

        self.assertEqual(ctx.exception.status_code, 503)
        sync_status.assert_not_called()
        fulfill.assert_not_called()


if __name__ == "__main__":
    unittest.main()
