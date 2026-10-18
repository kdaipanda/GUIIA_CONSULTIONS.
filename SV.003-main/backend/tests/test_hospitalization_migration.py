"""Regression checks for hospitalization tenant-integrity constraints."""
from __future__ import annotations

from pathlib import Path
import unittest


MIGRATION = (
    Path(__file__).resolve().parents[1]
    / "supabase_migrations"
    / "20260922_patient_hospitalizations.sql"
)


class HospitalizationMigrationConstraints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sql = MIGRATION.read_text(encoding="utf-8").lower()

    def test_hospitalization_patient_fk_is_tenant_scoped(self):
        self.assertIn("patient_hospitalizations_org_patient_fk", self.sql)
        self.assertIn("foreign key (organization_id, patient_id)", self.sql)
        self.assertIn("references public.patients(organization_id, id)", self.sql)

    def test_hospitalization_notes_fk_is_tenant_scoped(self):
        self.assertIn("patient_hospitalization_notes_org_hosp_fk", self.sql)
        self.assertIn("foreign key (organization_id, hospitalization_id)", self.sql)
        self.assertIn(
            "references public.patient_hospitalizations(organization_id, id)",
            self.sql,
        )


if __name__ == "__main__":
    unittest.main()
