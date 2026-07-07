#!/usr/bin/env python3
"""
Verifica la conexión a Supabase, tablas principales, PMS clínico, soporte y email.

Uso (desde la carpeta backend):
    python scripts/verify_supabase.py
    python scripts/verify_supabase.py --email carlos.hernandez@vetmed.com
    python scripts/verify_supabase.py --seed-admin --email carlos.hernandez@vetmed.com
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import List, Optional, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

env_file = Path(__file__).resolve().parents[1] / ".env"
if env_file.exists():
    from dotenv import load_dotenv

    load_dotenv(env_file)

REQUIRED_TABLES = ("profiles", "consultations", "medical_images", "payment_transactions")

PMS_TABLE_GROUPS: List[Tuple[str, Tuple[str, ...]]] = [
    ("PMS base (20260614)", ("organizations", "clients", "patients", "appointments")),
    ("Agenda portal (20260616)", ("appointment_requests",)),
    (
        "Inventario / facturación (20260617)",
        ("products", "stock_movements", "clinical_invoices", "clinical_invoice_items"),
    ),
    ("Seguridad plataforma (20260620)", ("platform_admins", "admin_audit_log")),
    ("Soporte (20260621)", ("support_tickets", "support_messages")),
]

DEFAULT_ADMIN_EMAIL = "carlos.hernandez@vetmed.com"


def _status(ok: bool) -> str:
    return "OK" if ok else "FALTA"


def check_env() -> bool:
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or ""
    print("=== Variables de entorno (backend) ===")
    print(f"  SUPABASE_URL: {_status(bool(url))} ({len(url)} caracteres)")
    print(f"  SUPABASE_SERVICE_ROLE_KEY: {_status(bool(key))} ({len(key)} caracteres)")
    frontend = (
        os.getenv("FRONTEND_URL", "").strip()
        or os.getenv("PUBLIC_APP_URL", "").strip()
        or "http://localhost:3000"
    )
    print(f"  FRONTEND_URL: {frontend}")
    if "localhost" in frontend or "127.0.0.1" in frontend:
        print("  [!] En producción (Railway) usa FRONTEND_URL=https://guiaa.vet")
    if key and not key.startswith("eyJ"):
        print("  [!] La service_role key debería empezar con 'eyJ...'")
        return False
    if url and not url.startswith("https://") and not url.endswith(".supabase.co"):
        print("  [!] SUPABASE_URL debería ser https://xxxxx.supabase.co")
    return bool(url and key)


def _check_tables(client, tables: Tuple[str, ...], section_title: str) -> bool:
    print(f"\n=== {section_title} ===")
    ok = True
    for table in tables:
        try:
            resp = client.table(table).select("id", count="exact").limit(1).execute()
            count = resp.count if resp.count is not None else "?"
            print(f"  {table}: OK ({count} filas)")
        except Exception as exc:
            ok = False
            print(f"  {table}: FALLO — {str(exc)[:120]}")
    return ok


def check_connection() -> Tuple[bool, object]:
    print("\n=== Conexión ===")
    try:
        from supabase_client import get_supabase_client

        client = get_supabase_client()
        print("  Cliente Supabase: OK")
    except Exception as exc:
        print(f"  Cliente Supabase: FALLO — {exc}")
        return False, None

    core_ok = _check_tables(client, REQUIRED_TABLES, "Tablas core")
    pms_ok = True
    for group_label, tables in PMS_TABLE_GROUPS:
        if not _check_tables(client, tables, group_label):
            pms_ok = False
    return core_ok and pms_ok, client


def check_email() -> bool:
    print("\n=== Email (Resend / SMTP) ===")
    try:
        import email_notifications

        status = email_notifications.get_email_config_status()
        configured = status.get("configured")
        print(f"  Proveedor: {status.get('provider')}")
        print(f"  Configurado: {_status(bool(configured))}")
        print(f"  Remitente: {status.get('from_address')}")
        print(f"  Notificaciones soporte: {', '.join(status.get('support_notify_emails') or [])}")
        if not configured:
            print("  [!] Define RESEND_API_KEY en backend/.env (o SMTP_HOST + SMTP_FROM)")
        return bool(configured)
    except Exception as exc:
        print(f"  FALLO — {exc}")
        return False


def check_platform_admins(client, email: Optional[str] = None) -> bool:
    print("\n=== Admins de plataforma ===")
    try:
        resp = (
            client.table("platform_admins")
            .select("id, email, role, active, profile_id")
            .eq("active", True)
            .order("created_at")
            .execute()
        )
        rows = resp.data or []
        if not rows:
            print("  Ningún admin activo en platform_admins")
            if email:
                print(f"  [!] Ejecuta: python scripts/verify_supabase.py --seed-admin --email {email}")
            return False
        for row in rows:
            print(
                f"  {row.get('email')} — {row.get('role')} "
                f"(profile_id: {row.get('profile_id') or 'sin vincular'})"
            )
        if email:
            found = any((r.get("email") or "").lower() == email.lower() for r in rows)
            if not found:
                print(f"  [!] {email} no está en platform_admins activos")
                return False
        return True
    except Exception as exc:
        print(f"  FALLO — {str(exc)[:120]}")
        return False


def seed_platform_admin(email: str) -> bool:
    from supabase_client import get_profile_by_email, get_supabase_client

    email = email.strip().lower()
    print(f"\n=== Insertar admin: {email} ===")
    profile, err = get_profile_by_email(email)
    if err:
        print(f"  Error buscando perfil: {err}")
        return False
    profile_id = profile.get("id") if profile else None
    if not profile_id:
        print("  [!] Perfil no encontrado; se registrará solo el email (sin profile_id)")

    client = get_supabase_client()
    row = {
        "email": email,
        "role": "super_admin",
        "active": True,
        "profile_id": profile_id,
    }
    try:
        existing = (
            client.table("platform_admins")
            .select("id")
            .ilike("email", email)
            .limit(1)
            .execute()
        )
        if existing.data:
            admin_id = existing.data[0]["id"]
            client.table("platform_admins").update(row).eq("id", admin_id).execute()
            print(f"  Admin actualizado (id={admin_id})")
        else:
            inserted = client.table("platform_admins").insert(row, returning="representation").execute()
            admin_id = (inserted.data or [{}])[0].get("id")
            print(f"  Admin creado (id={admin_id})")
        return True
    except Exception as exc:
        print(f"  FALLO — {exc}")
        return False


def check_pending_schema_columns(client) -> bool:
    print("\n=== Columnas migraciones julio 2026 ===")
    pending = (
        ("profiles", "cedula_reminder_sent_at"),
        ("profiles", "password_hash"),
        ("payment_transactions", "meta_capi_purchase_sent"),
    )
    ok = True
    for table, column in pending:
        try:
            client.table(table).select(column).limit(1).execute()
            print(f"  {table}.{column}: OK")
        except Exception as exc:
            msg = str(exc).lower()
            if "42703" in msg or ("column" in msg and "does not exist" in msg):
                print(f"  {table}.{column}: FALTA")
                ok = False
            else:
                print(f"  {table}.{column}: ERROR — {str(exc)[:100]}")
                ok = False
    if not ok:
        print(
            "  Aplica en SQL Editor: "
            "supabase_migrations/20260702_meta_capi_purchase_sent.sql"
        )
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
    parser = argparse.ArgumentParser(description="Verificar Supabase y módulo clínico GUIAA")
    parser.add_argument("--email", help="Email de un veterinario a comprobar")
    parser.add_argument(
        "--seed-admin",
        action="store_true",
        help="Registra/actualiza super_admin en platform_admins (usa --email o el default)",
    )
    args = parser.parse_args()

    admin_email = (args.email or DEFAULT_ADMIN_EMAIL).strip().lower()

    print("Verificación de Supabase — GUIAA\n")
    env_ok = check_env()
    if not env_ok:
        print("\nCorrige backend/.env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY")
        print("Obtén los valores en: Supabase Dashboard → Settings → API")
        return 1

    if args.seed_admin:
        if not seed_platform_admin(admin_email):
            return 1

    conn_ok, client = check_connection()
    schema_ok = check_pending_schema_columns(client) if client else False
    email_ok = check_email()
    admins_ok = check_platform_admins(client, admin_email) if client else False

    if args.email or args.seed_admin:
        check_user(admin_email)

    print("\n=== Resumen ===")
    checks = [
        ("Conexión + tablas", conn_ok),
        ("Columnas julio 2026", schema_ok),
        ("Email", email_ok),
        ("Platform admins", admins_ok),
    ]
    for label, ok in checks:
        print(f"  {label}: {_status(ok)}")

    all_ok = conn_ok and schema_ok and email_ok and admins_ok
    if all_ok:
        print("\nEntorno listo: Supabase, PMS clínico, soporte y email configurados.")
        print(
            "\nProducción (Railway): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, "
            "FRONTEND_URL=https://guiaa.vet, STRIPE_PUBLISHABLE_KEY"
        )
        return 0

    print("\nHay pendientes. Revisa los mensajes arriba.")
    if not admins_ok:
        print(f"  → python scripts/verify_supabase.py --seed-admin --email {admin_email}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
