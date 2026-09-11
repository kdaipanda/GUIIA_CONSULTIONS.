"""QA: alta de veterinarios al consultorio (alta nueva vs mover consultorio vacío)."""
from __future__ import annotations

import os
import sys
import unittest
from unittest import mock

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import clinic_db  # noqa: E402
from clinic_db import resolve_add_member_action  # noqa: E402


class ResolveAddMemberAction(unittest.TestCase):
    def test_inserts_when_user_has_no_org(self):
        self.assertEqual(resolve_add_member_action(None, "org-a"), "insert")

    def test_already_in_same_team(self):
        self.assertEqual(
            resolve_add_member_action({"organization_id": "org-a"}, "org-a"),
            "already_here",
        )

    def test_reassigns_solo_empty_org(self):
        self.assertEqual(
            resolve_add_member_action(
                {"organization_id": "org-b"},
                "org-a",
                source_member_count=1,
                source_has_clinical_data=False,
            ),
            "reassign",
        )

    def test_reassigns_solo_org_even_with_clinical_data(self):
        self.assertEqual(
            resolve_add_member_action(
                {"organization_id": "org-b"},
                "org-a",
                source_member_count=1,
                source_has_clinical_data=True,
            ),
            "reassign",
        )

    def test_blocks_org_with_other_members(self):
        self.assertEqual(
            resolve_add_member_action(
                {"organization_id": "org-b"},
                "org-a",
                source_member_count=2,
                source_has_clinical_data=False,
            ),
            "conflict_team",
        )

    def test_second_empty_colleague_still_reassigns(self):
        self.assertEqual(
            resolve_add_member_action(
                {"organization_id": "org-c"},
                "org-a",
                source_member_count=1,
                source_has_clinical_data=False,
            ),
            "reassign",
        )


class AddOrganizationMember(unittest.TestCase):
    def test_blocks_reassigning_existing_org_by_default(self):
        existing = {
            "id": "member-row-1",
            "organization_id": "org-b",
            "profile_id": "vet-1",
            "role": "owner",
        }
        with mock.patch.object(
            clinic_db,
            "get_member_by_profile",
            return_value=(existing, None),
        ), mock.patch.object(
            clinic_db,
            "list_members",
            return_value=([existing], None),
        ), mock.patch.object(
            clinic_db,
            "_reassign_member_to_organization",
        ) as reassign_mock:
            member, err = clinic_db.add_organization_member(
                "org-a",
                "vet-1",
                "veterinarian",
            )

        self.assertIsNone(member)
        self.assertIn("ya pertenece a otro consultorio", err)
        reassign_mock.assert_not_called()

    def test_allows_reassign_when_explicitly_requested(self):
        existing = {
            "id": "member-row-1",
            "organization_id": "org-b",
            "profile_id": "vet-1",
            "role": "owner",
        }
        moved = {**existing, "organization_id": "org-a", "role": "veterinarian"}
        with mock.patch.object(
            clinic_db,
            "get_member_by_profile",
            return_value=(existing, None),
        ), mock.patch.object(
            clinic_db,
            "list_members",
            return_value=([existing], None),
        ), mock.patch.object(
            clinic_db,
            "_reassign_member_to_organization",
            return_value=(moved, None),
        ) as reassign_mock, mock.patch.object(
            clinic_db,
            "_clear_personal_membership_for_team_member",
        ) as clear_mock:
            member, err = clinic_db.add_organization_member(
                "org-a",
                "vet-1",
                "veterinarian",
                allow_reassign=True,
            )

        self.assertIsNone(err)
        self.assertEqual(member, moved)
        reassign_mock.assert_called_once_with(existing, "org-a", "veterinarian")
        clear_mock.assert_called_once_with("vet-1")


if __name__ == "__main__":
    unittest.main()
