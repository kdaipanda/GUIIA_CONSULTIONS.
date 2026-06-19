import importlib
import os
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import ANY, AsyncMock, Mock, patch

from fastapi import HTTPException


BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class ServerSimpleSecurityPaymentsTest(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        os.environ["ADMIN_API_TOKEN"] = "admin-secret"
        cls.server_simple = importlib.import_module("server_simple")
        cls.server_simple.ADMIN_API_TOKEN = "admin-secret"

    def test_admin_token_is_required_and_compared(self):
        self.server_simple._require_admin_token("admin-secret")

        with self.assertRaises(HTTPException) as missing:
            self.server_simple._require_admin_token(None)
        self.assertEqual(missing.exception.status_code, 403)

        with self.assertRaises(HTTPException) as mismatch:
            self.server_simple._require_admin_token("wrong")
        self.assertEqual(mismatch.exception.status_code, 403)

    async def test_delete_user_rejects_requests_without_admin_token(self):
        with patch("supabase_client.delete_profile_by_email") as delete_profile:
            with self.assertRaises(HTTPException) as exc:
                await self.server_simple.delete_user_by_email(
                    "victim@example.com",
                    x_admin_token=None,
                )

        self.assertEqual(exc.exception.status_code, 403)
        delete_profile.assert_not_called()

    async def test_membership_webhook_updates_supabase_not_memory_db(self):
        event = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_membership",
                    "payment_status": "paid",
                    "status": "complete",
                    "metadata": {},
                }
            },
        }

        class FakeWebhook:
            @staticmethod
            def construct_event(payload, sig_header, secret):
                return event

        class FakeRequest:
            headers = {"stripe-signature": "sig"}

            async def body(self):
                return b"{}"

        transaction = {
            "session_id": "cs_test_membership",
            "type": "membership",
            "package": "basic",
            "billing_cycle": "monthly",
            "payment_status": "paid",
            "status": "complete",
            "veterinarian_id": "vet-1",
            "membership_activated": False,
        }

        self.server_simple.STRIPE_WEBHOOK_SECRET = "whsec_test"
        self.server_simple.stripe = SimpleNamespace(Webhook=FakeWebhook)

        with patch.object(
            self.server_simple,
            "get_payment_transaction_by_session_id",
            Mock(return_value=(transaction, None)),
        ), patch.object(
            self.server_simple,
            "update_profile",
            Mock(return_value=None),
        ) as update_profile, patch.object(
            self.server_simple,
            "update_payment_transaction",
            Mock(return_value=None),
        ) as update_payment_transaction, patch.object(
            self.server_simple,
            "update_one_db",
            AsyncMock(),
        ) as update_one_db:
            response = await self.server_simple.stripe_webhook(FakeRequest())

        self.assertEqual(response, {"received": True})
        update_profile.assert_called_once()
        self.assertEqual(update_profile.call_args.args[0], "vet-1")
        self.assertEqual(update_profile.call_args.args[1]["membership_type"], "basic")
        self.assertEqual(update_profile.call_args.args[1]["consultations_remaining"], 30)
        update_payment_transaction.assert_any_call(
            "cs_test_membership",
            {
                "membership_activated": True,
                "membership_activated_at": ANY,
            },
        )
        update_one_db.assert_not_called()


if __name__ == "__main__":
    unittest.main()
