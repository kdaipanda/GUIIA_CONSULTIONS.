#!/usr/bin/env python3
"""
Aplica las migraciones clínicas de GUIAA en orden (idempotentes con IF NOT EXISTS).

Uso (desde backend/):
  python scripts/apply_all_clinic_migrations.py --dry-run
  python scripts/apply_all_clinic_migrations.py
  python scripts/apply_all_clinic_migrations.py --only 20260617_inventory_billing.sql

Requiere SUPABASE_DATABASE_URL o SUPABASE_DB_URL en backend/.env
(Connection string: Supabase → Settings → Database → URI)
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = BACKEND_DIR / "supabase_migrations"

ENV_FILE = BACKEND_DIR / ".env"
if ENV_FILE.exists():
    from dotenv import load_dotenv

    load_dotenv(ENV_FILE)

# Orden recomendado para producción (omitir fix_* salvo diagnóstico)
CLINIC_MIGRATION_ORDER = [
    "20251229_payment_transactions.sql",
    "20251229_cedula_verification.sql",
    "20260331_medical_images_additional_context.sql",
    "20260401_medical_images_lab_interpretation_columns.sql",
    "20260614_clinic_phase1_schema.sql",
    "20260614_clinic_phase1_rls.sql",
    "20260615_medical_images_patient_id.sql",
    "20260616_appointment_requests.sql",
    "20260617_inventory_billing.sql",
    "20260620_platform_security.sql",
    "20260621_support_tickets.sql",
    "20260622_profesional_latam.sql",
    "20260625_guia_consultas_leads.sql",
    "20260702_cedula_reminder_sent_at.sql",
    "20260702_meta_capi_purchase_sent.sql",
    "20260707_password_hash.sql",
    "optimize_rls_policies.sql",
]


def resolve_migrations(only: str | None) -> list[Path]:
    if only:
        path = MIGRATIONS_DIR / only
        if not path.exists():
            raise FileNotFoundError(f"No existe: {path}")
        return [path]
    paths: list[Path] = []
    for name in CLINIC_MIGRATION_ORDER:
        path = MIGRATIONS_DIR / name
        if not path.exists():
            print(f"[WARN] Omitida (no encontrada): {name}", file=sys.stderr)
            continue
        paths.append(path)
    return paths


def apply_sql(db_url: str, sql_path: Path) -> None:
    import psycopg2

    sql = sql_path.read_text(encoding="utf-8")
    conn = psycopg2.connect(db_url)
    try:
        conn.autocommit = False
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Aplicar migraciones clínicas GUIAA en orden")
    parser.add_argument(
        "--db-url",
        default=os.getenv("SUPABASE_DATABASE_URL") or os.getenv("SUPABASE_DB_URL") or "",
        help="Postgres URI (Supabase → Settings → Database)",
    )
    parser.add_argument(
        "--only",
        help="Aplicar solo un archivo, ej. 20260617_inventory_billing.sql",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Listar migraciones sin ejecutar",
    )
    args = parser.parse_args()

    try:
        migrations = resolve_migrations(args.only)
    except FileNotFoundError as exc:
        print(exc, file=sys.stderr)
        return 2

    if not migrations:
        print("No hay migraciones para aplicar.", file=sys.stderr)
        return 2

    print(f"Migraciones a aplicar ({len(migrations)}):")
    for path in migrations:
        print(f"  - {path.name}")

    if args.dry_run:
        print("\nDry-run: no se ejecutó SQL.")
        return 0

    db_url = (args.db_url or "").strip()
    if not db_url:
        print(
            "\nFalta SUPABASE_DATABASE_URL en backend/.env o --db-url.\n"
            "Supabase Dashboard → Settings → Database → Connection string (URI)\n"
            "Alternativa: copia cada .sql al SQL Editor y ejecuta en el orden listado arriba.",
            file=sys.stderr,
        )
        return 2

    try:
        import psycopg2  # noqa: F401
    except ImportError:
        print("Instala psycopg2: pip install psycopg2-binary", file=sys.stderr)
        return 2

    for path in migrations:
        print(f"\n→ Aplicando {path.name} ...")
        try:
            apply_sql(db_url, path)
            print("  OK")
        except Exception as exc:
            print(f"  ERROR: {exc}", file=sys.stderr)
            print("\nDetén aquí, corrige y reintenta con --only <archivo> si hace falta.", file=sys.stderr)
            return 1

    print("\nTodas las migraciones aplicadas.")
    print("Verifica: python scripts/verify_supabase.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
