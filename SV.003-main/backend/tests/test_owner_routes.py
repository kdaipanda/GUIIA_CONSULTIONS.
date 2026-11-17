"""QA: flujo B2C de dueños cobra la sesión solo al entregar análisis."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import owner_routes  # noqa: E402
from fastapi import HTTPException  # noqa: E402


class OwnerConsultationBillingTests(unittest.IsolatedAsyncioTestCase):
    async def test_create_owner_consultation_does_not_debit_session(self):
        profile = {
            "id": "owner-1",
            "nombre": "Ana",
            "account_kind": "pet_owner",
            "owner_sessions_remaining": 1,
        }
        inserted = {
            "id": "consult-1",
            "owner_id": "owner-1",
            "payload": {},
            "status": "draft",
        }

        async def fake_require_profile(_owner_id):
            return profile

        def fake_insert(row):
            inserted["payload"] = row["payload"]
            return inserted, None

        body = owner_routes.OwnerConsultationCreate(
            pet_name="Luna",
            species="perros",
            symptoms="vomito",
            accept_disclaimer=True,
        )

        with patch("owner_routes._require_owner_id", return_value="owner-1"), patch(
            "owner_routes._require_owner_profile", fake_require_profile
        ), patch("owner_routes.owner_db.insert_owner_consultation", fake_insert), patch(
            "owner_routes.update_profile"
        ) as update_profile:
            result = await owner_routes.create_owner_consultation(body)

        update_profile.assert_not_called()
        self.assertEqual(result["owner_sessions_remaining"], 1)
        self.assertEqual(inserted["payload"]["credit"]["policy"], "on_analysis")
        self.assertIsNone(inserted["payload"]["credit"]["charged_at"])

    async def test_analyze_owner_consultation_debits_after_llm_success(self):
        profile = {
            "id": "owner-1",
            "nombre": "Ana",
            "account_kind": "pet_owner",
            "owner_sessions_remaining": 1,
        }
        row = {
            "id": "consult-1",
            "owner_id": "owner-1",
            "payload": {
                "category": "perros",
                "form_data": {
                    "nombre_mascota": "Luna",
                    "motivo_consulta": "vomito",
                    "especie": "perros",
                },
                "detalle_paciente": "vomito",
                "credit": {"policy": "on_analysis", "charged_at": None},
            },
            "status": "draft",
        }
        updates = {}

        async def fake_require_profile(_owner_id):
            return profile

        async def fake_llm(_message):
            return "analisis generado"

        def fake_get_owner_consultation(_consultation_id):
            if updates.get("consultation"):
                completed = dict(row)
                completed.update(updates["consultation"])
                return completed, None
            return row, None

        def fake_update_owner_consultation(_consultation_id, fields):
            updates["consultation"] = fields
            return None

        def fake_update_profile(profile_id, fields):
            updates["profile"] = (profile_id, fields)
            profile.update(fields)
            return None

        with patch("owner_routes._require_owner_id", return_value="owner-1"), patch(
            "owner_routes._require_owner_profile", fake_require_profile
        ), patch("owner_routes.get_profile", return_value=(profile, None)), patch(
            "owner_routes.update_profile", fake_update_profile
        ), patch(
            "owner_routes.owner_db.get_owner_consultation",
            fake_get_owner_consultation,
        ), patch(
            "owner_routes.owner_db.update_owner_consultation",
            fake_update_owner_consultation,
        ), patch(
            "owner_llm.send_owner_llm_message",
            fake_llm,
        ):
            result = await owner_routes.analyze_owner_consultation("consult-1")

        self.assertEqual(updates["profile"], ("owner-1", {"owner_sessions_remaining": 0}))
        saved = updates["consultation"]
        self.assertEqual(saved["analysis"], "analisis generado")
        self.assertEqual(saved["status"], "completed")
        self.assertIsNotNone(saved["payload"]["credit"]["charged_at"])
        self.assertEqual(result["analysis"], "analisis generado")

    async def test_analyze_owner_consultation_does_not_debit_when_llm_fails(self):
        profile = {
            "id": "owner-1",
            "nombre": "Ana",
            "account_kind": "pet_owner",
            "owner_sessions_remaining": 1,
        }
        row = {
            "id": "consult-1",
            "owner_id": "owner-1",
            "payload": {
                "category": "perros",
                "form_data": {
                    "nombre_mascota": "Luna",
                    "motivo_consulta": "vomito",
                    "especie": "perros",
                },
                "detalle_paciente": "vomito",
                "credit": {"policy": "on_analysis", "charged_at": None},
            },
            "status": "draft",
        }

        async def fake_require_profile(_owner_id):
            return profile

        async def fake_llm(_message):
            raise RuntimeError("Anthropic no disponible")

        with patch("owner_routes._require_owner_id", return_value="owner-1"), patch(
            "owner_routes._require_owner_profile", fake_require_profile
        ), patch("owner_routes.get_profile", return_value=(profile, None)), patch(
            "owner_routes.update_profile"
        ) as update_profile, patch(
            "owner_routes.owner_db.get_owner_consultation",
            return_value=(row, None),
        ), patch(
            "owner_routes.owner_db.update_owner_consultation"
        ) as update_consultation, patch(
            "owner_llm.send_owner_llm_message",
            fake_llm,
        ):
            with self.assertRaises(HTTPException) as ctx:
                await owner_routes.analyze_owner_consultation("consult-1")

        self.assertEqual(ctx.exception.status_code, 502)
        update_profile.assert_not_called()
        update_consultation.assert_not_called()


if __name__ == "__main__":
    unittest.main(verbosity=2)
