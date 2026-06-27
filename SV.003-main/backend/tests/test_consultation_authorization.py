from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import auth_security  # noqa: E402
import server_simple  # noqa: E402


def _auth_headers(vet_id: str) -> dict:
    token = auth_security.create_access_token(vet_id, f"{vet_id}@example.com")
    return {"Authorization": f"Bearer {token}"}


class ConsultationAuthorizationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(server_simple.app)

    def test_get_consultation_rejects_foreign_owner(self):
        with patch.object(
            server_simple,
            "get_consultation_by_id",
            return_value=({"id": "consult-1", "user_id": "owner-vet", "payload": {}}, None),
        ):
            response = self.client.get(
                "/api/consultation/consult-1",
                headers=_auth_headers("other-vet"),
            )

        self.assertEqual(response.status_code, 403)

    def test_observations_update_allows_owner(self):
        consultation = {"id": "consult-1", "user_id": "owner-vet", "payload": {}}
        with patch.object(
            server_simple,
            "get_consultation_by_id",
            return_value=(consultation, None),
        ), patch.object(server_simple, "update_consultation", return_value=None) as update:
            response = self.client.put(
                "/api/consultations/consult-1/observations",
                headers=_auth_headers("owner-vet"),
                json={"detalle_paciente": "Notas clinicas"},
            )

        self.assertEqual(response.status_code, 200)
        update.assert_called_once()
        self.assertEqual(update.call_args.args[0], "consult-1")
        self.assertEqual(update.call_args.args[1]["payload"]["detalle_paciente"], "Notas clinicas")

    def test_lab_interpretation_rejects_foreign_consultation_before_insert(self):
        consultation_id = "00000000-0000-4000-8000-000000000001"
        profile = {
            "id": "attacker-vet",
            "email": "attacker@example.com",
            "membership_type": "premium",
            "consultations_remaining": 10,
        }

        with patch.object(server_simple, "get_profile", return_value=(profile, None)), patch.object(
            server_simple,
            "get_consultation_by_id",
            return_value=({"id": consultation_id, "user_id": "victim-vet", "payload": {}}, None),
        ), patch.object(server_simple, "insert_medical_image") as insert_image:
            response = self.client.post(
                "/api/medical-images/interpret",
                headers=_auth_headers("attacker-vet"),
                json={
                    "veterinarian_id": "attacker-vet",
                    "consultation_id": consultation_id,
                    "patient_name": "Paciente",
                    "pasted_study_data": "Hemograma: normal",
                },
            )

        self.assertEqual(response.status_code, 403)
        insert_image.assert_not_called()


if __name__ == "__main__":
    unittest.main(verbosity=2)
