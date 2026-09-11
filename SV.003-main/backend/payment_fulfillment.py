"""Aplica membresía o créditos cuando Stripe confirma un pago."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

from membership_catalog import (
    CONSULTATION_CREDIT_PACKAGES,
    MEMBERSHIP_PACKAGES,
    get_membership_consultations,
)
from supabase_client import (
    get_profile,
    update_payment_transaction,
    update_profile,
)


def _resolve_benefit_profile_id(veterinarian_id: str) -> Tuple[str, Optional[str]]:
    """Team purchases must fund the same owner pool that CDS later debits."""
    try:
        profile, err = get_profile(veterinarian_id)
    except Exception as exc:  # noqa: BLE001
        return (veterinarian_id, str(exc))
    if err or not profile:
        return (veterinarian_id, err or "Veterinario no encontrado")
    try:
        import clinic_db

        benefit_id = clinic_db.resolve_consultation_billing_profile_id(profile)
    except Exception as exc:  # noqa: BLE001
        return (veterinarian_id, str(exc))
    return ((benefit_id or veterinarian_id).strip() or veterinarian_id, None)


def sync_transaction_status(
    session_id: str,
    *,
    status: Optional[str],
    payment_status: Optional[str],
) -> Optional[str]:
    """Persiste status/payment_status de Stripe en payment_transactions."""
    fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if status is not None:
        fields["status"] = status
    if payment_status is not None:
        fields["payment_status"] = payment_status
    return update_payment_transaction(session_id, fields)


def _apply_membership(
    transaction: dict,
    metadata: dict,
    veterinarian_id: str,
) -> Tuple[Optional[dict], Optional[str], bool]:
    if transaction.get("membership_activated"):
        profile, err = get_profile(veterinarian_id)
        return (profile, err, False)

    package_key = (
        transaction.get("package") or metadata.get("package") or ""
    ).strip()
    billing_cycle = (
        transaction.get("billing_cycle") or metadata.get("billing_cycle") or "monthly"
    ).strip() or "monthly"
    package = MEMBERSHIP_PACKAGES.get(package_key)
    if not package:
        return (
            None,
            f"Paquete de membresía desconocido: {package_key or '(vacío)'}",
            False,
        )

    consultations = get_membership_consultations(package, billing_cycle)
    days = 30 if billing_cycle == "monthly" else 365
    expires = datetime.now(timezone.utc) + timedelta(days=days)
    err_upd = update_profile(
        veterinarian_id,
        {
            "membership_type": package_key,
            "consultations_remaining": consultations,
            "membership_expires": expires.isoformat(),
        },
    )
    if err_upd:
        return (None, err_upd, False)

    session_id = transaction.get("session_id")
    err_tx = update_payment_transaction(
        session_id,
        {
            "membership_activated": True,
            "membership_activated_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    if err_tx:
        return (None, err_tx, False)

    profile, err = get_profile(veterinarian_id)
    return (profile, err, True)


def _apply_credits(
    transaction: dict,
    metadata: dict,
    veterinarian_id: str,
) -> Tuple[Optional[dict], Optional[str], bool]:
    if transaction.get("credits_applied"):
        profile, err = get_profile(veterinarian_id)
        return (profile, err, False)

    veterinarian, err = get_profile(veterinarian_id)
    if err or not veterinarian:
        return (None, err or "Veterinario no encontrado", False)

    credits = int(transaction.get("credits") or metadata.get("credits") or 0)
    if credits <= 0:
        package_id = (transaction.get("package_id") or metadata.get("package_id") or "").strip()
        package = CONSULTATION_CREDIT_PACKAGES.get(package_id) or {}
        credits = int(package.get("credits") or 0)
    if credits <= 0:
        return (None, "La transacción de créditos no tiene cantidad", False)

    membership_type = veterinarian.get("membership_type")
    current = int(veterinarian.get("consultations_remaining") or 0)
    if not membership_type and current + credits > 3:
        new_remaining = 3
    else:
        new_remaining = current + credits

    err_upd = update_profile(
        veterinarian_id,
        {"consultations_remaining": new_remaining},
    )
    if err_upd:
        return (None, err_upd, False)

    err_tx = update_payment_transaction(
        transaction.get("session_id"),
        {
            "credits_applied": True,
            "credits_applied_at": datetime.now(timezone.utc).isoformat(),
            "consultations_remaining_after": new_remaining,
        },
    )
    if err_tx:
        return (None, err_tx, False)

    profile, err = get_profile(veterinarian_id)
    return (profile, err, True)


def fulfill_paid_transaction(
    transaction: dict,
    metadata: Optional[dict] = None,
) -> Tuple[Optional[dict], Optional[str], bool]:
    """Aplica el beneficio de un pago ya cobrado. Idempotente.

    Returns:
        (perfil actualizado, error, True si aplicó un cambio)
    """
    if not transaction:
        return (None, "Transacción no encontrada", False)

    meta = metadata or {}
    tx_type = (transaction.get("type") or meta.get("type") or "").strip()
    veterinarian_id = (
        transaction.get("veterinarian_id") or meta.get("veterinarian_id") or ""
    ).strip()
    if not veterinarian_id:
        return (None, "La transacción no tiene veterinarian_id", False)
    benefit_profile_id, benefit_err = _resolve_benefit_profile_id(veterinarian_id)
    if benefit_err:
        return (None, benefit_err, False)

    if tx_type == "membership":
        return _apply_membership(transaction, meta, benefit_profile_id)
    if tx_type == "consultation_credits":
        return _apply_credits(transaction, meta, benefit_profile_id)
    return (None, f"Tipo de transacción no soportado: {tx_type or '(vacío)'}", False)
