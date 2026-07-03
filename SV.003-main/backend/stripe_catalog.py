"""Catálogo Stripe Live: productos y precios para Checkout (cupones con applies_to)."""
from __future__ import annotations

import os
from typing import Any, Dict, Optional, Tuple

# Productos GUIAA en Stripe Live (ver verify_stripe_products.py)
STRIPE_PRODUCT_IDS: Dict[Tuple[str, str], str] = {
    ("basic", "monthly"): "prod_Tkyhwtc3i3FYCc",
    ("professional", "monthly"): "prod_Tl0PjbQF0p1y5d",
    ("premium", "monthly"): "prod_Tl0SrURr1CLGkd",
    ("basic", "annual"): "prod_Tl0XHV0d7lpeCh",
    ("professional", "annual"): "prod_Tl0ZcYwvyujM4P",
    ("premium", "annual"): "prod_Tl0cuUrxfLTPmj",
}

STRIPE_CREDITS_PRODUCT_ID = "prod_Tl0fjBTflSJtHh"


def stripe_price_env_key(package_key: str, billing_cycle: str) -> str:
    return f"STRIPE_PRICE_{(package_key or '').upper()}_{(billing_cycle or '').upper()}"


def stripe_product_id(package_key: str, billing_cycle: str) -> Optional[str]:
    return STRIPE_PRODUCT_IDS.get(((package_key or "").strip().lower(), (billing_cycle or "").strip().lower()))


def resolve_stripe_price_id(
    stripe_api: Any,
    package_key: str,
    billing_cycle: str,
    currency: str,
    unit_amount_cents: int,
) -> Optional[str]:
    """Price ID explícito (env) o el precio activo del producto que coincide en monto."""
    env_price = os.getenv(stripe_price_env_key(package_key, billing_cycle), "").strip()
    if env_price:
        return env_price

    product_id = stripe_product_id(package_key, billing_cycle)
    if not product_id or stripe_api is None:
        return None

    try:
        result = stripe_api.Price.list(product=product_id, active=True, limit=20)
        target_currency = (currency or "mxn").lower()
        for price in result.data or []:
            if (getattr(price, "currency", "") or "").lower() != target_currency:
                continue
            if int(getattr(price, "unit_amount", 0) or 0) == int(unit_amount_cents):
                return getattr(price, "id", None)
    except Exception as exc:
        print(f"[WARN] No se pudo listar precios de {product_id}: {exc}")

    return None


def build_membership_line_item(
    package_key: str,
    billing_cycle: str,
    *,
    package_name: str,
    currency: str,
    unit_amount_cents: int,
    stripe_api: Any = None,
    metadata: Optional[dict] = None,
) -> Dict[str, Any]:
    """
    Line item de membresía atado al producto Stripe existente.
    Los cupones con restricción applies_to.products no aplican a price_data dinámico.
    """
    price_id = resolve_stripe_price_id(
        stripe_api, package_key, billing_cycle, currency, unit_amount_cents
    )
    if price_id:
        return {"price": price_id, "quantity": 1}

    product_id = stripe_product_id(package_key, billing_cycle)
    if product_id:
        return {
            "price_data": {
                "currency": currency,
                "product": product_id,
                "unit_amount": unit_amount_cents,
            },
            "quantity": 1,
        }

    product_data: Dict[str, Any] = {"name": f"Membresía {package_name}"}
    if metadata:
        product_data["metadata"] = metadata
    return {
        "price_data": {
            "currency": currency,
            "product_data": product_data,
            "unit_amount": unit_amount_cents,
        },
        "quantity": 1,
    }


def build_credits_line_item(
    *,
    package_name: str,
    currency: str,
    unit_amount_cents: int,
    quantity: int = 1,
    stripe_api: Any = None,
) -> Dict[str, Any]:
    env_price = os.getenv("STRIPE_PRICE_CREDITS_10", "").strip()
    if env_price:
        return {"price": env_price, "quantity": max(1, quantity)}

    if stripe_api and STRIPE_CREDITS_PRODUCT_ID:
        try:
            result = stripe_api.Price.list(product=STRIPE_CREDITS_PRODUCT_ID, active=True, limit=10)
            target_currency = (currency or "mxn").lower()
            for price in result.data or []:
                if (getattr(price, "currency", "") or "").lower() != target_currency:
                    continue
                if int(getattr(price, "unit_amount", 0) or 0) == int(unit_amount_cents):
                    return {"price": price.id, "quantity": max(1, quantity)}
        except Exception as exc:
            print(f"[WARN] No se pudo listar precios de créditos: {exc}")

        return {
            "price_data": {
                "currency": currency,
                "product": STRIPE_CREDITS_PRODUCT_ID,
                "unit_amount": unit_amount_cents,
            },
            "quantity": max(1, quantity),
        }

    return {
        "price_data": {
            "currency": currency,
            "product_data": {"name": package_name},
            "unit_amount": unit_amount_cents,
        },
        "quantity": max(1, quantity),
    }
