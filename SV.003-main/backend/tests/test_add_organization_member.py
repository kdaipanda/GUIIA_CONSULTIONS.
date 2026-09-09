"""QA: alta de veterinarios al consultorio (alta nueva vs mover consultorio vacío)."""
from __future__ import annotations

import os
import sys
import unittest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

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


if __name__ == "__main__":
    unittest.main()
