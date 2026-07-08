"""Tests para encuesta post-prueba."""

import pytest

from trial_survey import (
    build_premium_offer,
    build_trial_survey_status,
    survey_fields_from_submission,
    trial_survey_pending,
    validate_survey_submission,
)


def test_trial_survey_pending_when_exhausted():
    profile = {"membership_type": None, "consultations_remaining": 0}
    assert trial_survey_pending(profile) is True


def test_trial_survey_not_pending_with_membership():
    profile = {"membership_type": "premium", "consultations_remaining": 0}
    assert trial_survey_pending(profile) is False


def test_trial_survey_not_pending_with_remaining():
    profile = {"membership_type": None, "consultations_remaining": 1}
    assert trial_survey_pending(profile) is False


def test_trial_survey_not_pending_when_completed():
    profile = {
        "membership_type": None,
        "consultations_remaining": 0,
        "trial_survey_completed_at": "2026-07-07T00:00:00Z",
    }
    assert trial_survey_pending(profile) is False


def test_validate_survey_submission():
    validate_survey_submission(5, "Excelente herramienta clínica")
    with pytest.raises(ValueError):
        validate_survey_submission(0, "comentario válido")
    with pytest.raises(ValueError):
        validate_survey_submission(4, "cort")


def test_build_status_includes_offer():
    status = build_trial_survey_status(
        {"membership_type": None, "consultations_remaining": 0}
    )
    assert status["show_survey"] is True
    assert status["offer"]["plan_id"] == "premium"
    assert status["offer"]["promo_code"]


def test_survey_fields_from_submission():
    fields = survey_fields_from_submission(4, "Muy útil para casos complejos")
    assert fields["trial_survey_rating"] == 4
    assert fields["trial_survey_comment"] == "Muy útil para casos complejos"
    assert fields["trial_survey_completed_at"]


def test_list_trial_survey_responses_orders_by_date():
    profiles = [
        {
            "id": "a",
            "email": "a@test.com",
            "trial_survey_completed_at": "2026-07-01T00:00:00Z",
            "trial_survey_rating": 3,
            "trial_survey_comment": "Bien",
        },
        {"id": "b", "email": "b@test.com"},
        {
            "id": "c",
            "email": "c@test.com",
            "trial_survey_completed_at": "2026-07-07T00:00:00Z",
            "trial_survey_rating": 5,
            "trial_survey_comment": "Excelente",
        },
    ]
    from trial_survey import list_trial_survey_responses

    rows = list_trial_survey_responses(profiles)
    assert len(rows) == 2
    assert rows[0]["id"] == "c"
    assert rows[1]["id"] == "a"
