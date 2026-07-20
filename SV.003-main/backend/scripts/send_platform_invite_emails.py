#!/usr/bin/env python3
"""Invitación por correo a usuarios registrados para probar GUIAA.

Uso:
  python scripts/send_platform_invite_emails.py --dry-run
  python scripts/send_platform_invite_emails.py --send
  python scripts/send_platform_invite_emails.py --send --only soporte@guiaa.vet
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from email_notifications import (  # noqa: E402
    DEFAULT_SUPPORT_NOTIFY_EMAIL,
    _frontend_url,
    is_email_configured,
    send_email,
)
from supabase_client import list_profiles  # noqa: E402

SKIP_SUFFIXES = ("@example.invalid", "@vetmed.com")
SKIP_EXACT = {
    "basico@guiaa.vet",
    "profesional@guiaa.vet",
    "premium@guiaa.vet",
}


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


def build_invite(nombre: str) -> tuple[str, str, str]:
    app_url = _frontend_url()
    login_url = f"{app_url}/login"
    support = DEFAULT_SUPPORT_NOTIFY_EMAIL
    subject = "GUIAA listo para que pruebes tu consulta"
    text = (
        f"Hola {nombre},\n\n"
        f"Ya puedes entrar a GUIAA y probar el software clínico veterinario.\n"
        f"Tienes consultas de prueba incluidas para que explores el flujo real de consulta.\n\n"
        f"Entra aquí: {login_url}\n\n"
        f"Si te falta subir tu cédula o registro profesional, lo haces en el mismo inicio de sesión.\n\n"
        f"¿Dudas? Escríbenos a {support}.\n\n"
        f"— Equipo GUIAA\n"
    )
    html = f"""
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#0c2d4d;max-width:560px">
      <h2 style="margin:0 0 12px;font-size:22px">GUIAA listo para probar</h2>
      <p>Hola {nombre},</p>
      <p>
        Ya puedes entrar a <strong>GUIAA</strong> y probar el software clínico veterinario.
        Tienes <strong>consultas de prueba</strong> incluidas para explorar el flujo real de consulta.
      </p>
      <p style="margin:24px 0">
        <a href="{login_url}"
           style="display:inline-block;background:#0c2d4d;color:#fff;text-decoration:none;
                  padding:12px 20px;border-radius:999px;font-weight:600">
          Entrar a GUIAA
        </a>
      </p>
      <p style="font-size:14px;color:#475569">
        Si te falta subir tu cédula o registro profesional, lo haces en el mismo inicio de sesión.
      </p>
      <p style="font-size:12px;color:#64748b">
        ¿Dudas? Escríbenos a <a href="mailto:{support}">{support}</a><br/>
        — Equipo GUIAA
      </p>
    </div>
    """
    return subject, html, text


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

    print(f"Destinatarios: {len(recipients)}")
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
    for row in recipients:
        subject, html, text = build_invite(row["nombre"])
        err = send_email([row["email"]], subject, html, text)
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
