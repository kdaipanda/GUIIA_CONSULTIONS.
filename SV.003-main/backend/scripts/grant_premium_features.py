#!/usr/bin/env python3
"""Otorga features Premium temporales SIN tocar cupo CDS ni membership_type.

Uso:
  python scripts/grant_premium_features.py gonzalezpardoceleste@gmail.com --days 15
  python scripts/grant_premium_features.py gonzalezpardoceleste@gmail.com --clear
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)

from supabase_client import get_profile_by_email, get_supabase_client, update_profile  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("email")
    parser.add_argument("--days", type=int, default=15)
    parser.add_argument("--clear", action="store_true", help="Quitar el grant")
    args = parser.parse_args()

    email = (args.email or "").strip().lower()
    profile, err = get_profile_by_email(email)
    if err or not profile:
        print(f"ERROR: no se encontró perfil para {email}: {err}")
        return 1

    before = {
        "id": profile.get("id"),
        "email": profile.get("email"),
        "membership_type": profile.get("membership_type"),
        "consultations_remaining": profile.get("consultations_remaining"),
        "membership_expires": profile.get("membership_expires"),
        "premium_features_until": profile.get("premium_features_until"),
    }
    print("ANTES:", json.dumps(before, indent=2, default=str))

    if args.clear:
        updates = {"premium_features_until": None}
    else:
        until = datetime.now(timezone.utc) + timedelta(days=max(1, int(args.days)))
        updates = {"premium_features_until": until.isoformat()}

    # No tocar membership_type ni consultations_remaining.
    upd_err = update_profile(profile["id"], updates)
    if upd_err:
        print(f"ERROR update: {upd_err}")
        return 1

    # Re-read
    fresh, _ = get_profile_by_email(email)
    after = {
        "membership_type": (fresh or {}).get("membership_type"),
        "consultations_remaining": (fresh or {}).get("consultations_remaining"),
        "premium_features_until": (fresh or {}).get("premium_features_until"),
    }
    print("DESPUÉS:", json.dumps(after, indent=2, default=str))
    if after.get("membership_type") != before.get("membership_type"):
        print("ALERTA: membership_type cambió (no debería)")
        return 2
    if after.get("consultations_remaining") != before.get("consultations_remaining"):
        print("ALERTA: consultations_remaining cambió (no debería)")
        return 2
    print("OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
