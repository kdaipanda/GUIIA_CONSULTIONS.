#!/usr/bin/env python3
"""Genera QR PNG para el kit de visitas clínicas.

Uso:
  cd SV.003-main/field-kit/clinic-visits
  python3 scripts/generate_qr.py
  python3 scripts/generate_qr.py --city cdmx --week w30
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "qr" / "generated"


def build_urls(city: str, week: str) -> dict[str, str]:
    campaign = f"clinic_visit_{city}_{week}"
    base_q = {
        "utm_source": "clinic_visit",
        "utm_medium": "qr",
        "utm_campaign": campaign,
    }
    register = "https://guiaa.vet/?" + urlencode(base_q)
    membership_q = {
        **base_q,
        "promo": "FRIENDS40",
    }
    membership = "https://guiaa.vet/app/membership?" + urlencode(membership_q)
    wa_text = (
        "Hola GUIAA, me visitaron en la clínica y quiero la prueba de 3 consultas"
    )
    whatsapp = "https://wa.me/525620690369?" + urlencode({"text": wa_text})
    return {
        "register": register,
        "membership": membership,
        "whatsapp": whatsapp,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--city", default="cdmx")
    parser.add_argument("--week", default="w30")
    args = parser.parse_args()

    try:
        import qrcode
    except ImportError:
        print("Instalando qrcode…")
        import subprocess

        subprocess.check_call([sys.executable, "-m", "pip", "install", "qrcode[pil]", "-q"])
        import qrcode

    OUT.mkdir(parents=True, exist_ok=True)
    urls = build_urls(args.city.lower(), args.week.lower())
    for name, url in urls.items():
        img = qrcode.make(url)
        path = OUT / f"{name}.png"
        img.save(path)
        print(f"{name}: {path}")
        print(f"  → {url}")

    print(f"\nListo. Insertados en print/*.html como qr/generated/register.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
