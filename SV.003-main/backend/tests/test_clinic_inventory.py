"""QA: integridad de stock al crear recibos clínicos."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import clinic_db  # noqa: E402


class ClinicInvoiceStockTests(unittest.TestCase):
    def test_duplicate_product_lines_validate_combined_stock_before_insert(self):
        def fake_get_product(product_id: str, organization_id: str):
            self.assertEqual(product_id, "prod-1")
            self.assertEqual(organization_id, "org-1")
            return ({"id": "prod-1", "name": "Antibiotico", "stock_qty": 5}, None)

        with (
            patch.object(clinic_db, "get_product", side_effect=fake_get_product),
            patch.object(clinic_db, "_table") as table_mock,
        ):
            invoice, err = clinic_db.create_invoice_with_items(
                "org-1",
                {"client_id": "client-1", "status": "issued"},
                [
                    {
                        "product_id": "prod-1",
                        "description": "Antibiotico",
                        "quantity": 3,
                        "unit_price": 10,
                    },
                    {
                        "product_id": "prod-1",
                        "description": "Antibiotico",
                        "quantity": 3,
                        "unit_price": 10,
                    },
                ],
                created_by="vet-1",
            )

        self.assertIsNone(invoice)
        self.assertIn("Stock insuficiente", err)
        self.assertIn("solicitado: 6.0", err)
        table_mock.assert_not_called()

    def test_product_stock_deduction_rejects_non_positive_quantities(self):
        with patch.object(clinic_db, "_table") as table_mock:
            invoice, err = clinic_db.create_invoice_with_items(
                "org-1",
                {"client_id": "client-1", "status": "issued"},
                [
                    {
                        "product_id": "prod-1",
                        "description": "Antibiotico",
                        "quantity": -1,
                        "unit_price": 10,
                    }
                ],
                created_by="vet-1",
            )

        self.assertIsNone(invoice)
        self.assertIn("Cantidad inválida", err)
        table_mock.assert_not_called()


if __name__ == "__main__":
    unittest.main(verbosity=2)
