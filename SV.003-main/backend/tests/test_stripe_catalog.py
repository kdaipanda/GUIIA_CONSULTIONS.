"""Tests: catálogo Stripe y line items para cupones."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from stripe_catalog import (  # noqa: E402
    build_membership_line_item,
    resolve_stripe_price_id,
    stripe_product_id,
)


class _FakePrice:
    def __init__(self, price_id: str, currency: str, unit_amount: int):
        self.id = price_id
        self.currency = currency
        self.unit_amount = unit_amount


class _FakePriceList:
    def __init__(self, data):
        self.data = data


class _FakeStripe:
    class Price:
        @staticmethod
        def list(**_kwargs):
            return _FakePriceList(
                [_FakePrice("price_premium_monthly", "mxn", 220000)]
            )


class StripeCatalogTests(unittest.TestCase):
    def test_premium_product_mapping(self):
        self.assertEqual(stripe_product_id("premium", "monthly"), "prod_Tl0SrURr1CLGkd")
        self.assertEqual(stripe_product_id("premium", "annual"), "prod_Tl0cuUrxfLTPmj")

    def test_resolve_price_from_stripe_catalog(self):
        price_id = resolve_stripe_price_id(
            _FakeStripe(), "premium", "monthly", "mxn", 220000
        )
        self.assertEqual(price_id, "price_premium_monthly")

    def test_build_membership_line_item_uses_price_id(self):
        item = build_membership_line_item(
            "premium",
            "monthly",
            package_name="Premium",
            currency="mxn",
            unit_amount_cents=220000,
            stripe_api=_FakeStripe(),
        )
        self.assertEqual(item, {"price": "price_premium_monthly", "quantity": 1})

    def test_build_membership_line_item_uses_product_when_no_price(self):
        item = build_membership_line_item(
            "premium",
            "monthly",
            package_name="Premium",
            currency="mxn",
            unit_amount_cents=220000,
            stripe_api=None,
        )
        self.assertEqual(item["price_data"]["product"], "prod_Tl0SrURr1CLGkd")
        self.assertEqual(item["price_data"]["unit_amount"], 220000)

    def test_env_price_override(self):
        with patch.dict(os.environ, {"STRIPE_PRICE_PREMIUM_MONTHLY": "price_env_override"}):
            item = build_membership_line_item(
                "premium",
                "monthly",
                package_name="Premium",
                currency="mxn",
                unit_amount_cents=220000,
                stripe_api=_FakeStripe(),
            )
        self.assertEqual(item, {"price": "price_env_override", "quantity": 1})


if __name__ == "__main__":
    unittest.main(verbosity=2)
