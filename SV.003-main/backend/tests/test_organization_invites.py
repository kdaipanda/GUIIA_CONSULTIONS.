"""QA: invitaciones a equipo (token + roles staff/vet)."""
from __future__ import annotations

import os
import sys
import unittest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from clinic_db import (  # noqa: E402
    STAFF_INVITE_ROLES,
    _hash_invite_token,
    new_invite_token,
)


class InviteTokenHelpers(unittest.TestCase):
    def test_token_hash_is_stable(self):
        raw, hashed = new_invite_token()
        self.assertGreaterEqual(len(raw), 32)
        self.assertEqual(hashed, _hash_invite_token(raw))
        self.assertNotEqual(raw, hashed)

    def test_staff_roles_skip_license(self):
        self.assertIn("receptionist", STAFF_INVITE_ROLES)
        self.assertIn("admin", STAFF_INVITE_ROLES)
        self.assertNotIn("veterinarian", STAFF_INVITE_ROLES)


if __name__ == "__main__":
    unittest.main()
