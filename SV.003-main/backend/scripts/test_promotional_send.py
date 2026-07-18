#!/usr/bin/env python3
"""Prueba envío promocional a un email y/o teléfono.

Uso:
  cd backend
  python3 scripts/test_promotional_send.py --email vet@ejemplo.com
  python3 scripts/test_promotional_send.py --phone 5512345678
  python3 scripts/test_promotional_send.py --email vet@ejemplo.com --phone 5512345678
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

load_dotenv(backend_dir / ".env", override=False)

import canva_offers  # noqa: E402
import email_notifications  # noqa: E402
import trial_survey  # noqa: E402
import whatsapp_notifications  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Prueba promo GUIAA")
    parser.add_argument("--email", default="", help="Email destino")
    parser.add_argument("--phone", default="", help="Teléfono destino (10 dígitos MX)")
    parser.add_argument("--nombre", default="Colega", help="Nombre para personalizar")
    args = parser.parse_args()

    email = args.email.strip()
    phone = args.phone.strip()
    if not email and not phone:
        print("Indica --email y/o --phone")
        return 1

    offer = trial_survey.build_premium_offer()
    image_url, img_err, source = canva_offers.generate_offer_image(offer)
    print("Oferta:", json.dumps(offer, indent=2, ensure_ascii=False))
    print(f"Imagen ({source}): {image_url or '—'}")
    if img_err:
        print(f"Imagen nota: {img_err}")

    errors = 0
    if email:
        err = email_notifications.send_promotional_email(
            to_addr=email,
            nombre=args.nombre,
            offer=offer,
            image_url=image_url,
            segment="test",
        )
        if err:
            print(f"Email error: {err}")
            errors += 1
        else:
            print(f"Email enviado a {email}")

    if phone:
        ext_id, wa_err = whatsapp_notifications.send_promotional_whatsapp(
            to_phone=phone,
            offer=offer,
            image_url=image_url,
        )
        if wa_err:
            print(f"WhatsApp error: {wa_err}")
            errors += 1
        else:
            print(f"WhatsApp enviado id={ext_id}")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
