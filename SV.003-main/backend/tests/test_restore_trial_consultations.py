"""Tests para restauración segura de consultas de prueba."""

from scripts.restore_trial_consultations import (
    TRIAL_CREDITS,
    _needs_trial_restore,
    _restore_target,
)


def test_restore_target_never_reduces_existing_credits():
    profile = {"membership_type": None, "consultations_remaining": 12}

    assert _restore_target(profile) == 12
    assert _needs_trial_restore(profile) is False


def test_trial_restore_only_targets_trials_below_three():
    profile = {"membership_type": None, "consultations_remaining": 1}

    assert _needs_trial_restore(profile) is True
    assert _restore_target(profile) == TRIAL_CREDITS


def test_trial_restore_ignores_paid_memberships_even_when_low():
    profile = {"membership_type": "premium", "consultations_remaining": 0}

    assert _needs_trial_restore(profile) is False
