"""Procesa logos GUIAA: versión clara (fondos claros) y versión on-dark."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "frontend" / "public" / "brand" / "GuiaaLogo-source.png"
SRC_DARK_OFFICIAL = Path(
    r"C:\Users\kdaip\.cursor\projects\f-Versiones-SV-003-main\assets"
    r"\c__Users_kdaip_AppData_Roaming_Cursor_User_workspaceStorage_c3cb2fe860770f94c174d6f2de474a57_images_Logo_Guiia_Oficial_Positivo_1-5a29bc3f-8340-4bb1-ae47-f796b7253019.png"
)
PUB = ROOT / "frontend" / "public"
BRAND_DIR = PUB / "brand"

OUT_LIGHT = [
    "GuiaaLogo-full.png",
    "GuiaLogo.png",
    "guiaa-logo.png",
    "GuiaLogo-mark.png",
]
OUT_DARK = "GuiaaLogo-full-light.png"

NAVY = (38, 91, 147)
ON_DARK_INK = (248, 250, 252)
ON_DARK_TEAL = (94, 234, 212)
ON_DARK_MUTED = (203, 213, 225)


def is_near_white(r: int, g: int, b: int, a: int, tol: int = 30) -> bool:
    if a < 10:
        return True
    return r >= 255 - tol and g >= 255 - tol and b >= 255 - tol


def is_near_black(r: int, g: int, b: int, a: int, tol: int = 32) -> bool:
    if a < 10:
        return True
    return r <= tol and g <= tol and b <= tol


def flood_remove_edge_white(img: Image.Image, tol: int = 30) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if is_near_white(*px[x, y], tol):
                visited[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not visited[y][x] and is_near_white(*px[x, y], tol):
                visited[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                if is_near_white(*px[nx, ny], tol):
                    visited[ny][nx] = True
                    q.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if visited[y][x]:
                px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)
    return img


def flood_remove_edge_black(img: Image.Image, tol: int = 32) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if is_near_black(*px[x, y], tol):
                visited[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not visited[y][x] and is_near_black(*px[x, y], tol):
                visited[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                if is_near_black(*px[nx, ny], tol):
                    visited[ny][nx] = True
                    q.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if visited[y][x]:
                px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)
    return img


def _is_text_white(r: int, g: int, b: int, a: int) -> bool:
    return a > 50 and r > 215 and g > 215 and b > 215


def fix_text_zone_whites(img: Image.Image, text_start_ratio: float = 0.68) -> Image.Image:
    """Vacía counters y blancos residuales dentro del wordmark."""
    img = img.copy()
    w, h = img.size
    px = img.load()
    y0 = int(h * text_start_ratio)

    for y in range(y0, h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 50 and r > 215 and g > 215 and b > 215:
                px[x, y] = (r, g, b, 0)

    return img


def trim(img: Image.Image, pad: int = 10) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(img.width, r + pad)
    b = min(img.height, b + pad)
    return img.crop((l, t, r, b))


def _pixel_kind(r: int, g: int, b: int, a: int) -> str:
    if a < 20:
        return "transparent"
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    if lum > 235:
        return "white"
    if lum < 42:
        return "black"
    if g > r + 28 and g > 115 and b > 95:
        return "teal"
    if b > r + 12 and b > 85 and r < 125:
        return "navy"
    return "other"


def make_dark_mode_variant(img: Image.Image) -> Image.Image:
    """Versión clara para fondos oscuros (navy → blanco, teal brillante)."""
    out = img.copy()
    px = out.load()
    w, h = out.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            kind = _pixel_kind(r, g, b, a)
            if kind == "transparent":
                continue
            if kind == "white":
                continue
            if kind == "teal":
                px[x, y] = (*ON_DARK_TEAL, a)
            elif kind == "black":
                px[x, y] = (*ON_DARK_MUTED, a)
            else:
                px[x, y] = (*ON_DARK_INK, a)

    return out


def is_valid_logo_image(img: Image.Image) -> bool:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    buckets: set[tuple[int, int, int]] = set()
    visible = 0

    for y in range(0, h, 2):
        for x in range(0, w, 2):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            visible += 1
            buckets.add((r // 24, g // 24, b // 24))

    return visible > 500 and len(buckets) >= 4


def load_official_dark_logo() -> Image.Image | None:
    if not SRC_DARK_OFFICIAL.exists():
        return None

    img = Image.open(SRC_DARK_OFFICIAL).convert("RGBA")
    if not is_valid_logo_image(img):
        return None

    corners = [img.getpixel((0, 0)), img.getpixel((img.width - 1, 0))]
    if all(sum(c[:3]) < 90 for c in corners):
        img = flood_remove_edge_black(img)
    else:
        img = flood_remove_edge_white(img)

    return trim(img)


def make_favicon(img: Image.Image, pub: Path) -> None:
    ow, oh = img.size
    mark = img.crop((int(ow * 0.08), 0, int(ow * 0.92), int(oh * 0.62)))
    mark = trim(mark, pad=4)
    mark = mark.resize((192, 192), Image.Resampling.LANCZOS)
    mark.save(pub / "favicon.png", optimize=True)

    fav_dark = make_dark_mode_variant(mark)
    fav_dark.save(pub / "favicon-light.png", optimize=True)


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"No se encontró el archivo fuente: {SRC}")

    base = Image.open(SRC)
    clean = trim(fix_text_zone_whites(flood_remove_edge_white(base)))
    official_dark = load_official_dark_logo()
    dark = official_dark if official_dark is not None else make_dark_mode_variant(clean)

    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    dark.save(BRAND_DIR / "GuiaaLogo-on-dark.png", optimize=True)

    for name in OUT_LIGHT:
        clean.save(PUB / name, optimize=True)
    dark.save(PUB / OUT_DARK, optimize=True)
    make_favicon(clean, PUB)

    source = "oficial" if official_dark is not None else "generado"
    print("light", clean.size)
    print("dark", dark.size, f"({source})")
    print("saved to", PUB)


if __name__ == "__main__":
    main()
