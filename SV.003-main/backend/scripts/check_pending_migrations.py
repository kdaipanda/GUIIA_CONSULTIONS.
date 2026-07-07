#!/usr/bin/env python3
"""Comprueba columnas de migraciones julio 2026 vía API REST de Supabase."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

PENDING = (
    ("profiles", "cedula_reminder_sent_at"),
    ("profiles", "password_hash"),
    ("payment_transactions", "meta_capi_purchase_sent"),
)


def column_exists(client, table: str, column: str) -> bool:
    try:
        client.table(table).select(column).limit(1).execute()
        return True
    except Exception as exc:
        msg = str(exc).lower()
        if "42703" in msg or "column" in msg and "does not exist" in msg:
            return False
        raise


def main() -> int:
    from supabase_client import get_supabase_client

    print("=== Migraciones pendientes (julio 2026) ===")
    client = get_supabase_client()
    all_ok = True
    for table, column in PENDING:
        ok = column_exists(client, table, column)
        print(f"  {table}.{column}: {'OK' if ok else 'FALTA'}")
        if not ok:
            all_ok = False

    if all_ok:
        print("\nTodas las columnas existen en Supabase.")
        return 0

    print(
        "\nAplica las migraciones faltantes:\n"
        "  python scripts/apply_supabase_migration.py "
        "--sql supabase_migrations/20260707_password_hash.sql\n"
        "(requiere SUPABASE_DATABASE_URL en backend/.env)\n"
        "O ejecuta el SQL en Supabase Dashboard > SQL Editor.",
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
