"""QA: consumo de sesiones B2C al crear consultas de dueños."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import Mock, patch

from fastapi import HTTPException

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import owner_db  # noqa: E402
from owner_routes import OwnerConsultationCreate, create_owner_consultation  # noqa: E402


class OwnerConsultationRouteTests(unittest.IsolatedAsyncioTestCase):
    def _body(self) -> OwnerConsultationCreate:
        return OwnerConsultationCreate(
            pet_name="Mila",
            category="perros",
            accept_disclaimer=True,
            form_data={
                "nombre_mascota": "Mila",
                "motivo_consulta": "Tos desde ayer",
            },
        )

    async def test_create_consultation_reserves_session_before_insert(self):
        profile = {
            "id": "owner-1",
            "email": "owner@example.com",
            "nombre": "Owner",
            "account_kind": "pet_owner",
            "owner_sessions_remaining": 1,
        }
        inserted = {
            "id": "consult-1",
            "owner_id": "owner-1",
            "payload": {},
            "status": "draft",
        }

        with patch("owner_routes.auth_security.resolve_authenticated_vet_id", return_value="owner-1"), patch(
            "owner_routes.get_profile", return_value=(profile, None)
        ), patch("owner_routes.account_access.has_unlimited_owner_access", return_value=False), patch(
            "owner_routes.owner_db.reserve_owner_session", return_value=(0, None)
        ) as reserve, patch(
            "owner_routes.owner_db.insert_owner_consultation", return_value=(inserted, None)
        ) as insert:
            result = await create_owner_consultation(self._body(), x_veterinarian_id="owner-1")

        reserve.assert_called_once_with("owner-1", 1)
        insert.assert_called_once()
        self.assertEqual(result["owner_sessions_remaining"], 0)

    async def test_create_consultation_does_not_insert_when_session_was_spent(self):
        profile = {
            "id": "owner-1",
            "email": "owner@example.com",
            "account_kind": "pet_owner",
            "owner_sessions_remaining": 1,
        }
        insert = Mock()

        with patch("owner_routes.auth_security.resolve_authenticated_vet_id", return_value="owner-1"), patch(
            "owner_routes.get_profile", return_value=(profile, None)
        ), patch("owner_routes.account_access.has_unlimited_owner_access", return_value=False), patch(
            "owner_routes.owner_db.reserve_owner_session",
            return_value=(None, owner_db.OWNER_SESSION_RESERVATION_CONFLICT),
        ), patch("owner_routes.owner_db.insert_owner_consultation", insert):
            with self.assertRaises(HTTPException) as ctx:
                await create_owner_consultation(self._body(), x_veterinarian_id="owner-1")

        self.assertEqual(ctx.exception.status_code, 409)
        insert.assert_not_called()


if __name__ == "__main__":
    unittest.main()
