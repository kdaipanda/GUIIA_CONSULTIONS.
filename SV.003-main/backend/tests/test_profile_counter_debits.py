"""QA: descuentos atómicos de contadores pagados en profiles."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import supabase_client  # noqa: E402


class _Resp:
    def __init__(self, data):
        self.data = data


class _ProfilesQuery:
    def __init__(self, data):
        self.data = data
        self.updated_fields = None
        self.filters = []

    def update(self, fields, returning=None):
        self.updated_fields = fields
        self.returning = returning
        return self

    def eq(self, field, value):
        self.filters.append((field, value))
        return self

    def execute(self):
        return _Resp(self.data)


class _Client:
    def __init__(self, query, table_name="profiles"):
        self.query = query
        self.table_name = table_name

    def table(self, name):
        assert name == self.table_name
        return self.query


class ProfileCounterDebitTests(unittest.TestCase):
    def test_decrement_profile_counter_uses_expected_balance_filter(self):
        query = _ProfilesQuery([{"consultations_remaining": 1}])

        with patch("supabase_client.get_supabase_client", return_value=_Client(query)):
            remaining, err = supabase_client.debit_consultation_credit("vet-1", 2)

        self.assertIsNone(err)
        self.assertEqual(remaining, 1)
        self.assertEqual(query.updated_fields, {"consultations_remaining": 1})
        self.assertIn(("id", "vet-1"), query.filters)
        self.assertIn(("consultations_remaining", 2), query.filters)

    def test_decrement_profile_counter_reports_stale_balance_without_error(self):
        query = _ProfilesQuery([])

        with patch("supabase_client.get_supabase_client", return_value=_Client(query)):
            remaining, err = supabase_client.debit_owner_session("owner-1", 1)

        self.assertIsNone(err)
        self.assertIsNone(remaining)
        self.assertEqual(query.updated_fields, {"owner_sessions_remaining": 0})
        self.assertIn(("owner_sessions_remaining", 1), query.filters)

    def test_restore_profile_counter_is_compare_and_set(self):
        query = _ProfilesQuery([{"owner_sessions_remaining": 2}])

        with patch("supabase_client.get_supabase_client", return_value=_Client(query)):
            restored, err = supabase_client.restore_owner_session("owner-1", 1)

        self.assertIsNone(err)
        self.assertTrue(restored)
        self.assertEqual(query.updated_fields, {"owner_sessions_remaining": 2})
        self.assertIn(("owner_sessions_remaining", 1), query.filters)

    def test_claim_consultation_for_analysis_filters_current_status(self):
        query = _ProfilesQuery([{"id": "consult-1", "status": "analyzing"}])

        with patch(
            "supabase_client.get_supabase_client",
            return_value=_Client(query, table_name="consultations"),
        ):
            claimed, err = supabase_client.claim_consultation_for_analysis(
                "consult-1",
                "draft",
            )

        self.assertIsNone(err)
        self.assertTrue(claimed)
        self.assertEqual(query.updated_fields["status"], "analyzing")
        self.assertIn(("id", "consult-1"), query.filters)
        self.assertIn(("status", "draft"), query.filters)


if __name__ == "__main__":
    unittest.main()
