"""Opciones de Stripe Checkout orientadas a Latinoamérica (es-MX, MXN, OXXO)."""
from __future__ import annotations

import os
from typing import Any, Dict, List, Optional


def normalize_country_code(country: Optional[str]) -> str:
    code = (country or "MX").strip().upper()
    if code in {"MEX", "MEXICO", "MÉXICO"}:
        return "MX"
    return code[:2] if code else "MX"


def is_oxxo_enabled() -> bool:
    return os.getenv("STRIPE_ENABLE_OXXO", "true").strip().lower() in {"1", "true", "yes", "on"}


def is_membership_promotion_codes_enabled() -> bool:
    return os.getenv("STRIPE_ENABLE_MEMBERSHIP_PROMO_CODES", "true").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def premium_promotion_code_label() -> str:
    return os.getenv("STRIPE_PREMIUM_PROMO_CODE", "GUIAAFRIENDS").strip() or "GUIAAFRIENDS"


def is_auto_apply_premium_promo_enabled() -> bool:
    return os.getenv("STRIPE_AUTO_APPLY_PREMIUM_PROMO", "true").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def lookup_stripe_promotion_code_id(stripe_api: Any, code: str) -> Optional[str]:
    """Busca el promotion code activo en Stripe (p. ej. GUIAAFRIENDS)."""
    normalized = (code or "").strip()
    if not normalized or stripe_api is None:
        return None
    try:
        result = stripe_api.PromotionCode.list(active=True, code=normalized, limit=1)
        if result.data:
            return result.data[0].id
    except Exception as exc:
        print(f"[WARN] No se pudo resolver promotion code '{normalized}': {exc}")
    return None


def membership_promotion_checkout_kwargs(
    package_key: str,
    stripe_api: Any = None,
) -> Dict[str, Any]:
    """
    Descuento Premium en Checkout:
    1) Auto-aplica STRIPE_PREMIUM_PROMO_CODE si existe en Stripe (recomendado).
    2) Si no, habilita campo manual allow_promotion_codes.
    """
    if (package_key or "").strip().lower() != "premium":
        return {}
    if not is_membership_promotion_codes_enabled():
        return {}

    promo_code = premium_promotion_code_label()
    if is_auto_apply_premium_promo_enabled() and stripe_api is not None:
        promo_id = lookup_stripe_promotion_code_id(stripe_api, promo_code)
        if promo_id:
            return {"discounts": [{"promotion_code": promo_id}]}

    return {"allow_promotion_codes": True}


def stripe_payment_method_types(currency: str, country_code: str) -> List[str]:
    """Métodos de pago según moneda y país del profesional."""
    methods = ["card"]
    if (currency or "").lower() == "mxn" and normalize_country_code(country_code) == "MX":
        if is_oxxo_enabled():
            methods.append("oxxo")
    return methods


def build_stripe_checkout_session_kwargs(
    profile: Optional[dict],
    *,
    currency: str,
) -> Dict[str, Any]:
    """Parámetros extra para Checkout Session (locale, email, métodos locales)."""
    country = normalize_country_code((profile or {}).get("profesional_pais"))
    email = ((profile or {}).get("email") or "").strip()
    payment_method_types = stripe_payment_method_types(currency, country)

    params: Dict[str, Any] = {
        "locale": "es",
        "payment_method_types": payment_method_types,
    }
    if email:
        params["customer_email"] = email
    if "oxxo" in payment_method_types:
        params["payment_method_options"] = {"oxxo": {"expires_after_days": 3}}
    return params


def is_async_payment_pending(payment_status: Optional[str], status: Optional[str]) -> bool:
    """Pago diferido (p. ej. OXXO): sesión completada pero aún sin liquidar."""
    return (payment_status or "").lower() != "paid" and (status or "").lower() in {
        "complete",
        "open",
    }


def create_stripe_checkout_session(stripe_api: Any, **session_kwargs: Any):
    """
    Crea la sesión de Checkout con métodos LATAM.
    Si OXXO no está habilitado en la cuenta Stripe, reintenta solo con tarjeta.
    """
    latam = build_stripe_checkout_session_kwargs(
        session_kwargs.pop("profile", None),
        currency=session_kwargs.get("currency")
        or _currency_from_line_items(session_kwargs.get("line_items")),
    )
    merged = {**session_kwargs, **latam}
    has_discounts = bool(merged.get("discounts"))
    try:
        return stripe_api.checkout.Session.create(**merged)
    except Exception as primary_error:
        if has_discounts:
            fallback_manual = {**merged}
            fallback_manual.pop("discounts", None)
            fallback_manual["allow_promotion_codes"] = True
            try:
                print("[WARN] Checkout con descuento auto falló; reintentando con cupón manual.")
                return stripe_api.checkout.Session.create(**fallback_manual)
            except Exception:
                raise primary_error
        if "oxxo" not in latam.get("payment_method_types", []):
            raise
        fallback = {**merged, "payment_method_types": ["card"]}
        fallback.pop("payment_method_options", None)
        return stripe_api.checkout.Session.create(**fallback)


def _currency_from_line_items(line_items: Any) -> str:
    if not line_items:
        return "mxn"
    first = line_items[0] if isinstance(line_items, list) else line_items
    if not isinstance(first, dict):
        return "mxn"
    price_data = first.get("price_data") or {}
    return str(price_data.get("currency") or "mxn")
