#!/usr/bin/env python3
"""Recordatorio del cupón FRIENDS40 (Premium 40% dto, 1 mes).

Uso:
  python scripts/send_friends40_promo_emails.py --dry-run
  python scripts/send_friends40_promo_emails.py --send
  python scripts/send_friends40_promo_emails.py --send --only soporte@guiaa.vet
"""
from __future__ import annotations

import argparse
import base64
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from email_notifications import (  # noqa: E402
    DEFAULT_SUPPORT_NOTIFY_EMAIL,
    _frontend_url,
    _mail_from,
    _reply_to,
    is_email_configured,
)
from supabase_client import list_profiles, upload_bytes_to_storage  # noqa: E402

try:
    import httpx
except ImportError:  # pragma: no cover
    httpx = None

SKIP_SUFFIXES = ("@example.invalid", "@vetmed.com")
SKIP_EXACT = {
    "basico@guiaa.vet",
    "profesional@guiaa.vet",
    "premium@guiaa.vet",
}

COUPON = "FRIENDS40"
IMAGE_CANDIDATES = [
    Path(__file__).resolve().parents[2]
    / "frontend"
    / "public"
    / "email"
    / "oferta-friends40.png",
    Path(
        r"C:\Users\kdaip\.cursor\projects\f-Versiones-SV-003-main\assets"
        r"\c__Users_kdaip_AppData_Roaming_Cursor_User_workspaceStorage_"
        r"c3cb2fe860770f94c174d6f2de474a57_images_Oferta-98dfa42e-d006-43d0-8dff-67a36ed23791.png"
    ),
]


def collect_recipients() -> list[dict]:
    profiles, err = list_profiles(limit=5000)
    if err:
        raise RuntimeError(err)
    out: list[dict] = []
    seen: set[str] = set()
    for profile in profiles or []:
        email = (profile.get("email") or "").strip().lower()
        if not email or email in seen:
            continue
        if any(email.endswith(s) for s in SKIP_SUFFIXES):
            continue
        if email in SKIP_EXACT:
            continue
        seen.add(email)
        out.append(
            {
                "email": email,
                "nombre": (profile.get("nombre") or "").strip() or "colega",
                "status": profile.get("cedula_verification_status") or "none",
                "rem": profile.get("consultations_remaining"),
            }
        )
    out.sort(key=lambda r: r["email"])
    return out


def resolve_image_path() -> Path:
    for path in IMAGE_CANDIDATES:
        if path.is_file():
            return path
    raise FileNotFoundError(
        "No se encontró oferta-friends40.png. "
        "Cópiala a frontend/public/email/oferta-friends40.png"
    )


def ensure_image_url(image_path: Path) -> str:
    """Sube la imagen a Storage público si hace falta y devuelve URL estable."""
    data = image_path.read_bytes()
    public_url, err = upload_bytes_to_storage(
        "uploads",
        "email/oferta-friends40.png",
        data,
        "image/png",
    )
    if err and "already exists" not in (err or "").lower() and "Duplicate" not in (err or ""):
        # Reintento: algunos SDKs fallan en overwrite; intentar get_public_url via re-upload upsert
        public_url2, err2 = upload_bytes_to_storage(
            "uploads",
            f"email/oferta-friends40-{int(time.time())}.png",
            data,
            "image/png",
        )
        if err2:
            raise RuntimeError(f"No se pudo subir imagen: {err} / {err2}")
        return public_url2 or ""
    if public_url:
        return public_url
    # Fallback CDN app (tras deploy de public/)
    return f"{_frontend_url()}/email/oferta-friends40.png"


