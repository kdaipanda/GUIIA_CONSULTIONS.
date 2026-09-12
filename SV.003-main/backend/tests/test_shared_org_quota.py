"""QA: cupo CDS compartido del consultorio (owner)."""
from __future__ import annotations

import os
import sys
import unittest
from unittest import mock

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)


class SharedOrgQuota(unittest.TestCase):
    def test_member_bills_to_owner(self):
        import clinic_db

        member_profile = {"id": "member-1", "membership_type": None, "consultations_remaining": 0}
        with mock.patch.object(
            clinic_db,
            "get_member_by_profile",
            return_value=({"role": "veterinarian", "organization_id": "org-1"}, None),
        ), mock.patch.object(
            clinic_db,
            "get_organization_owner_profile_id",
            return_value=("owner-1", None),
        ):
            bill_to = clinic_db.resolve_consultation_billing_profile_id(member_profile)
        self.assertEqual(bill_to, "owner-1")

    def test_owner_bills_to_self(self):
        import clinic_db

        owner_profile = {"id": "owner-1", "membership_type": "basic", "consultations_remaining": 30}
        with mock.patch.object(
            clinic_db,
            "get_member_by_profile",
            return_value=({"role": "owner", "organization_id": "org-1"}, None),
        ):
            bill_to = clinic_db.resolve_consultation_billing_profile_id(owner_profile)
        self.assertEqual(bill_to, "owner-1")

    def test_overlay_shows_owner_remaining(self):
        import clinic_db

        member_profile = {"id": "member-1", "membership_type": None, "consultations_remaining": 0}
        owner = {
            "id": "owner-1",
            "nombre": "Dueña",
            "membership_type": "basic",
            "consultations_remaining": 27,
            "membership_expires": "2026-10-01T00:00:00+00:00",
            "unlimited_consultations": False,
        }
        with mock.patch.object(
            clinic_db,
            "get_member_by_profile",
            return_value=({"role": "veterinarian", "organization_id": "org-1"}, None),
        ), mock.patch.object(
            clinic_db,
            "get_organization_owner_profile_id",
            return_value=("owner-1", None),
        ), mock.patch(
            "supabase_client.get_profile",
            return_value=(owner, None),
        ):
            overlay = clinic_db.apply_team_membership_overlay(member_profile)
        self.assertEqual(overlay["membership_type"], "basic")
        self.assertEqual(overlay["consultations_remaining"], 27)
        self.assertEqual(overlay["membership_source"], "organization")
        self.assertEqual(overlay["membership_owner_id"], "owner-1")
        self.assertEqual(overlay["org_role"], "veterinarian")

    def test_admin_without_license_cannot_create_cds(self):
        import clinic_db

        reason = clinic_db.consultation_role_block_reason(
            {"id": "admin-1", "cedula_profesional": "  "},
            {"role": "admin", "organization_id": "org-1"},
        )
        self.assertEqual(reason, clinic_db.CDS_ADMIN_LICENSE_BLOCK_MESSAGE)

    def test_admin_with_license_can_create_cds(self):
        import clinic_db

        reason = clinic_db.consultation_role_block_reason(
            {"id": "admin-1", "cedula_profesional": "1234567"},
            {"role": "admin", "organization_id": "org-1"},
        )
        self.assertIsNone(reason)

    def test_receptionist_cannot_create_cds(self):
        import clinic_db

        reason = clinic_db.consultation_role_block_reason(
            {"id": "recep-1", "cedula_profesional": "1234567"},
            {"role": "receptionist", "organization_id": "org-1"},
        )
        self.assertEqual(reason, clinic_db.CDS_RECEPTION_BLOCK_MESSAGE)


if __name__ == "__main__":
    unittest.main()
