"""QA: aislamiento de historial clínico por organización."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import clinic_db  # noqa: E402


class _FakeResponse:
    data = []


class _FakeQuery:
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.filters = []

    def select(self, *args, **kwargs):
        return self

    def eq(self, column, value):
        self.filters.append(("eq", column, value))
        return self

    def in_(self, column, values):
        self.filters.append(("in", column, values))
        return self

    def order(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def execute(self):
        return _FakeResponse()


class ClinicDbScopingTest(unittest.TestCase):
    def test_patient_consultations_are_scoped_to_organization(self):
        queries = []

        def table(name):
            query = _FakeQuery(name)
            queries.append(query)
            return query

        with patch.object(clinic_db, "_table", side_effect=table):
            rows, err = clinic_db.list_consultations_for_patient("patient-1", "org-1")

        self.assertIsNone(err)
        self.assertEqual(rows, [])
        self.assertEqual(queries[0].table_name, "consultations")
        self.assertIn(("eq", "patient_id", "patient-1"), queries[0].filters)
        self.assertIn(("eq", "organization_id", "org-1"), queries[0].filters)

    def test_patient_medical_images_are_scoped_to_org_members(self):
        queries = []

        def table(name):
            query = _FakeQuery(name)
            queries.append(query)
            return query

        with (
            patch.object(clinic_db, "_table", side_effect=table),
            patch.object(
                clinic_db,
                "list_members",
                return_value=([{"profile_id": "vet-1"}, {"profile_id": "vet-2"}], None),
            ),
        ):
            rows, err = clinic_db.list_medical_images_for_patient("patient-1", "org-1")

        self.assertIsNone(err)
        self.assertEqual(rows, [])
        self.assertEqual(queries[0].table_name, "medical_images")
        self.assertIn(("eq", "patient_id", "patient-1"), queries[0].filters)
        self.assertIn(("in", "user_id", ["vet-1", "vet-2"]), queries[0].filters)


if __name__ == "__main__":
    unittest.main(verbosity=2)
