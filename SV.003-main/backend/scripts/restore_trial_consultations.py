#!/usr/bin/env python3
"""Restaura 3 consultas de prueba a usuarios sin membresía y opcionalmente envía correo.

Uso:
  python scripts/restore_trial_consultations.py --dry-run
  python scripts/restore_trial_consultations.py --execute
  python scripts/restore_trial_consultations.py --execute --no-email
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from email_notifications import notify_user_trial_credits_restored, is_email_configured  # noqa: E402
from supabase_client import get_supabase_client, update_profile  # noqa: E402

TRIAL_CREDITS = 3
SKIP_EMAIL_SUFFIXES = (".invalid", ".local", "example.com", "test.com")


def _fetch_all_profiles() -> list[dict]:
    client = get_supabase_client()
    rows: list[dict] = []
    offset = 0
    while True:
        resp = (
            client.table("profiles")
            .select(
                "id,email,nombre,membership_type,consultations_remaining,"
                "cedula_verification_status,created_at"
            )
            .order("created_at", desc=False)
            .range(offset, offset + 999)
            .execute()
        )
        batch = resp.data or []
        rows.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    return rows


def _is_trial(profile: dict) -> bool:
    return not (profile.get("membership_type") or "").strip()


def _email_ok(email: str) -> bool:
    e = (email or "").strip().lower()
    if not e or "@" not in e:
        return False
    return not any(e.endswith(suf) for suf in SKIP_EMAIL_SUFFIXES)


def main() -> int:
    parser = argparse.ArgumentParser(description="Restaurar 3 consultas de prueba (trial)")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true", help="Solo listar, sin cambios")
    group.add_argument("--execute", action="store_true", help="Aplicar cambios")
    parser.add_argument(
        "--only-below-3",
        action="store_true",
        help="Solo usuarios con menos de 3 consultas (default: todos los trial → 3)",
    )
    parser.add_argument(
        "--no-email",
        action="store_true",
        help="No enviar correos (solo actualizar créditos)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.35,
        help="Segundos entre emails (default 0.35)",
    )
    args = parser.parse_args()

    profiles = _fetch_all_profiles()
    candidates = [p for p in profiles if _is_trial(p)]
    if args.only_below_3:
        candidates = [
            p
            for p in candidates
            if int(p.get("consultations_remaining") or 0) < TRIAL_CREDITS
        ]

    print(f"Perfiles totales: {len(profiles)}")
    print(f"Candidatos trial a restaurar: {len(candidates)}")
    print(f"Email configurado: {is_email_configured()}")
    print(f"Modo: {'DRY-RUN' if args.dry_run else 'EXECUTE'}")
    print()

    updated = 0
    emailed = 0
    email_errors = 0
    skipped_email = 0

    for p in candidates:
        email = (p.get("email") or "").strip()
        name = (p.get("nombre") or "").strip() or "(sin nombre)"
        before = int(p.get("consultations_remaining") or 0)
        pid = p.get("id")
        print(f"  {email or '(sin email)'} | {name} | {before} → {TRIAL_CREDITS}")

        if args.dry_run:
            continue

        err = update_profile(pid, {"consultations_remaining": TRIAL_CREDITS})
        if err:
            print(f"    ERROR update: {err}")
            continue
        updated += 1

        if args.no_email:
            continue
        if not _email_ok(email):
            skipped_email += 1
            print("    (email omitido: inválido o de prueba)")
            continue

        notify_err = notify_user_trial_credits_restored(
            {**p, "consultations_remaining": TRIAL_CREDITS}
        )
        if notify_err:
            email_errors += 1
            print(f"    WARN email: {notify_err}")
        else:
            emailed += 1
        time.sleep(max(0.0, args.delay))

    print()
    if args.dry_run:
        print("Dry-run listo. Ejecuta con --execute para aplicar.")
    else:
        print(f"Actualizados: {updated}")
        print(f"Emails enviados: {emailed}")
        print(f"Emails omitidos: {skipped_email}")
        print(f"Errores de email: {email_errors}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
