#!/usr/bin/env python3
"""Regenera la imagen fallback de oferta Premium (1080×1080).

Uso:
  cd backend
  python3 scripts/generate_promo_offer_image.py
"""
from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Instala Pillow: pip install pillow", file=sys.stderr)
    raise SystemExit(1)

ROOT = Path(__file__).resolve().parents[2]
LOGO = ROOT / "frontend/public/brand/GuiaaLogo-on-dark.png"
OUT = ROOT / "frontend/public/promotions/premium-offer-1080.png"


def main() -> int:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    w = h = 1080
    img = Image.new("RGB", (w, h), "#0c2d4d")
    draw = ImageDraw.Draw(img)

    for y in range(h):
        t = y / h
        r = int(12 + (38 - 12) * t)
        g = int(45 + (91 - 45) * t)
        b = int(77 + (147 - 77) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    draw.rounded_rectangle((72, 180, 936, 900), radius=36, fill="#0a243f")
    draw.rounded_rectangle((72, 180, 936, 900), radius=36, outline="#3d9b8f", width=3)

    if LOGO.exists():
        logo = Image.open(LOGO).convert("RGBA")
        logo.thumbnail((280, 120), Image.Resampling.LANCZOS)
        img.paste(logo, ((w - logo.width) // 2, 110), logo)

    try:
        font_h = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 54)
        font_b = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        font_m = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        font_c = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 42)
        font_s = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
    except OSError:
        font_h = font_b = font_m = font_c = font_s = ImageFont.load_default()

    def center_text(text: str, y: int, font, fill: str = "#ffffff") -> None:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        draw.text(((w - tw) // 2, y), text, font=font, fill=fill)

    center_text("Oferta exclusiva", 280, font_h)
    center_text("por completar tu prueba", 350, font_h)
    draw.rounded_rectangle((390, 440, 690, 510), radius=24, fill="#3d9b8f")
    center_text("Plan Premium", 455, font_m, "#0c2d4d")
    center_text("Cupón", 560, font_s, "#9fb6cc")
    draw.rounded_rectangle((300, 600, 780, 690), radius=16, fill="#265B93")
    center_text("FRIENDS40", 620, font_c)
    center_text("Contratar en guiaa.vet", 760, font_b, "#e8eef5")
    center_text("Software clínico veterinario", 830, font_s, "#7f97ad")

    img.save(OUT, "PNG", optimize=True)
    print(f"Escrito: {OUT}")
    print("URL producción: https://guiaa.vet/promotions/premium-offer-1080.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
