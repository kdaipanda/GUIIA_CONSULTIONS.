"""Recorta mascotas con fondo transparente para la landing (rembg)."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image
from rembg import remove

PETS_DIR = Path(__file__).resolve().parents[1] / "public" / "landing" / "pets"

SOURCES = [
    ("dog-golden.jpg", "dog-golden.png"),
    ("cat-tabby.jpg", "cat-tabby.png"),
    ("puppy.jpg", "puppy.png"),
    ("corgi.jpg", "corgi.png"),
    ("cat-ginger.jpg", "cat-ginger.png"),
    ("cat-black.jpg", "cat-black.png"),
]


def trim_transparent(image: Image.Image, padding: int = 12) -> Image.Image:
    if image.mode != "RGBA":
        image = image.convert("RGBA")
    bbox = image.getbbox()
    if not bbox:
        return image
    cropped = image.crop(bbox)
    if padding <= 0:
        return cropped
    w, h = cropped.size
    canvas = Image.new("RGBA", (w + padding * 2, h + padding * 2), (0, 0, 0, 0))
    canvas.paste(cropped, (padding, padding), cropped)
    return canvas


def process_one(source_name: str, output_name: str) -> None:
    source = PETS_DIR / source_name
    output = PETS_DIR / output_name
    if not source.exists():
        print(f"SKIP missing: {source}", file=sys.stderr)
        return

    raw = source.read_bytes()
    cutout = remove(raw)
    image = Image.open(__import__("io").BytesIO(cutout)).convert("RGBA")
    image = trim_transparent(image, padding=10)
    image.save(output, format="PNG", optimize=True)
    print(f"OK {output_name} ({image.size[0]}x{image.size[1]})")


def export_webp(png_path: Path) -> None:
    webp_path = png_path.with_suffix(".webp")
    image = Image.open(png_path).convert("RGBA")
    image.save(webp_path, format="WEBP", quality=86, method=6)
    print(f"WEBP {webp_path.name}")


def main() -> int:
    PETS_DIR.mkdir(parents=True, exist_ok=True)
    for source, output in SOURCES:
        process_one(source, output)
    for _source, output in SOURCES:
        png = PETS_DIR / output
        if png.exists():
            export_webp(png)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
