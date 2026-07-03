"""Tests: configuración Stripe Checkout LATAM."""
from __future__ import annotations

import os
import sys
import unittest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from stripe_checkout_config import (  # noqa: E402
    build_stripe_checkout_session_kwargs,
    is_async_payment_pending,
    membership_promotion_checkout_kwargs,
    normalize_country_code,
    stripe_payment_method_types,
)


class StripeCheckoutConfigTests(unittest.TestCase):
    def test_normalize_country_mexico_variants(self):
        self.assertEqual(normalize_country_code("MX"), "MX")
        self.assertEqual(normalize_country_code("mexico"), "MX")

    def test_mexico_mxn_includes_oxxo(self):
        methods = stripe_payment_method_types("mxn", "MX")
        self.assertEqual(methods, ["card", "oxxo"])

    def test_colombia_mxn_card_only(self):
        methods = stripe_payment_method_types("mxn", "CO")
        self.assertEqual(methods, ["card"])

    def test_build_kwargs_spanish_and_email(self):
        profile = {"email": "vet@guiaa.vet", "profesional_pais": "MX"}
        kwargs = build_stripe_checkout_session_kwargs(profile, currency="mxn")
        self.assertEqual(kwargs["locale"], "es")
        self.assertEqual(kwargs["customer_email"], "vet@guiaa.vet")
        self.assertIn("oxxo", kwargs["payment_method_types"])

    def test_async_payment_pending(self):
        self.assertTrue(is_async_payment_pending("unpaid", "complete"))
        self.assertFalse(is_async_payment_pending("paid", "complete"))

    def test_premium_membership_allows_promotion_codes(self):
        kwargs = membership_promotion_checkout_kwargs("premium")
        self.assertEqual(kwargs, {"allow_promotion_codes": True})

    def test_basic_membership_no_promotion_codes(self):
        self.assertEqual(membership_promotion_checkout_kwargs("basic"), {})
        self.assertEqual(membership_promotion_checkout_kwargs("professional"), {})


if __name__ == "__main__":
    unittest.main(verbosity=2)
