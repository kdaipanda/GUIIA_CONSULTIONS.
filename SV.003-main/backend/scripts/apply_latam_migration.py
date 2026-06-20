#!/usr/bin/env python3
"""Aplica y verifica la migración LATAM (profesional_pais + cedula_profesional_key)."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

env_file = backend_dir / ".env"
if env_file.exists():
    from dotenv import load_dotenv

    load_dotenv(env_file)

MIGRATION_FILE = backend_dir / "supabase_migrations" / "20260622_profesional_latam.sql"


def verify_columns() -> bool:
    from supabase_client import get_supabase_client

    client = get_supabase_client()
    try:
        resp = (
            client.table("profiles")
            .select("id,profesional_pais,cedula_profesional_key,cedula_profesional")
            .limit(3)
            .execute()
        )
        rows = resp.data or []
        print(f"OK: columnas disponibles. Muestra ({len(rows)} perfiles):")
        for row in rows:
            print(
                f"  - {row.get('id')[:8]}… pais={row.get('profesional_pais')} "
                f"key={row.get('cedula_profesional_key')} cedula={row.get('cedula_profesional')}"
            )
        return True
    except Exception as exc:
        print(f"PENDIENTE: {exc}")
        return False


def apply_with_psycopg2(db_url: str) -> bool:
    try:
        import psycopg2
    except ImportError:
        print("Instala psycopg2-binary: pip install psycopg2-binary")
        return False

    sql = MIGRATION_FILE.read_text(encoding="utf-8")
    print(f"Aplicando: {MIGRATION_FILE.name}")
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        print("Migración SQL ejecutada.")
        return True
    except Exception as exc:
        conn.rollback()
        print(f"ERROR: {exc}")
        return False
    finally:
        conn.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Migración LATAM — registro profesional")
    parser.add_argument("--verify-only", action="store_true", help="Solo comprobar columnas")
    parser.add_argument(
        "--db-url",
        default=os.getenv("SUPABASE_DATABASE_URL") or os.getenv("SUPABASE_DB_URL") or "",
        help="URI PostgreSQL (opcional si ya ejecutaste el SQL en el dashboard)",
    )
    args = parser.parse_args()

    if args.verify_only or not args.db_url:
        ok = verify_columns()
        if not ok and not args.db_url:
            print("\nEjecuta el SQL manualmente en:")
            print("  https://supabase.com/dashboard/project/wewayfiwmffghinxoryk/sql/new")
            print(f"  Archivo: {MIGRATION_FILE}")
        return 0 if ok else 1

    if not apply_with_psycopg2(args.db_url.strip()):
        return 1
    return 0 if verify_columns() else 1


if __name__ == "__main__":
    raise SystemExit(main())
