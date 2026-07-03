"""Opciones de Stripe Checkout orientadas a Latinoamérica (es-MX, MXN, OXXO)."""
from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional, Tuple

PromoResolution = Tuple[Dict[str, Any], Optional[str], Optional[str], Optional[str]]


def normalize_country_code(country: Optional[str]) -> str:
    code = (country or "MX").strip().upper()
    if code in {"MEX", "MEXICO", "MÉXICO"}:
        return "MX"
    return code[:2] if code else "MX"


def _normalize_promo_token(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (value or "").upper())


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
    return os.getenv("STRIPE_PREMIUM_PROMO_CODE", "FRIENDS40").strip() or "FRIENDS40"


def premium_promotion_code_id() -> str:
    return os.getenv("STRIPE_PREMIUM_PROMOTION_CODE_ID", "").strip()


def premium_coupon_id() -> str:
    return os.getenv("STRIPE_PREMIUM_COUPON_ID", "").strip()


def is_auto_apply_premium_promo_enabled() -> bool:
    return os.getenv("STRIPE_AUTO_APPLY_PREMIUM_PROMO", "true").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def lookup_stripe_promotion_code_id(stripe_api: Any, code: str) -> Optional[str]:
    """Busca promotion code activo por código visible (GUIAAFRIENDS, etc.)."""
    normalized = (code or "").strip()
    if not normalized or stripe_api is None:
        return None

    target = _normalize_promo_token(normalized)
    if not target:
        return None

    candidates = [normalized, normalized.upper(), normalized.replace(" ", "")]
    seen: set[str] = set()
    for candidate in candidates:
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        try:
            result = stripe_api.PromotionCode.list(active=True, code=candidate, limit=3)
            for promo in result.data or []:
                if getattr(promo, "active", True):
                    return promo.id
        except Exception as exc:
            print(f"[WARN] PromotionCode.list code='{candidate}' falló: {exc}")

    try:
        starting_after: Optional[str] = None
        for _ in range(5):
            params: Dict[str, Any] = {"active": True, "limit": 100}
            if starting_after:
                params["starting_after"] = starting_after
            page = stripe_api.PromotionCode.list(**params)
            for promo in page.data or []:
                promo_code = getattr(promo, "code", "") or ""
                if _normalize_promo_token(promo_code) == target and getattr(promo, "active", True):
                    return promo.id
            if not getattr(page, "has_more", False):
                break
            if not page.data:
                break
            starting_after = page.data[-1].id
    except Exception as exc:
        print(f"[WARN] Barrido de promotion codes falló: {exc}")

    return None


def resolve_premium_promotion_discount(stripe_api: Any) -> PromoResolution:
    """
    Resuelve descuento Premium para Checkout.
    Returns: (kwargs, kind, ref_id, error)
    """
    if stripe_api is None:
        return {}, None, None, "stripe_unavailable"

    coupon_id = premium_coupon_id()
    if coupon_id:
        try:
            coupon = stripe_api.Coupon.retrieve(coupon_id)
            if getattr(coupon, "valid", True):
                return {"discounts": [{"coupon": coupon_id}]}, "coupon", coupon_id, None
            return {}, None, None, f"coupon_invalid:{coupon_id}"
        except Exception as exc:
            print(f"[WARN] Cupón Stripe no válido ({coupon_id}): {exc}")
            return {}, None, None, f"coupon_lookup_failed:{exc}"

    promo_id = premium_promotion_code_id()
    if promo_id:
        return {"discounts": [{"promotion_code": promo_id}]}, "promotion_code", promo_id, None

    promo_code = premium_promotion_code_label()
    promo_id = lookup_stripe_promotion_code_id(stripe_api, promo_code)
    if promo_id:
        return {"discounts": [{"promotion_code": promo_id}]}, "promotion_code", promo_id, None

    return {}, None, None, f"promotion_code_not_found:{promo_code}"


def _stripe_discount_amount(session: Any) -> int:
    total_details = getattr(session, "total_details", None)
    if total_details is None:
        return 0
    return int(getattr(total_details, "amount_discount", 0) or 0)


def session_has_discount(session: Any, expected_subtotal_cents: Optional[int] = None) -> bool:
    if _stripe_discount_amount(session) > 0:
        return True
    if expected_subtotal_cents is None:
        return False
    subtotal = getattr(session, "amount_subtotal", None)
    if subtotal is None:
        return False
    return int(subtotal) < int(expected_subtotal_cents)


def _coupon_id_from_promotion_code(stripe_api: Any, promo_id: str) -> Optional[str]:
    try:
        promo = stripe_api.PromotionCode.retrieve(promo_id)
        coupon = getattr(promo, "coupon", None)
        if isinstance(coupon, str):
            return coupon
        if coupon is not None:
            return getattr(coupon, "id", None)
    except Exception as exc:
        print(f"[WARN] No se pudo leer cupón del promotion code {promo_id}: {exc}")
    return None


