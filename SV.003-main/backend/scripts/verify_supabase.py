#!/usr/bin/env python3
"""
Verifica la conexión a Supabase y el estado de las tablas principales.

Uso (desde la carpeta backend):
    python scripts/verify_supabase.py
    python scripts/verify_supabase.py --email carlos.hernandez@vetmed.com
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

env_file = Path(__file__).resolve().parents[1] / ".env"
if env_file.exists():
    from dotenv import load_dotenv

    load_dotenv(env_file)

REQUIRED_TABLES = ("profiles", "consultations", "medical_images", "payment_transactions")


def _status(ok: bool) -> str:
    return "OK" if ok else "FALTA"


def check_env() -> bool:
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or ""
    print("=== Variables de entorno (backend) ===")
    print(f"  SUPABASE_URL: {_status(bool(url))} ({len(url)} caracteres)")
    print(f"  SUPABASE_SERVICE_ROLE_KEY: {_status(bool(key))} ({len(key)} caracteres)")
    if key and not key.startswith("eyJ"):
        print("  [!] La service_role key debería empezar con 'eyJ...'")
        return False
    if url and not url.startswith("https://") and not url.endswith(".supabase.co"):
        print("  [!] SUPABASE_URL debería ser https://xxxxx.supabase.co")
    return bool(url and key)


def check_connection() -> bool:
    print("\n=== Conexión ===")
    try:
        from supabase_client import get_supabase_client

        client = get_supabase_client()
        print("  Cliente Supabase: OK")
    except Exception as exc:
        print(f"  Cliente Supabase: FALLO — {exc}")
        return False

    ok = True
    print("\n=== Tablas ===")
    for table in REQUIRED_TABLES:
        try:
            resp = client.table(table).select("id", count="exact").limit(1).execute()
            count = resp.count if resp.count is not None else "?"
            print(f"  {table}: OK ({count} filas)")
        except Exception as exc:
            ok = False
            print(f"  {table}: FALLO — {str(exc)[:100]}")
    return ok


def check_user(email: str) -> None:
    from supabase_client import get_profile_by_email, list_consultations

    print(f"\n=== Usuario: {email} ===")
    profile, err = get_profile_by_email(email)
    if err:
        print(f"  Error: {err}")
        return
    if not profile:
        print("  No encontrado en profiles")
        return
    print(f"  ID: {profile.get('id')}")
    print(f"  Nombre: {profile.get('nombre')}")
    print(f"  Cédula: {profile.get('cedula_profesional')}")
    print(f"  Membresía: {profile.get('membership_type') or 'sin membresía'}")
    print(f"  Consultas restantes: {profile.get('consultations_remaining')}")

    user_id = profile.get("id")
    if user_id:
        rows, err2 = list_consultations(user_id, limit=5)
        if err2:
            print(f"  Consultas: error — {err2}")
        else:
            print(f"  Consultas recientes: {len(rows)}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verificar Supabase")
    parser.add_argument("--email", help="Email de un veterinario a comprobar")
    args = parser.parse_args()

    print("Verificación de Supabase — Savant Vet\n")
    env_ok = check_env()
    if not env_ok:
        print("\nCorrige backend/.env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY")
        print("Obtén los valores en: Supabase Dashboard → Settings → API")
        return 1

    conn_ok = check_connection()
    if args.email:
        check_user(args.email.strip().lower())

    print("\n=== Resumen ===")
    if conn_ok:
        print("Supabase local: configurado y funcionando.")
        print("\nSi producción (api.guiaa.vet) falla, configura las mismas variables en Railway:")
        print("  SUPABASE_URL")
        print("  SUPABASE_SERVICE_ROLE_KEY")
        return 0

    print("Hay problemas de conexión o tablas. Revisa los mensajes arriba.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
