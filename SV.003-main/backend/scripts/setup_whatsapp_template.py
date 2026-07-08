#!/usr/bin/env python3
"""Registra la plantilla WhatsApp guiaa_promo_oferta en Meta Business Manager.

Uso:
  cd backend
  python3 scripts/setup_whatsapp_template.py
  python3 scripts/setup_whatsapp_template.py --list
  python3 scripts/setup_whatsapp_template.py --create

Variables en backend/.env:
  WHATSAPP_BUSINESS_ACCOUNT_ID   (WABA ID, no confundir con phone_number_id)
  WHATSAPP_ACCESS_TOKEN          (token con whatsapp_business_management)
  WHATSAPP_PHONE_NUMBER_ID       (para envíos)
  WHATSAPP_PROMO_TEMPLATE=guiaa_promo_oferta
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

import whatsapp_notifications  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Setup plantilla WhatsApp GUIAA promo")
    parser.add_argument("--list", action="store_true", help="Listar plantillas existentes")
    parser.add_argument("--create", action="store_true", help="Crear plantilla guiaa_promo_oferta")
    parser.add_argument("--spec", action="store_true", help="Mostrar JSON de la plantilla")
    args = parser.parse_args()

    status = whatsapp_notifications.get_whatsapp_config_status()
    print("Estado WhatsApp:", json.dumps(status, indent=2, ensure_ascii=False))

    if args.spec or (not args.list and not args.create):
        print("\n--- Especificación plantilla ---")
        print(json.dumps(whatsapp_notifications.WHATSAPP_PROMO_TEMPLATE_SPEC, indent=2, ensure_ascii=False))
        print(
            "\nPasos manuales en Meta Business Manager (si --create falla por permisos):\n"
            "1. business.facebook.com → WhatsApp Manager → Plantillas de mensajes\n"
            "2. Crear plantilla MARKETING, idioma Español (México)\n"
            "3. Nombre: guiaa_promo_oferta\n"
            "4. Encabezado: Imagen (variable)\n"
            "5. Cuerpo: usar el texto del spec con {{1}} {{2}} {{3}}\n"
            "6. Pie: GUIAA — software clínico veterinario\n"
            "7. Botón URL: Ver oferta → https://guiaa.vet/app/membership\n"
        )

    if args.list:
        templates, err = whatsapp_notifications.list_whatsapp_templates()
        if err:
            print(f"\nError listando: {err}")
            return 1
        print(f"\nPlantillas ({len(templates)}):")
        for tpl in templates:
            print(f"  - {tpl.get('name')} [{tpl.get('status')}] lang={tpl.get('language')}")
        return 0

    if args.create:
        templates, list_err = whatsapp_notifications.list_whatsapp_templates()
        if not list_err:
            for tpl in templates:
                if tpl.get("name") == "guiaa_promo_oferta":
                    print("\nLa plantilla guiaa_promo_oferta ya existe.")
                    return 0

        result, err = whatsapp_notifications.create_whatsapp_promo_template()
        if err:
            print(f"\nError creando plantilla: {err}")
            print("Usa los pasos manuales impresos arriba o verifica permisos del token.")
            return 1
        print("\nPlantilla enviada a revisión Meta:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("\nEspera aprobación (suele tardar minutos u horas) antes de enviar promos.")
        return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
