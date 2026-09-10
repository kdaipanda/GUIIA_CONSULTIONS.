"""
Control de acceso por membresía — alineado con membership_catalog.py.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

import auth_security
from fastapi import HTTPException

BASIC_SPECIES = frozenset({"perros", "gatos"})

FEATURES = frozenset(
    {
        "inventory",
        "billing",
        "reports",
        "multiespecies",
        "expert_mode",
        "advanced_analysis",
        "medical_images",
    }
)

FEATURE_ACCESS = {
    "inventory": frozenset({"professional", "premium", "trial"}),
    "billing": frozenset({"professional", "premium", "trial"}),
    "reports": frozenset({"professional", "premium", "trial"}),
    "multiespecies": frozenset({"professional", "premium", "trial"}),
    "expert_mode": frozenset({"premium"}),
    "advanced_analysis": frozenset({"premium", "trial"}),
    "medical_images": frozenset({"premium"}),
}

# Cuentas internas que no consumen cupo (el resto de planes sí descuenta).
UNLIMITED_CONSULTATIONS_EMAILS = {
    "carlos.hernandez@vetmed.com",
}


def has_unlimited_consultations(email: Optional[str]) -> bool:
    """True solo para allowlist interna, no para el plan Premium comercial."""
    if not email:
        return False
    return email.lower().strip() in UNLIMITED_CONSULTATIONS_EMAILS


FEATURE_UPGRADE_MESSAGES = {
    "inventory": "El inventario requiere membresía Profesional o Premium.",
    "billing": "Ventas y facturación requieren membresía Profesional o Premium.",
    "reports": "Los reportes clínicos requieren membresía Profesional o Premium.",
    "multiespecies": "Las consultas multiespecie requieren membresía Profesional o Premium.",
    "expert_mode": "Manejo Experto está disponible solo con membresía Premium.",
    "advanced_analysis": "La síntesis clínica CDS L5 requiere membresía Premium.",
    "medical_images": "La interpretación de laboratorio (PDF y estudios) requiere membresía Premium.",
}


def _parse_iso_dt(value) -> Optional[datetime]:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        raw = str(value).strip()
        if not raw:
            return None
        try:
            dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def has_active_premium_features_grant(profile: Optional[dict]) -> bool:
    """
    Override temporal solo de FEATURES (no de cupo CDS).
    No se hereda al equipo: se lee del perfil del actor, no del owner overlay.
    """
    if not profile:
        return False
    # Miembros de org no deben heredar el grant personal del dueño.
    if (profile.get("membership_source") or "").strip().lower() == "organization":
        return False
    until = _parse_iso_dt(profile.get("premium_features_until"))
    if not until:
        return False
    return until > datetime.now(timezone.utc)


def resolve_billing_plan(profile: Optional[dict]) -> str:
    """Plan real para cupo/billing (ignora grant de features)."""
    if not profile:
        return "basic"
    membership_type = profile.get("membership_type")
    remaining = profile.get("consultations_remaining") or 0
    if membership_type:
        return str(membership_type).lower()
    if remaining > 0:
        return "trial"
    return "basic"


def resolve_effective_plan(
    profile: Optional[dict],
    *,
    has_unlimited: bool = False,
    is_platform_admin: bool = False,
) -> str:
    """Plan efectivo para FEATURES (puede elevarse con premium_features_until)."""
    if is_platform_admin:
        return "premium"
    if has_unlimited:
        return "premium"
    if has_active_premium_features_grant(profile):
        return "premium"
    return resolve_billing_plan(profile)


def can_access_feature(
    profile: Optional[dict],
    feature: str,
    *,
    has_unlimited: bool = False,
    is_platform_admin: bool = False,
) -> bool:
    if feature not in FEATURES:
        return False
    plan = resolve_effective_plan(
        profile,
        has_unlimited=has_unlimited,
        is_platform_admin=is_platform_admin,
    )
    return plan in FEATURE_ACCESS[feature]


def require_feature(
    profile: Optional[dict],
    feature: str,
    *,
    has_unlimited: bool = False,
    is_platform_admin: bool = False,
) -> None:
    if can_access_feature(
        profile,
        feature,
        has_unlimited=has_unlimited,
        is_platform_admin=is_platform_admin,
    ):
        return
    message = FEATURE_UPGRADE_MESSAGES.get(feature, "Tu plan no incluye esta función.")
    raise HTTPException(status_code=403, detail=message)


def validate_consultation_category(
    profile: Optional[dict],
    category: Optional[str],
    *,
    has_unlimited: bool = False,
    is_platform_admin: bool = False,
) -> None:
    if not category:
        return

    if can_access_feature(
        profile,
        "multiespecies",
        has_unlimited=has_unlimited,
        is_platform_admin=is_platform_admin,
    ):
        return

    normalized = str(category).strip().lower()
    if normalized not in BASIC_SPECIES:
        raise HTTPException(
            status_code=403,
            detail=FEATURE_UPGRADE_MESSAGES["multiespecies"],
        )


def filter_categories_for_plan(
    categories: list,
    profile: Optional[dict],
    *,
    has_unlimited: bool = False,
    is_platform_admin: bool = False,
) -> list:
    if can_access_feature(
        profile,
        "multiespecies",
        has_unlimited=has_unlimited,
        is_platform_admin=is_platform_admin,
    ):
        return categories
    return [cat for cat in categories if (cat.get("id") or "").lower() in BASIC_SPECIES]


def require_feature_for_profile(profile: Optional[dict], feature: str, *, has_unlimited: bool = False) -> None:
    require_feature(
        profile,
        feature,
        has_unlimited=has_unlimited,
        is_platform_admin=auth_security.is_platform_admin_profile(profile),
    )


def annotate_premium_features_flag(profile: Optional[dict]) -> Optional[dict]:
    """Marca runtime para UI: premium_features_active sin tocar cupo."""
    if not profile:
        return profile
    out = dict(profile)
    active = has_active_premium_features_grant(out)
    out["premium_features_active"] = active
    return out
