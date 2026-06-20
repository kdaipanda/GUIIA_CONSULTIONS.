#!/usr/bin/env python3
"""Prueba envío de email vía Resend.

Uso:
  cd backend
  python scripts/test_resend_email.py
  python scripts/test_resend_email.py soporte@guiaa.vet
"""
from __future__ import annotations

import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

load_dotenv(backend_dir / ".env", override=False)

import email_notifications  # noqa: E402


def main() -> int:
    recipient = (
        sys.argv[1].strip()
        if len(sys.argv) > 1
        else email_notifications.DEFAULT_SUPPORT_NOTIFY_EMAIL
    )
    status = email_notifications.get_email_config_status()
    print("Estado email:", status)

    if not status["configured"]:
        print(
            "\nFalta RESEND_API_KEY en backend/.env\n"
            "1. Crea cuenta en https://resend.com\n"
            "2. Verifica el dominio guiaa.vet (DNS)\n"
            "3. API Keys - Create - pega en RESEND_API_KEY\n"
        )
        return 1

    err = email_notifications.send_email(
        [recipient],
        "[GUIAA] Prueba de Resend",
        "<p>Si ves este correo, Resend está configurado correctamente en GUIAA.</p>",
        "Si ves este correo, Resend está configurado correctamente en GUIAA.",
    )
    if err:
        print(f"\nError al enviar: {err}")
        return 1

    print(f"\nCorreo enviado a {recipient}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