def build_message(nombre: str, image_url: str) -> tuple[str, str, str]:
    app_url = _frontend_url()
    membership_url = f"{app_url}/?view=membership"
    support = DEFAULT_SUPPORT_NOTIFY_EMAIL
    subject = f"Oferta exclusiva: {COUPON} — Premium al 40% por 1 mes"
    text = (
        f"Hola {nombre},\n\n"
        f"Por completar tu prueba en GUIAA, tienes una oferta exclusiva:\n"
        f"1 mes de Plan Premium con 40% de descuento.\n\n"
        f"Código: {COUPON}\n"
        f"Contratar: {membership_url}\n\n"
        f"El descuento se aplica al pagar Premium (o escríbelo en el checkout).\n\n"
        f"¿Dudas? Escríbenos a {support}.\n\n"
        f"— Equipo GUIAA\n"
    )
    html = f"""
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#0c2d4d;
                max-width:560px;margin:0 auto;background:#f7fafc;padding:24px 16px">
      <p style="margin:0 0 16px;font-size:15px">Hola {nombre},</p>
      <p style="margin:0 0 20px;font-size:15px">
        Por completar tu prueba, te recordamos tu oferta exclusiva:
        <strong>1 mes de Plan Premium con 40% de descuento</strong>.
      </p>
      <a href="{membership_url}" style="display:block;text-decoration:none">
        <img src="{image_url}" alt="GUIAA — Oferta Plan Premium, cupón {COUPON}"
             width="560" style="display:block;width:100%;max-width:560px;height:auto;
             border:0;border-radius:12px"/>
      </a>
      <p style="margin:20px 0 8px;font-size:15px;text-align:center">
        Código:
        <strong style="letter-spacing:0.08em;font-size:18px;color:#0c2d4d">{COUPON}</strong>
      </p>
      <p style="margin:16px 0 24px;text-align:center">
        <a href="{membership_url}"
           style="display:inline-block;background:#0c2d4d;color:#fff;text-decoration:none;
                  padding:12px 22px;border-radius:999px;font-weight:600">
          Contratar Premium en guiaa.vet
        </a>
      </p>
      <p style="font-size:12px;color:#64748b;text-align:center;margin:0">
        El descuento se aplica automáticamente al pagar Premium.<br/>
        ¿Dudas? <a href="mailto:{support}">{support}</a> — Equipo GUIAA
      </p>
    </div>
    """
    return subject, html, text


def send_resend_with_optional_attachment(
    to_email: str,
    subject: str,
    html: str,
    text: str,
    attachment_path: Path | None = None,
) -> str | None:
    """Envía vía Resend; opcionalmente adjunta PNG (clientes que bloquean imágenes remotas)."""
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    if not api_key or httpx is None:
        return "Resend no configurado"
    payload: dict = {
        "from": _mail_from(),
        "to": [to_email],
        "subject": subject,
        "html": html,
        "text": text,
    }
    reply_to = _reply_to()
    if reply_to:
        payload["reply_to"] = reply_to
    if attachment_path and attachment_path.is_file():
        payload["attachments"] = [
            {
                "filename": "oferta-friends40.png",
                "content": base64.b64encode(attachment_path.read_bytes()).decode("ascii"),
            }
        ]
    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=30.0,
        )
        if response.status_code >= 400:
            return f"Resend {response.status_code}: {response.text[:300]}"
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Solo listar destinatarios")
    parser.add_argument("--send", action="store_true", help="Enviar correos de verdad")
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        help="Limitar a estos emails (se puede repetir)",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.35,
        help="Pausa entre envíos (segundos)",
    )
    parser.add_argument(
        "--attach",
        action="store_true",
        help="Adjuntar también el PNG al correo",
    )
    args = parser.parse_args()

    if not args.dry_run and not args.send:
        print("Usa --dry-run o --send")
        return 2

    if args.send and not is_email_configured():
        print("Email no configurado (RESEND_API_KEY / SMTP).")
        return 1

    recipients = collect_recipients()
    if args.only:
        allow = {e.strip().lower() for e in args.only if e.strip()}
        recipients = [r for r in recipients if r["email"] in allow]

    image_path = resolve_image_path()
    print(f"Imagen: {image_path} ({image_path.stat().st_size} bytes)")

    image_url = ""
    if args.send or args.dry_run:
        try:
            image_url = ensure_image_url(image_path)
            print(f"URL imagen: {image_url}")
        except Exception as exc:  # noqa: BLE001
            if args.send:
                raise
            print(f"AVISO imagen (dry-run): {exc}")
            image_url = f"{_frontend_url()}/email/oferta-friends40.png"

    print(f"Cupón: {COUPON} | Destinatarios: {len(recipients)}")
    for i, row in enumerate(recipients, 1):
        print(
            f"  {i:2}. {row['email']} | {row['nombre'][:40]} | "
            f"{row['status']} | rem={row['rem']}"
        )

    if args.dry_run:
        print("\nDRY-RUN: no se envió ningún correo.")
        return 0

    ok = 0
    fail = 0
    attach = image_path if args.attach else None
    for row in recipients:
        subject, html, text = build_message(row["nombre"], image_url)
        err = send_resend_with_optional_attachment(
            row["email"], subject, html, text, attach
        )
        if err:
            fail += 1
            print(f"  FAIL {row['email']}: {err}")
        else:
            ok += 1
            print(f"  OK   {row['email']}")
        if args.sleep > 0:
            time.sleep(args.sleep)

    print(f"\nEnviados OK: {ok} | Fallidos: {fail}")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
