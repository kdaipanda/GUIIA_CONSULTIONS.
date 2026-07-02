"""QA: restricciones por plan (Básica, Profesional, Premium, Trial)."""
from __future__ import annotations

import os
import sys
import unittest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from membership_access import (  # noqa: E402
    can_access_feature,
    filter_categories_for_plan,
    resolve_effective_plan,
    validate_consultation_category,
)
from membership_catalog import MEMBERSHIP_PACKAGES, get_membership_consultations  # noqa: E402
from fastapi import HTTPException


def _profile(plan: str, remaining: int = 10) -> dict:
    return {
        "id": f"test-{plan}",
        "email": f"{plan}@guiaa.vet",
        "membership_type": plan,
        "consultations_remaining": remaining,
    }


def _trial_profile(remaining: int = 2) -> dict:
    return {
        "id": "test-trial",
        "email": "trial@guiaa.vet",
        "membership_type": None,
        "consultations_remaining": remaining,
    }


ALL_CATEGORIES = [
    {"id": "perros", "name": "Perros"},
    {"id": "gatos", "name": "Gatos"},
    {"id": "aves", "name": "Aves"},
    {"id": "conejos", "name": "Conejos"},
]


class MembershipPlanMatrix(unittest.TestCase):
    def test_resolve_effective_plan(self):
        self.assertEqual(resolve_effective_plan(_profile("basic")), "basic")
        self.assertEqual(resolve_effective_plan(_profile("professional")), "professional")
        self.assertEqual(resolve_effective_plan(_profile("premium")), "premium")
        self.assertEqual(resolve_effective_plan(_trial_profile()), "trial")
        self.assertEqual(resolve_effective_plan({"membership_type": None, "consultations_remaining": 0}), "basic")

    def test_basic_plan_restrictions(self):
        p = _profile("basic")
        self.assertFalse(can_access_feature(p, "inventory"))
        self.assertFalse(can_access_feature(p, "billing"))
        self.assertFalse(can_access_feature(p, "reports"))
        self.assertFalse(can_access_feature(p, "multiespecies"))
        self.assertFalse(can_access_feature(p, "expert_mode"))
        self.assertFalse(can_access_feature(p, "advanced_analysis"))
        self.assertFalse(can_access_feature(p, "medical_images"))

    def test_professional_plan(self):
        p = _profile("professional")
        self.assertTrue(can_access_feature(p, "inventory"))
        self.assertTrue(can_access_feature(p, "billing"))
        self.assertTrue(can_access_feature(p, "reports"))
        self.assertTrue(can_access_feature(p, "multiespecies"))
        self.assertFalse(can_access_feature(p, "expert_mode"))
        self.assertFalse(can_access_feature(p, "advanced_analysis"))
        self.assertFalse(can_access_feature(p, "medical_images"))

    def test_premium_plan(self):
        p = _profile("premium")
        self.assertTrue(can_access_feature(p, "inventory"))
        self.assertTrue(can_access_feature(p, "expert_mode"))
        self.assertTrue(can_access_feature(p, "advanced_analysis"))
        self.assertTrue(can_access_feature(p, "medical_images"))

    def test_trial_plan(self):
        p = _trial_profile()
        self.assertTrue(can_access_feature(p, "multiespecies"))
        self.assertTrue(can_access_feature(p, "advanced_analysis"))
        self.assertFalse(can_access_feature(p, "expert_mode"))
        self.assertTrue(can_access_feature(p, "inventory"))

    def test_basic_species_filter(self):
        p = _profile("basic")
        filtered = filter_categories_for_plan(ALL_CATEGORIES, p)
        ids = {c["id"] for c in filtered}
        self.assertEqual(ids, {"perros", "gatos"})

    def test_professional_species_filter(self):
        p = _profile("professional")
        filtered = filter_categories_for_plan(ALL_CATEGORIES, p)
        self.assertEqual(len(filtered), len(ALL_CATEGORIES))

    def test_basic_blocks_exotic_consultation(self):
        p = _profile("basic")
        with self.assertRaises(HTTPException) as ctx:
            validate_consultation_category(p, "aves")
        self.assertEqual(ctx.exception.status_code, 403)

    def test_trial_exhausted_resolves_basic(self):
        self.assertEqual(resolve_effective_plan(_trial_profile(0)), "basic")

    def test_exhausted_trial_cannot_access_inventory(self):
        p = _trial_profile(0)
        self.assertFalse(can_access_feature(p, "inventory"))
        self.assertFalse(can_access_feature(p, "advanced_analysis"))


class TrialConsultationLimit(unittest.TestCase):
    def test_validate_trial_limit_allows_three(self):
        from server_simple import validate_trial_consultations_limit

        self.assertTrue(validate_trial_consultations_limit(None, 3))
        self.assertTrue(validate_trial_consultations_limit(None, 1))

    def test_validate_trial_limit_blocks_more_than_three(self):
        from server_simple import validate_trial_consultations_limit

        with self.assertRaises(HTTPException) as ctx:
            validate_trial_consultations_limit(None, 4)
        self.assertEqual(ctx.exception.status_code, 400)


class MembershipConsultations(unittest.TestCase):
    def test_monthly_consultations(self):
        package = MEMBERSHIP_PACKAGES["premium"]
        self.assertEqual(get_membership_consultations(package, "monthly"), 150)

    def test_annual_consultations(self):
        package = MEMBERSHIP_PACKAGES["premium"]
        self.assertEqual(get_membership_consultations(package, "annual"), 1500)

    def test_defaults_to_monthly_when_cycle_missing(self):
        package = MEMBERSHIP_PACKAGES["basic"]
        self.assertEqual(get_membership_consultations(package, ""), 30)


if __name__ == "__main__":
    unittest.main(verbosity=2)
