"""Tests: configuración Stripe Checkout LATAM."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from stripe_checkout_config import (  # noqa: E402
    _normalize_promo_token,
    build_stripe_checkout_session_kwargs,
    is_async_payment_pending,
    lookup_stripe_promotion_code_id,
    membership_promotion_checkout_kwargs,
    normalize_country_code,
    resolve_premium_promotion_discount,
    stripe_payment_method_types,
)


class StripeCheckoutConfigTests(unittest.TestCase):
    def test_normalize_country_mexico_variants(self):
        self.assertEqual(normalize_country_code("MX"), "MX")
        self.assertEqual(normalize_country_code("mexico"), "MX")

    def test_normalize_promo_token(self):
        self.assertEqual(_normalize_promo_token("GUIAA FRIENDS"), "GUIAAFRIENDS")
        self.assertEqual(_normalize_promo_token("guiaafriends"), "GUIAAFRIENDS")

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

    def test_premium_auto_apply_when_promo_found(self):
        class _FakePromo:
            def __init__(self, code: str, promo_id: str):
                self.code = code
                self.id = promo_id
                self.active = True

        class _FakePromoList:
            def __init__(self, data):
                self.data = data
                self.has_more = False

        class _FakeStripe:
            class PromotionCode:
                @staticmethod
                def list(**kwargs):
                    if kwargs.get("code") == "GUIAAFRIENDS":
                        return _FakePromoList([_FakePromo("GUIAAFRIENDS", "promo_test123")])
                    return _FakePromoList([])

        kwargs = membership_promotion_checkout_kwargs("premium", _FakeStripe())
        self.assertEqual(kwargs, {"discounts": [{"promotion_code": "promo_test123"}]})

    def test_lookup_fuzzy_promo_code(self):
        class _FakePromo:
            code = "GUIAA FRIENDS"
            id = "promo_fuzzy"
            active = True

        class _FakePromoList:
            data = [_FakePromo()]
            has_more = False

        class _FakeStripe:
            class PromotionCode:
                @staticmethod
                def list(**_kwargs):
                    return _FakePromoList()

        promo_id = lookup_stripe_promotion_code_id(_FakeStripe(), "GUIAAFRIENDS")
        self.assertEqual(promo_id, "promo_fuzzy")

    def test_resolve_coupon_id_from_env(self):
        class _FakeCoupon:
            valid = True

        class _FakeStripe:
            class Coupon:
                @staticmethod
                def retrieve(coupon_id):
                    assert coupon_id == "coupon_test"
                    return _FakeCoupon()

        with patch.dict(os.environ, {"STRIPE_PREMIUM_COUPON_ID": "coupon_test"}):
            kwargs, kind, ref, error = resolve_premium_promotion_discount(_FakeStripe())
        self.assertEqual(kind, "coupon")
        self.assertEqual(ref, "coupon_test")
        self.assertIsNone(error)
        self.assertEqual(kwargs, {"discounts": [{"coupon": "coupon_test"}]})

    def test_basic_membership_no_promotion_codes(self):
        self.assertEqual(membership_promotion_checkout_kwargs("basic"), {})
        self.assertEqual(membership_promotion_checkout_kwargs("professional"), {})


if __name__ == "__main__":
    unittest.main(verbosity=2)
