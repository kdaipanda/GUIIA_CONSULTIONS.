#!/usr/bin/env python3
"""Establece contraseña bcrypt para un usuario por email (requiere migración password_hash)."""
from __future__ import annotations

import argparse
import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from password_auth import hash_password  # noqa: E402
from supabase_client import get_profile_by_email, update_profile  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Asignar contraseña a un perfil GUIAA")
    parser.add_argument("--email", required=True, help="Email del veterinario")
    parser.add_argument(
        "--password",
        help="Contraseña (mín. 8). Si se omite, se pide por consola.",
    )
    args = parser.parse_args()

    email = args.email.strip().lower()
    profile, err = get_profile_by_email(email)
    if err:
        print(f"Error: {err}")
        return 1
    if not profile:
        print(f"No se encontró perfil con email {email}")
        return 1

    password = args.password or getpass.getpass("Nueva contraseña: ")
    confirm = getpass.getpass("Confirmar contraseña: ")
    if password != confirm:
        print("Las contraseñas no coinciden.")
        return 1

    try:
        pw_hash = hash_password(password)
    except ValueError as exc:
        print(exc)
        return 1

    err_up = update_profile(profile["id"], {"password_hash": pw_hash})
    if err_up:
        print(f"Error guardando: {err_up}")
        if "password_hash" in err_up.lower() or "42703" in err_up:
            print(
                "\nAplica primero la migración:\n"
                "  supabase_migrations/20260707_password_hash.sql"
            )
        return 1

    print(f"OK: contraseña actualizada para {email}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
