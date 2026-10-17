"""Regression tests for Owner B2C clinical data RLS hardening."""
from __future__ import annotations

import unittest
from pathlib import Path


MIGRATIONS_DIR = Path(__file__).resolve().parents[1] / "supabase_migrations"
RLS_MIGRATION = MIGRATIONS_DIR / "20261017_owner_consultations_rls.sql"


class OwnerConsultationsRlsMigrationTest(unittest.TestCase):
    def test_owner_consultations_rls_migration_enables_rls_and_owner_policies(self):
        sql = RLS_MIGRATION.read_text(encoding="utf-8").lower()

        self.assertIn("alter table public.owner_consultations enable row level security", sql)
        self.assertIn("revoke all on table public.owner_consultations from anon", sql)
        self.assertIn("for select", sql)
        self.assertIn("for insert", sql)
        self.assertIn("for update", sql)
        self.assertIn("for delete", sql)
        self.assertIn("owner_id = auth.uid()", sql)

    def test_owner_consultations_creation_has_follow_up_rls_migration(self):
        creation_sql = (
            MIGRATIONS_DIR / "20260922_owner_b2c_consultations.sql"
        ).read_text(encoding="utf-8").lower()
        hardening_sql = RLS_MIGRATION.read_text(encoding="utf-8").lower()

        self.assertIn("create table if not exists public.owner_consultations", creation_sql)
        self.assertIn("public.owner_consultations enable row level security", hardening_sql)


if __name__ == "__main__":
    unittest.main()
