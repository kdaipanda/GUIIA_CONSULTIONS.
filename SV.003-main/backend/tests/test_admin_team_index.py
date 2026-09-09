"""Tests for admin team index (cuentas compartidas)."""
from __future__ import annotations

import unittest
from unittest import mock

import clinic_db


class AdminTeamIndex(unittest.TestCase):
    def test_marks_shared_team_and_owner_quota(self):
        members = [
            {
                "profile_id": "owner-1",
                "role": "owner",
                "organization_id": "org-1",
                "organizations": {"id": "org-1", "name": "Consultorio Demo"},
            },
            {
                "profile_id": "vet-2",
                "role": "veterinarian",
                "organization_id": "org-1",
                "organizations": {"id": "org-1", "name": "Consultorio Demo"},
            },
        ]
        profiles = [
            {
                "id": "owner-1",
                "nombre": "Dueña",
                "email": "owner@test.com",
                "membership_type": "basic",
                "consultations_remaining": 30,
            },
            {"id": "vet-2", "nombre": "Vet", "email": "vet@test.com", "membership_type": None},
        ]

        with mock.patch.object(clinic_db, "_table") as table_mock:
            chain = table_mock.return_value.select.return_value
            chain.execute.return_value = mock.Mock(data=members)
            index = clinic_db.build_admin_team_index(profiles)

        self.assertTrue(index["owner-1"]["team_shared"])
        self.assertEqual(index["owner-1"]["team_member_count"], 2)
        self.assertEqual(index["owner-1"]["org_role"], "owner")
        self.assertIsNone(index["owner-1"].get("membership_source"))

        self.assertEqual(index["vet-2"]["membership_source"], "organization")
        self.assertEqual(index["vet-2"]["membership_owner_id"], "owner-1")
        self.assertEqual(index["vet-2"]["effective_membership_type"], "basic")
        self.assertEqual(index["vet-2"]["effective_consultations_remaining"], 30)

    def test_solo_owner_not_shared(self):
        members = [
            {
                "profile_id": "solo-1",
                "role": "owner",
                "organization_id": "org-solo",
                "organizations": {"id": "org-solo", "name": "Solo"},
            }
        ]
        with mock.patch.object(clinic_db, "_table") as table_mock:
            chain = table_mock.return_value.select.return_value
            chain.execute.return_value = mock.Mock(data=members)
            index = clinic_db.build_admin_team_index(
                [{"id": "solo-1", "nombre": "Solo", "email": "s@test.com"}]
            )
        self.assertFalse(index["solo-1"]["team_shared"])
        self.assertEqual(index["solo-1"]["team_member_count"], 1)


if __name__ == "__main__":
    unittest.main()
