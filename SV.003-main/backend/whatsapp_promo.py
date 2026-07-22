"""Utilidades para campañas WhatsApp (wa.me) de ofertas GUIAA."""
from __future__ import annotations

import os
from typing import Any, Optional
from urllib.parse import quote

from email_notifications import _frontend_url

COUPON = "FRIENDS40"
DEFAULT_COUNTRY_CODE = "52"  # México
OFFER_IMAGE_PUBLIC_PATH = "/email/oferta-friends40-whatsapp.png"
OFFER_STORAGE_PATH = "email/oferta-friends40-whatsapp.png"
SKIP_SUFFIXES = ("@example.invalid", "@vetmed.com")
SKIP_EXACT = {
    "basico@guiaa.vet",
    "profesional@guiaa.vet",
    "premium@guiaa.vet",
}


def digits_only(raw: Any) -> str:
    return "".join(ch for ch in str(raw or "") if ch.isdigit())


def normalize_whatsapp_number(raw: Any, *, default_country: str = DEFAULT_COUNTRY_CODE) -> Optional[str]:
    """Normaliza a dígitos internacionales (sin +). None si no es usable."""
    digits = digits_only(raw)
    if len(digits) < 8:
        return None
    # Ya incluye país (MX 52 + 10, o códigos largos)
    if len(digits) >= 11:
        return digits
    # 10 dígitos locales MX → 52XXXXXXXXXX
    if len(digits) == 10 and default_country:
        return f"{default_country}{digits}"
    if len(digits) >= 8:
        return digits
    return None


def build_promo_message(nombre: str, *, coupon: str = COUPON) -> str:
    name = (nombre or "").strip() or "colega"
    app = _frontend_url()
    membership = f"{app}/?view=membership"
    return (
        f"Hola {name},\n\n"
        f"Por completar tu prueba en GUIAA tienes una oferta exclusiva:\n"
        f"*1 mes de Plan Premium con 40% de descuento*.\n\n"
        f"Cupón: *{coupon}*\n"
        f"Contrata aquí: {membership}\n\n"
        f"El descuento se aplica al pagar Premium.\n"
        f"— Equipo GUIAA"
    )


def whatsapp_deeplink(phone_digits: str, message: str) -> str:
    return f"https://wa.me/{phone_digits}?text={quote(message)}"


def offer_image_url() -> str:
    """CDN Storage si hay SUPABASE_URL; si no, asset en guiaa.vet."""
    base = (os.getenv("SUPABASE_URL") or "").strip().rstrip("/")
    if base:
        return f"{base}/storage/v1/object/public/uploads/{OFFER_STORAGE_PATH}"
    return f"{_frontend_url()}{OFFER_IMAGE_PUBLIC_PATH}"


def is_campaign_profile(profile: dict) -> bool:
    email = (profile.get("email") or "").strip().lower()
    if not email:
        return False
    if any(email.endswith(s) for s in SKIP_SUFFIXES):
        return False
    if email in SKIP_EXACT:
        return False
    return True


def build_recipient(profile: dict) -> Optional[dict]:
    if not is_campaign_profile(profile):
        return None
    phone_raw = (profile.get("telefono") or "").strip()
    phone = normalize_whatsapp_number(phone_raw)
    nombre = (profile.get("nombre") or "").strip() or "colega"
    message = build_promo_message(nombre)
    return {
        "id": profile.get("id"),
        "email": (profile.get("email") or "").strip().lower(),
        "nombre": nombre,
        "telefono": phone_raw or None,
        "whatsapp_number": phone,
        "has_whatsapp": bool(phone),
        "message": message,
        "whatsapp_url": whatsapp_deeplink(phone, message) if phone else None,
    }
