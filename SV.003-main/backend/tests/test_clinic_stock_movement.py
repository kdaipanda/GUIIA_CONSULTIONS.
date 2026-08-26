"""Tests for clinic inventory stock movement consistency."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import clinic_db  # noqa: E402


class _FakeResponse:
    def __init__(self, data=None):
        self.data = data or []


class _FakeStockMovementsTable:
    def __init__(self):
        self.inserted_rows = []
        self.deleted = False
        self.delete_filters = []
        self.mode = None

    def insert(self, row, returning=None):
        self.mode = "insert"
        self.inserted_rows.append((row, returning))
        return self

    def delete(self):
        self.mode = "delete"
        self.deleted = True
        return self

    def eq(self, field, value):
        self.delete_filters.append((field, value))
        return self

    def execute(self):
        if self.mode == "insert":
            return _FakeResponse(
                [
                    {
                        "id": "movement-1",
                        **self.inserted_rows[-1][0],
                    }
                ]
            )
        return _FakeResponse([])


class StockMovementConsistencyTests(unittest.TestCase):
    def test_rolls_back_inserted_movement_when_stock_update_fails(self):
        table = _FakeStockMovementsTable()

        with (
            patch.object(
                clinic_db,
                "get_product",
                return_value=({"id": "prod-1", "stock_qty": 5}, None),
            ),
            patch.object(clinic_db, "update_product", return_value=(None, "db down")),
            patch.object(clinic_db, "_table", return_value=table),
        ):
            movement, err = clinic_db.insert_stock_movement(
                "org-1",
                "prod-1",
                "out",
                2,
                "manual",
                "vet-1",
            )

        self.assertIsNone(movement)
        self.assertEqual(err, "db down")
        self.assertTrue(table.deleted)
        self.assertEqual(
            table.delete_filters,
            [
                ("id", "movement-1"),
                ("organization_id", "org-1"),
                ("product_id", "prod-1"),
            ],
        )

    def test_keeps_movement_when_stock_update_succeeds(self):
        table = _FakeStockMovementsTable()

        with (
            patch.object(
                clinic_db,
                "get_product",
                return_value=({"id": "prod-1", "stock_qty": 5}, None),
            ),
            patch.object(clinic_db, "update_product", return_value=({"id": "prod-1"}, None)),
            patch.object(clinic_db, "_table", return_value=table),
        ):
            movement, err = clinic_db.insert_stock_movement(
                "org-1",
                "prod-1",
                "in",
                2,
                "manual",
                "vet-1",
            )

        self.assertIsNone(err)
        self.assertEqual(movement["id"], "movement-1")
        self.assertFalse(table.deleted)


if __name__ == "__main__":
    unittest.main(verbosity=2)
