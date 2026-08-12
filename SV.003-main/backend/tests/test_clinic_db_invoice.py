"""Tests de consistencia al crear recibos clínicos."""

import clinic_db


class _FakeResponse:
    def __init__(self, data=None):
        self.data = data or []


class _FakeTable:
    def __init__(self, name, state):
        self.name = name
        self.state = state
        self.operation = None
        self.payload = None

    def insert(self, payload, returning=None):  # noqa: ARG002
        self.operation = "insert"
        self.payload = payload
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def eq(self, field, value):  # noqa: ARG002
        return self

    def execute(self):
        if self.operation == "insert":
            if self.name == "clinical_invoices":
                row = {**self.payload, "id": "invoice-1"}
                self.state["invoices"].append(row)
                return _FakeResponse([row])
            if self.name == "clinical_invoice_items":
                self.state["items"].extend(self.payload)
                return _FakeResponse(self.payload)
        if self.operation == "delete":
            self.state["deleted"].append(self.name)
            return _FakeResponse([{}])
        return _FakeResponse([])


def _patch_invoice_tables(monkeypatch):
    state = {"invoices": [], "items": [], "deleted": []}
    monkeypatch.setattr(clinic_db, "_table", lambda name: _FakeTable(name, state))
    monkeypatch.setattr(
        clinic_db,
        "get_product",
        lambda product_id, organization_id: (  # noqa: ARG005
            {"id": product_id, "name": product_id, "stock_qty": 10},
            None,
        ),
    )
    return state


def test_create_invoice_rolls_back_records_when_stock_deduction_fails(monkeypatch):
    state = _patch_invoice_tables(monkeypatch)

    def fail_stock(*args, **kwargs):  # noqa: ARG001
        return (None, "Stock insuficiente")

    monkeypatch.setattr(clinic_db, "insert_stock_movement", fail_stock)

    invoice, err = clinic_db.create_invoice_with_items(
        "org-1",
        {"invoice_number": "INV-TEST-1", "status": "issued"},
        [{"product_id": "prod-1", "description": "Vacuna", "quantity": 1, "unit_price": 100}],
        deduct_stock=True,
        created_by="vet-1",
    )

    assert invoice is None
    assert "No se pudo descontar stock" in err
    assert state["invoices"]
    assert state["items"]
    assert "clinical_invoice_items" in state["deleted"]
    assert "clinical_invoices" in state["deleted"]


def test_create_invoice_reverses_previous_stock_deductions_on_later_failure(monkeypatch):
    state = _patch_invoice_tables(monkeypatch)
    calls = []

    def stock_movement(organization_id, product_id, movement_type, quantity, reason, created_by):
        calls.append((organization_id, product_id, movement_type, quantity, reason, created_by))
        if product_id == "prod-2" and movement_type == "out":
            return (None, "Stock insuficiente")
        return ({"id": f"mov-{len(calls)}"}, None)

    monkeypatch.setattr(clinic_db, "insert_stock_movement", stock_movement)

    invoice, err = clinic_db.create_invoice_with_items(
        "org-1",
        {"invoice_number": "INV-TEST-2", "status": "issued"},
        [
            {"product_id": "prod-1", "description": "Vacuna", "quantity": 2, "unit_price": 100},
            {"product_id": "prod-2", "description": "Alimento", "quantity": 1, "unit_price": 50},
        ],
        deduct_stock=True,
        created_by="vet-1",
    )

    assert invoice is None
    assert "No se pudo descontar stock" in err
    assert calls == [
        ("org-1", "prod-1", "out", 2.0, "Venta recibo INV-TEST-2", "vet-1"),
        ("org-1", "prod-2", "out", 1.0, "Venta recibo INV-TEST-2", "vet-1"),
        ("org-1", "prod-1", "in", 2.0, "Reverso recibo INV-TEST-2", "vet-1"),
    ]
    assert "clinical_invoice_items" in state["deleted"]
    assert "clinical_invoices" in state["deleted"]
