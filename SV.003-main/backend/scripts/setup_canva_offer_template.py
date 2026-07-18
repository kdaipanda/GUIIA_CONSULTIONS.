#!/usr/bin/env python3
"""Configura y prueba la plantilla Canva para ofertas GUIAA.

Uso:
  cd backend
  python3 scripts/setup_canva_offer_template.py
  python3 scripts/setup_canva_offer_template.py --list-templates
  python3 scripts/setup_canva_offer_template.py --test-image

Variables en backend/.env:
  CANVA_CLIENT_ID
  CANVA_CLIENT_SECRET
  CANVA_REFRESH_TOKEN
  CANVA_OFFER_TEMPLATE_ID    (ID de brand template tras crear en Canva)
  PROMO_OFFER_IMAGE_URL      (fallback opcional)
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
import trial_survey  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Setup plantilla Canva ofertas GUIAA")
    parser.add_argument("--list-templates", action="store_true", help="Listar brand templates")
    parser.add_argument("--test-image", action="store_true", help="Generar imagen de prueba")
    parser.add_argument("--spec", action="store_true", help="Mostrar brief de diseño")
    args = parser.parse_args()

    status = canva_offers.get_canva_config_status()
    print("Estado Canva:", json.dumps(status, indent=2, ensure_ascii=False))

    if args.spec or (not args.list_templates and not args.test_image):
        print("\n--- Brief diseño plantilla GUIAA ---")
        print(json.dumps(canva_offers.OFFER_TEMPLATE_DESIGN_SPEC, indent=2, ensure_ascii=False))
        print(
            "\nPasos en Canva:\n"
            "1. canva.com → Crear diseño 1080×1080 px\n"
            "2. Aplicar colores GUIAA (navy #0c2d4d, blue #265B93, green #3d9b8f)\n"
            "3. Añadir logo GUIAA y textos con estos nombres de campo data:\n"
            f"   {', '.join(canva_offers.OFFER_TEMPLATE_FIELDS)}\n"
            "4. Publicar como Brand Template (Canva Enterprise/Teams + Connect API)\n"
            "5. Copiar brand_template_id → CANVA_OFFER_TEMPLATE_ID en .env\n"
            "6. Conectar app en developers.canva.com → OAuth → refresh token\n"
        )

    if args.list_templates:
        if not canva_offers.is_canva_configured():
            print("\nConfigura CANVA_* en .env antes de listar plantillas.")
            return 1
        templates, err = canva_offers.list_brand_templates()
        if err:
            print(f"\nError: {err}")
            return 1
        print(f"\nBrand templates ({len(templates)}):")
        for tpl in templates:
            tid = tpl.get("id") or tpl.get("brand_template_id")
            title = tpl.get("title") or tpl.get("name") or "—"
            print(f"  - {title}  id={tid}")
        return 0

    if args.test_image:
        offer = trial_survey.build_premium_offer()
        url, err, source = canva_offers.generate_offer_image(offer)
        print(f"\nImagen ({source}): {url or '—'}")
        if err:
            print(f"Nota: {err}")
        return 0 if url else 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
