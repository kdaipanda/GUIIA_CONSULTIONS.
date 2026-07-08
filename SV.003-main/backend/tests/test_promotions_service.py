"""Tests para campañas promocionales multicanal."""

import promotions_service
import whatsapp_notifications
from trial_survey import build_premium_offer


def test_list_segments_includes_trial_exhausted():
    ids = {s["id"] for s in promotions_service.list_segments()}
    assert "trial_exhausted" in ids
    assert "guia_leads_new" in ids


def test_profile_eligible_trial_exhausted():
    profile = {"membership_type": None, "consultations_remaining": 0}
    assert promotions_service._profile_eligible_for_marketing(profile, "trial_exhausted")


def test_profile_not_eligible_with_membership():
    profile = {"membership_type": "premium", "consultations_remaining": 0}
    assert not promotions_service._profile_eligible_for_marketing(profile, "trial_exhausted")


def test_profile_blocked_when_unsubscribed():
    profile = {
        "membership_type": None,
        "consultations_remaining": 0,
        "marketing_unsubscribed_at": "2026-07-01T00:00:00Z",
    }
    assert not promotions_service._profile_eligible_for_marketing(profile, "trial_exhausted")


def test_normalize_phone_mexico():
    assert whatsapp_notifications.normalize_phone_e164("5512345678") == "+525512345678"
    assert whatsapp_notifications.normalize_phone_e164("+525512345678") == "+525512345678"


def test_preview_invalid_segment():
    result = promotions_service.preview_campaign("invalid_segment", ["email"])
    assert result["ok"] is False


def test_preview_invalid_channel():
    result = promotions_service.preview_campaign("trial_exhausted", ["sms"])
    assert result["ok"] is False


def test_build_offer_payload_defaults():
    offer = promotions_service.build_offer_payload()
    assert offer["plan_id"] == "premium"
    assert offer.get("promo_code") is not None or offer.get("promo_code") == ""


def test_build_offer_payload_merge():
    base = build_premium_offer()
    custom = promotions_service.build_offer_payload({"headline": "Oferta especial"})
    assert custom["headline"] == "Oferta especial"
    assert custom["plan_id"] == base["plan_id"]
