"""Encuesta post-prueba (3 consultas) y oferta Premium con cupón Stripe."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from stripe_checkout_config import (
    is_auto_apply_premium_promo_enabled,
    premium_promotion_code_label,
)

TRIAL_CONSULTATION_LIMIT = 3
MAX_COMMENT_LENGTH = 2000


def trial_survey_pending(profile: Optional[Dict[str, Any]]) -> bool:
    """True si agotó la prueba y aún no envía la encuesta."""
    if not profile:
        return False
    if (profile.get("membership_type") or "").strip():
        return False
    remaining = int(profile.get("consultations_remaining") or 0)
    if remaining > 0:
        return False
    if profile.get("trial_survey_completed_at"):
        return False
    return True


def build_premium_offer() -> Dict[str, Any]:
    promo = premium_promotion_code_label()
    auto_apply = is_auto_apply_premium_promo_enabled()
    return {
        "plan_id": "premium",
        "plan_name": "Premium",
        "promo_code": promo,
        "promo_auto_apply": auto_apply,
        "headline": "Oferta exclusiva por completar tu prueba",
        "message": (
            "Como completaste tus 3 consultas de prueba, tienes acceso a una oferta "
            f"para contratar el plan Premium"
            + (f" con el cupón {promo}" if promo else "")
            + (
                ". El descuento se aplicará automáticamente al pagar."
                if auto_apply
                else ". Ingresa el cupón al pagar si no se aplica solo."
            )
        ),
    }


def build_trial_survey_status(profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    completed_at = profile.get("trial_survey_completed_at") if profile else None
    show = trial_survey_pending(profile)
    offer = build_premium_offer()
    return {
        "show_survey": show,
        "completed": bool(completed_at),
        "completed_at": completed_at,
        "trial_consultations_used": TRIAL_CONSULTATION_LIMIT,
        "offer": offer,
    }


def validate_survey_submission(rating: int, comment: str) -> None:
    if rating < 1 or rating > 5:
        raise ValueError("La calificación debe ser entre 1 y 5 estrellas.")
    text = (comment or "").strip()
    if len(text) < 5:
        raise ValueError("Escribe al menos un comentario breve (5 caracteres o más).")
    if len(text) > MAX_COMMENT_LENGTH:
        raise ValueError(f"El comentario no puede superar {MAX_COMMENT_LENGTH} caracteres.")


def survey_fields_from_submission(rating: int, comment: str) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "trial_survey_rating": int(rating),
        "trial_survey_comment": (comment or "").strip(),
        "trial_survey_completed_at": now,
    }
