"""Separación de capas: veterinario (MVZ) vs dueño de mascota (B2C)."""
from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import HTTPException

import auth_security
from membership_access import has_unlimited_owner_sessions

ACCOUNT_KIND_VETERINARIAN = "veterinarian"
ACCOUNT_KIND_PET_OWNER = "pet_owner"

OWNER_DISCLAIMER_ES = (
    "Esta orientación clínica informativa no sustituye la atención de un médico "
    "veterinario certificado. No constituye un diagnóstico clínico oficial ni una "
    "prescripción. Ante urgencias, signos graves o empeoramiento, acude de inmediato "
    "a una clínica veterinaria."
)

OWNER_DISCLAIMER_EN = (
    "This informational clinical guidance does not replace care from a licensed "
    "veterinarian. It is not an official clinical diagnosis or a prescription. "
    "For emergencies, severe signs, or worsening, seek a veterinary clinic immediately."
)


def get_account_kind(profile: Optional[Dict[str, Any]]) -> str:
    if not profile:
        return ACCOUNT_KIND_VETERINARIAN
    kind = (profile.get("account_kind") or ACCOUNT_KIND_VETERINARIAN).strip().lower()
    if kind == ACCOUNT_KIND_PET_OWNER:
        return ACCOUNT_KIND_PET_OWNER
    return ACCOUNT_KIND_VETERINARIAN


def is_pet_owner(profile: Optional[Dict[str, Any]]) -> bool:
    return get_account_kind(profile) == ACCOUNT_KIND_PET_OWNER


def is_veterinarian_account(profile: Optional[Dict[str, Any]]) -> bool:
    return get_account_kind(profile) == ACCOUNT_KIND_VETERINARIAN


def is_owner_b2c_tester(profile: Optional[Dict[str, Any]]) -> bool:
    """Admin / allowlist interna: puede usar /consulta sin ser pet_owner."""
    if not profile:
        return False
    email = (profile.get("email") or "").strip()
    if has_unlimited_owner_sessions(email):
        return True
    return auth_security.is_platform_admin_profile(profile)


def can_access_owner_b2c(profile: Optional[Dict[str, Any]]) -> bool:
    return is_pet_owner(profile) or is_owner_b2c_tester(profile)


def has_unlimited_owner_access(profile: Optional[Dict[str, Any]]) -> bool:
    return is_owner_b2c_tester(profile)


def require_veterinarian_account(profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    if is_pet_owner(profile):
        raise HTTPException(
            status_code=403,
            detail=(
                "Esta cuenta es de dueño de mascota. "
                "Usa /consulta para tu orientación. El consultorio clínico es solo para MVZ."
            ),
        )
    return profile


def require_pet_owner_account(profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    if can_access_owner_b2c(profile):
        return profile
    raise HTTPException(
        status_code=403,
        detail=(
            "Esta cuenta es de veterinario. "
            "El flujo /consulta es solo para dueños de mascota."
        ),
    )
