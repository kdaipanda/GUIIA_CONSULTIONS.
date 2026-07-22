#!/usr/bin/env python3
"""Verifica configuración de promociones (Railway / .env local).

Uso:
  cd backend
  python3 scripts/check_promo_config.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

load_dotenv(backend_dir / ".env", override=False)

import canva_offers  # noqa: E402
import email_notifications  # noqa: E402
import promotions_service  # noqa: E402
import whatsapp_notifications  # noqa: E402


def _ok(label: str, condition: bool, hint: str = "") -> None:
    mark = "✓" if condition else "✗"
    print(f"  {mark} {label}" + (f" — {hint}" if hint and not condition else ""))


def main() -> int:
    print("=== GUIAA promociones — checklist ===\n")

    email_status = email_notifications.get_email_config_status()
    wa_status = whatsapp_notifications.get_whatsapp_config_status()
    canva_status = canva_offers.get_canva_config_status()

    print("Email (Resend/SMTP)")
    _ok("Configurado", email_status["configured"], "Define RESEND_API_KEY o SMTP_*")
    print(f"    from: {email_status.get('from_address')}")

    print("\nWhatsApp")
    _ok("Phone + token", wa_status["configured"], "WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN")
    _ok(
        "WABA ID (crear plantillas)",
        bool(os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "").strip()),
        "WHATSAPP_BUSINESS_ACCOUNT_ID",
    )
    print(f"    template: {wa_status.get('default_template') or 'guiaa_promo_oferta (default)'}")

    print("\nCanva")
    _ok("API completa", canva_status["configured"], "CANVA_CLIENT_* + REFRESH + OFFER_TEMPLATE_ID")
    fallback = canva_status.get("fallback_image_url")
    _ok("Fallback imagen", bool(fallback), "PROMO_OFFER_IMAGE_URL")
    if fallback:
        print(f"    fallback: {fallback}")

    print("\nAutomatización trial")
    auto = promotions_service.is_auto_trial_promo_enabled()
    channels = promotions_service.auto_trial_promo_channels()
    _ok("PROMO_AUTO_TRIAL_EXHAUSTED", auto, "Pon true para enviar al agotar prueba")
    print(f"    canales: {', '.join(channels)}")

    ready_email = email_status["configured"] and bool(fallback or canva_status["configured"])
    ready_wa = ready_email and wa_status["configured"]

    print("\n=== Resultado ===")
    if ready_email:
        print("✓ Listo para email promocional (con imagen Canva o fallback).")
    else:
        print("✗ Falta email y/o imagen (Canva o PROMO_OFFER_IMAGE_URL).")
    if ready_wa:
        print("✓ Listo para WhatsApp (verifica que la plantilla esté Approved).")
    else:
        print("○ WhatsApp pendiente (opcional para el primer día).")

    print("\nSiguiente paso: ver CONFIGURAR_PROMOCIONES_RAILWAY_CANVA.md")
    return 0 if ready_email else 1


if __name__ == "__main__":
    raise SystemExit(main())
