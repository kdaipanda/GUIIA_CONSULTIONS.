"""QA: el análisis CDS solo se marca cobrado si el débito de cupo se confirma."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)


class ConsultationAnalysisBillingTests(unittest.IsolatedAsyncioTestCase):
    async def test_debit_failure_does_not_mark_analysis_charged(self):
        import server_simple

        consultation = {
            "id": "consultation-1",
            "status": "draft",
            "payload": {
                "category": "perros",
                "form_data": {"nombre_mascota": "Luna"},
                "detalle_paciente": "Tos persistente",
                "credit": {
                    "policy": server_simple.CREDIT_POLICY_ON_ANALYSIS,
                    "charged_at": None,
                },
            },
        }
        profile = {
            "id": "vet-1",
            "email": "vet@example.com",
            "membership_type": "basic",
            "consultations_remaining": 1,
        }

        with patch.object(server_simple, "_require_vet_id", return_value="vet-1"), patch.object(
            server_simple, "_require_consultation_owned", return_value=consultation
        ), patch.object(server_simple, "get_profile", return_value=(profile, None)), patch.object(
            server_simple, "_with_team_membership", side_effect=lambda p: p
        ), patch.object(
            server_simple, "has_unlimited_consultations", return_value=False
        ), patch.object(
            server_simple, "require_feature_for_profile", return_value=None
        ), patch.object(
            server_simple, "send_llm_message", new=AsyncMock(return_value="Análisis clínico")
        ), patch.object(
            server_simple, "update_profile", return_value="supabase timeout"
        ), patch.object(
            server_simple, "update_consultation", return_value=None
        ) as update_consultation:
            with self.assertRaises(HTTPException) as raised:
                await server_simple.analyze_consultation(
                    "consultation-1",
                    x_veterinarian_id="vet-1",
                )

        self.assertEqual(raised.exception.status_code, 500)
        self.assertIn("Error descontando consulta", raised.exception.detail)
        self.assertEqual(update_consultation.call_count, 2)
        saved_fields = update_consultation.call_args_list[0].args[1]
        self.assertIsNotNone(saved_fields["payload"]["credit"]["charged_at"])
        rollback_fields = update_consultation.call_args_list[1].args[1]
        self.assertIsNone(rollback_fields["analysis"])
        self.assertEqual(rollback_fields["status"], "draft")
        self.assertIsNone(rollback_fields["payload"]["credit"]["charged_at"])


if __name__ == "__main__":
    unittest.main()
