"""QA: cupo CDS compartido del consultorio (owner)."""
from __future__ import annotations

import os
import sys
import unittest
from datetime import datetime, timedelta, timezone
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

    def test_member_overlay_clears_personal_premium_feature_grant(self):
        import clinic_db
        from membership_access import has_active_premium_features_grant

        until = (datetime.now(timezone.utc) + timedelta(days=15)).isoformat()
        member_profile = {
            "id": "member-1",
            "membership_type": "basic",
            "consultations_remaining": 30,
            "premium_features_until": until,
        }
        owner = {
            "id": "owner-1",
            "nombre": "Dueña",
            "membership_type": "basic",
            "consultations_remaining": 30,
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

        self.assertEqual(overlay["membership_source"], "organization")
        self.assertIsNone(overlay["premium_features_until"])
        self.assertFalse(overlay["premium_features_active"])
        self.assertFalse(has_active_premium_features_grant(overlay))

    def test_clinic_feature_gate_uses_team_overlay_not_member_grant(self):
        import clinic_routes
        from fastapi import HTTPException

        until = (datetime.now(timezone.utc) + timedelta(days=15)).isoformat()
        ctx = {
            "profile": {
                "id": "member-1",
                "membership_type": "basic",
                "consultations_remaining": 30,
                "premium_features_until": until,
            },
            "role": "veterinarian",
        }
        overlay = {
            **ctx["profile"],
            "membership_source": "organization",
            "premium_features_until": None,
            "premium_features_active": False,
        }
        with mock.patch.object(
            clinic_routes.clinic_db,
            "apply_team_membership_overlay",
            return_value=overlay,
        ):
            with self.assertRaises(HTTPException) as raised:
                clinic_routes._require_membership_feature(ctx, "medical_images")
        self.assertEqual(raised.exception.status_code, 403)

    def test_medical_images_feature_profile_strips_member_personal_grant(self):
        import server_simple
        from membership_access import has_active_premium_features_grant

        until = (datetime.now(timezone.utc) + timedelta(days=15)).isoformat()
        raw_profile = {
            "id": "member-1",
            "membership_type": "basic",
            "consultations_remaining": 30,
            "premium_features_until": until,
        }
        with mock.patch.object(
            server_simple,
            "_with_team_membership",
            return_value={**raw_profile},
        ), mock.patch(
            "clinic_db.get_member_by_profile",
            return_value=({"role": "veterinarian", "organization_id": "org-1"}, None),
        ):
            effective = server_simple._feature_access_profile(raw_profile)

        self.assertEqual(effective["membership_source"], "organization")
        self.assertIsNone(effective["premium_features_until"])
        self.assertFalse(effective["premium_features_active"])
        self.assertFalse(has_active_premium_features_grant(effective))


if __name__ == "__main__":
    unittest.main()
