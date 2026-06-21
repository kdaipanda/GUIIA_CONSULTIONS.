"""
Control de acceso por membresía — alineado con membership_catalog.py.
"""
from __future__ import annotations

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

FEATURE_UPGRADE_MESSAGES = {
    "inventory": "El inventario requiere membresía Profesional o Premium.",
    "billing": "Ventas y facturación requieren membresía Profesional o Premium.",
    "reports": "Los reportes clínicos requieren membresía Profesional o Premium.",
    "multiespecies": "Las consultas multiespecie requieren membresía Profesional o Premium.",
    "expert_mode": "Manejo Experto está disponible solo con membresía Premium.",
    "advanced_analysis": "La síntesis clínica CDS L5 requiere membresía Premium.",
    "medical_images": "Esta función requiere membresía Premium.",
}


def resolve_effective_plan(
    profile: Optional[dict],
    *,
    has_unlimited: bool = False,
    is_platform_admin: bool = False,
) -> str:
    if is_platform_admin:
        return "premium"
    if has_unlimited:
        return "premium"
    if not profile:
        return "basic"

    membership_type = profile.get("membership_type")
    remaining = profile.get("consultations_remaining") or 0

    if membership_type:
        return str(membership_type).lower()
    if remaining > 0:
        return "trial"
    return "basic"


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