def inspect_premium_promotion_status(stripe_api: Any) -> Dict[str, Any]:
    """Diagnóstico para saber si el cupón/código Premium se puede aplicar."""
    status: Dict[str, Any] = {
        "enabled": is_membership_promotion_codes_enabled(),
        "auto_apply": is_auto_apply_premium_promo_enabled(),
        "promotion_code_label": premium_promotion_code_label(),
        "coupon_id_configured": bool(premium_coupon_id()),
        "resolved": False,
        "resolution_kind": None,
        "resolution_id": None,
        "error": None,
        "active_promotion_codes_sample": [],
    }

    if not stripe_api:
        status["error"] = "stripe_sdk_unavailable"
        return status

    kwargs, kind, ref_id, error = resolve_premium_promotion_discount(stripe_api)
    status["resolved"] = bool(kwargs.get("discounts"))
    status["resolution_kind"] = kind
    status["resolution_id"] = ref_id
    status["error"] = error

    try:
        page = stripe_api.PromotionCode.list(active=True, limit=10)
        status["active_promotion_codes_sample"] = [
            {"code": getattr(p, "code", ""), "id": getattr(p, "id", "")}
            for p in (page.data or [])
        ]
    except Exception as exc:
        status["active_promotion_codes_sample_error"] = str(exc)

    if ref_id and kind == "promotion_code":
        try:
            promo = stripe_api.PromotionCode.retrieve(ref_id)
            coupon = getattr(promo, "coupon", None)
            coupon_id = coupon if isinstance(coupon, str) else getattr(coupon, "id", None)
            status["promotion_code"] = {
                "id": ref_id,
                "code": getattr(promo, "code", None),
                "active": getattr(promo, "active", None),
                "times_redeemed": getattr(promo, "times_redeemed", None),
                "max_redemptions": getattr(promo, "max_redemptions", None),
                "coupon_id": coupon_id,
            }
            if coupon_id:
                coupon_obj = stripe_api.Coupon.retrieve(coupon_id)
                status["coupon"] = {
                    "id": coupon_id,
                    "valid": getattr(coupon_obj, "valid", None),
                    "percent_off": getattr(coupon_obj, "percent_off", None),
                    "amount_off": getattr(coupon_obj, "amount_off", None),
                    "duration": getattr(coupon_obj, "duration", None),
                    "applies_to": getattr(coupon_obj, "applies_to", None),
                    "currency": getattr(coupon_obj, "currency", None),
                }
        except Exception as exc:
            status["promotion_details_error"] = str(exc)

    if kwargs.get("discounts"):
        try:
            test_session = stripe_api.checkout.Session.create(
                mode="payment",
                success_url="https://guiaa.vet/payment-success?session_id={CHECKOUT_SESSION_ID}",
                cancel_url="https://guiaa.vet/membership",
                locale="es",
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "mxn",
                            "product_data": {"name": "Test Membresía Premium"},
                            "unit_amount": 220000,
                        },
                        "quantity": 1,
                    }
                ],
                discounts=kwargs["discounts"],
            )
            status["test_checkout"] = {
                "session_id": test_session.id,
                "amount_subtotal": getattr(test_session, "amount_subtotal", None),
                "amount_total": getattr(test_session, "amount_total", None),
                "amount_discount": _stripe_discount_amount(test_session),
                "discount_applied": session_has_discount(test_session, 220000),
                "promotion_ref": ref_id,
            }
            try:
                stripe_api.checkout.Session.expire(test_session.id)
            except Exception:
                pass
        except Exception as exc:
            status["test_checkout_error"] = str(exc)

    return status


def membership_promotion_checkout_kwargs(
    package_key: str,
    stripe_api: Any = None,
) -> Dict[str, Any]:
    """Descuento Premium: auto-aplica cupón/código o habilita ingreso manual."""
    if (package_key or "").strip().lower() != "premium":
        return {}
    if not is_membership_promotion_codes_enabled():
        return {}

    if is_auto_apply_premium_promo_enabled() and stripe_api is not None:
        kwargs, _, ref_id, error = resolve_premium_promotion_discount(stripe_api)
        if kwargs.get("discounts"):
            print(f"[INFO] Descuento Premium auto-aplicado ({ref_id})")
            return kwargs
        print(f"[WARN] No se auto-aplicó descuento Premium: {error}")

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
    Con descuento usa solo tarjeta (OXXO + cupón suele fallar en Stripe).
    """
    latam = build_stripe_checkout_session_kwargs(
        session_kwargs.pop("profile", None),
        currency=session_kwargs.get("currency")
        or _currency_from_line_items(session_kwargs.get("line_items")),
    )
    merged = {**session_kwargs, **latam}
    has_discounts = bool(merged.get("discounts"))

    if has_discounts:
        merged["payment_method_types"] = ["card"]
        merged.pop("payment_method_options", None)

    try:
        return stripe_api.checkout.Session.create(**merged)
    except Exception as primary_error:
        print(f"[WARN] Checkout Stripe falló: {primary_error}")

        if has_discounts:
            discounts = merged.get("discounts") or []
            promo_entry = next((d for d in discounts if d.get("promotion_code")), None)
            if promo_entry:
                coupon_id = _coupon_id_from_promotion_code(
                    stripe_api, promo_entry["promotion_code"]
                )
                if coupon_id:
                    coupon_attempt = {**merged, "discounts": [{"coupon": coupon_id}]}
                    try:
                        print(f"[INFO] Reintentando checkout con coupon {coupon_id}.")
                        return stripe_api.checkout.Session.create(**coupon_attempt)
                    except Exception as coupon_error:
                        print(f"[WARN] Checkout con coupon directo falló: {coupon_error}")

            manual = {**merged}
            manual.pop("discounts", None)
            manual["allow_promotion_codes"] = True
            manual["payment_method_types"] = ["card"]
            manual.pop("payment_method_options", None)
            try:
                print("[WARN] Checkout sin auto-descuento; cupón manual habilitado.")
                return stripe_api.checkout.Session.create(**manual)
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
