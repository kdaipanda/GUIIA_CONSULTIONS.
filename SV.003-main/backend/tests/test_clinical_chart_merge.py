"""Tests for concurrent clinical chart updates."""
from __future__ import annotations

import unittest
from unittest import mock

import clinic_db


class ClinicalChartMergeConcurrency(unittest.TestCase):
    def test_retries_after_concurrent_patient_update(self):
        stale_patient = {
            "id": "patient-1",
            "organization_id": "org-1",
            "updated_at": "2026-09-13T12:00:00Z",
            "clinical_chart": {
                "vaccines": [{"label": "Rabia", "date": "2026-01-01"}],
            },
        }
        current_patient = {
            "id": "patient-1",
            "organization_id": "org-1",
            "updated_at": "2026-09-13T12:00:01Z",
            "clinical_chart": {
                "vaccines": [{"label": "Rabia", "date": "2026-01-01"}],
                "allergies": [{"label": "Polen", "noted_at": "2026-09-13"}],
            },
        }

        with (
            mock.patch.object(
                clinic_db,
                "get_patient",
                side_effect=[(stale_patient, None), (current_patient, None)],
            ) as get_patient,
            mock.patch.object(
                clinic_db,
                "_update_patient_if_unchanged",
                side_effect=[
                    (None, None),
                    (
                        {
                            **current_patient,
                            "clinical_chart": {
                                "vaccines": [{"label": "Rabia", "date": "2026-01-01"}],
                                "allergies": [{"label": "Polen", "noted_at": "2026-09-13"}],
                                "surgeries": [{"label": "OVH", "date": "2026-09-13"}],
                            },
                        },
                        None,
                    ),
                ],
            ) as update_if_unchanged,
        ):
            patient, err = clinic_db.merge_patient_clinical_chart(
                "patient-1",
                "org-1",
                {"surgeries": [{"label": "OVH", "date": "2026-09-13"}]},
            )

        self.assertIsNone(err)
        self.assertIsNotNone(patient)
        self.assertEqual(get_patient.call_count, 2)
        self.assertEqual(update_if_unchanged.call_count, 2)

        first_update = update_if_unchanged.call_args_list[0].args
        second_update = update_if_unchanged.call_args_list[1].args
        self.assertEqual(first_update[3], stale_patient["updated_at"])
        self.assertEqual(second_update[3], current_patient["updated_at"])
        merged_chart = second_update[2]["clinical_chart"]
        self.assertEqual(
            [item["label"] for item in merged_chart["allergies"]],
            ["Polen"],
        )
        self.assertEqual(
            [item["label"] for item in merged_chart["surgeries"]],
            ["OVH"],
        )


if __name__ == "__main__":
    unittest.main()
