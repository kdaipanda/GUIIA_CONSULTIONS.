"""QA: invitaciones a equipo (token + roles staff/vet + OTP pending)."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from clinic_db import (  # noqa: E402
    INVITE_TTL_DAYS,
    STAFF_INVITE_ROLES,
    _hash_invite_token,
    hash_invite_email_code,
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

    def test_invite_ttl_is_seven_days(self):
        self.assertEqual(INVITE_TTL_DAYS, 7)

    def test_email_code_hash_is_stable(self):
        self.assertEqual(hash_invite_email_code("123456"), hash_invite_email_code("123456"))
        self.assertNotEqual(hash_invite_email_code("123456"), hash_invite_email_code("654321"))
        self.assertEqual(hash_invite_email_code(" 123456 "), hash_invite_email_code("123456"))


class InviteRegisterPendingToken(unittest.TestCase):
    def test_create_and_verify_roundtrip(self):
        os.environ.setdefault("JWT_SECRET", "test-invite-register-secret-32chars!!")
        import auth_security

        salt, code_hash = auth_security.create_invite_register_code_challenge("424242")
        token = auth_security.create_invite_register_pending_token(
            invite_id="inv-1",
            invite_token_hash="abc",
            email="member@example.com",
            code_hash=code_hash,
            profile_payload={
                "nombre": "Ana",
                "email": "member@example.com",
                "_invite_code_salt": salt,
            },
        )
        payload = auth_security.verify_invite_register_pending_token(token)
        self.assertEqual(payload.get("type"), "invite_register")
        self.assertEqual(payload.get("sub"), "inv-1")
        self.assertEqual(payload.get("email"), "member@example.com")
        self.assertEqual(payload.get("code_hash"), code_hash)
        self.assertNotEqual(payload.get("code_hash"), hash_invite_email_code("424242"))
        self.assertEqual(payload.get("profile", {}).get("nombre"), "Ana")
        self.assertTrue(
            auth_security.verify_invite_register_code(
                "424242",
                payload.get("profile", {}).get("_invite_code_salt"),
                payload.get("code_hash"),
            )
        )
        self.assertFalse(
            auth_security.verify_invite_register_code(
                "111111",
                payload.get("profile", {}).get("_invite_code_salt"),
                payload.get("code_hash"),
            )
        )

    def test_wrong_type_rejected(self):
        os.environ.setdefault("JWT_SECRET", "test-invite-register-secret-32chars!!")
        import auth_security
        from jose import jwt

        bad = jwt.encode(
            {
                "sub": "x",
                "type": "access",
                "exp": 9999999999,
            },
            auth_security._jwt_secret(),
            algorithm=auth_security.ALGORITHM,
        )
        with self.assertRaises(Exception):
            auth_security.verify_invite_register_pending_token(bad)


class InviteRegistrationStartUnit(unittest.TestCase):
    def test_start_returns_pending_without_creating_profile(self):
        os.environ.setdefault("JWT_SECRET", "test-invite-register-secret-32chars!!")
        import asyncio
        from types import SimpleNamespace

        import invite_registration as mod

        body = SimpleNamespace(
            token="raw-invite-token",
            nombre="Ana Tester",
            telefono="5512345678",
            password="SecurePass1!",
            profesional_pais="MX",
            cedula_profesional=None,
            especialidad=None,
            años_experiencia=None,
            institucion=None,
        )
        invite = {
            "id": "invite-uuid",
            "email": "ana@example.com",
            "role": "receptionist",
            "organization_id": "org-1",
            "organization_name": "Clínica Demo",
            "_raw": {"token_hash": "thash", "invited_by": "owner-1"},
        }

        with patch.object(mod.clinic_db, "get_invite_by_raw_token", return_value=(invite, None)), patch.object(
            mod.email_notifications, "notify_invite_email_code", return_value=None
        ) as notify_mock:
            result = asyncio.get_event_loop().run_until_complete(
                mod.start_invite_registration(
                    body=body,
                    get_profile_by_email=lambda _e: (None, None),
                    is_dev_user=lambda _e: False,
                    normalize_professional_id=lambda s: s,
                    professional_id_key=lambda s: s,
                    get_profile_by_cedula=lambda _c: (None, None),
                    generate_2fa_code=lambda: "111222",
                )
            )

        self.assertEqual(result["status"], "pending_email_verification")
        self.assertTrue(result["nonce"])
        self.assertEqual(result["email"], "ana@example.com")
        notify_mock.assert_called_once()
        self.assertEqual(notify_mock.call_args.kwargs["code"], "111222")

        import auth_security

        pending = auth_security.verify_invite_register_pending_token(result["nonce"])
        self.assertNotEqual(
            pending.get("code_hash"),
            hash_invite_email_code("111222"),
        )
        self.assertTrue(
            auth_security.verify_invite_register_code(
                "111222",
                pending.get("profile", {}).get("_invite_code_salt"),
                pending.get("code_hash"),
            )
        )


if __name__ == "__main__":
    unittest.main()
