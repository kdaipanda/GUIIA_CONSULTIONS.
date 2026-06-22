#!/usr/bin/env python3
"""QA API: categorías y endpoints de clínica según plan de membresía."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import httpx

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

load_dotenv(backend_dir / ".env", override=False)

from supabase_client import get_profile_by_email  # noqa: E402
import auth_security  # noqa: E402

BASE = os.getenv("QA_BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")


def auth_headers(profile: dict) -> dict:
    vet_id = str(profile["id"])
    email = profile.get("email") or ""
    token = auth_security.create_access_token(vet_id, email)
    return {
        "Authorization": f"Bearer {token}",
        "X-Veterinarian-Id": vet_id,
    }

TEST_ACCOUNTS = [
    ("basico@guiaa.vet", "basic", {"perros", "gatos"}, False),
    ("profesional@guiaa.vet", "professional", None, True),
    ("premium@guiaa.vet", "premium", None, True),
]


def fetch_categories(client: httpx.Client, profile: dict) -> set[str]:
    resp = client.get(
        f"{BASE}/api/animal-categories",
        headers=auth_headers(profile),
        timeout=15.0,
    )
    resp.raise_for_status()
    data = resp.json()
    cats = data.get("categories") or []
    return {(c.get("id") or "").lower() for c in cats if c.get("id")}


def probe_endpoint(client: httpx.Client, profile: dict, path: str) -> int:
    resp = client.get(
        f"{BASE}{path}",
        headers=auth_headers(profile),
        timeout=15.0,
    )
    return resp.status_code


def main() -> int:
    print(f"QA membresia @ {BASE}\n")
    failures = 0

    with httpx.Client() as client:
        health = client.get(f"{BASE}/", timeout=10.0)
        if health.status_code >= 500:
            print(f"[ERROR] Backend no responde: {health.status_code}")
            return 1

        for email, plan, expected_species, inventory_ok in TEST_ACCOUNTS:
            profile, err = get_profile_by_email(email)
            if err or not profile:
                print(f"[SKIP] {email}: perfil no encontrado ({err})")
                failures += 1
                continue

            vet_id = profile["id"]
            plan_db = (profile.get("membership_type") or "").lower()
            print(f"--- {email} (plan DB: {plan_db}) ---")

            if plan_db != plan:
                print(f"  [WARN] membership_type esperado {plan}, en DB {plan_db}")

            try:
                species = fetch_categories(client, profile)
            except Exception as exc:  # noqa: BLE001
                print(f"  [FAIL] animal-categories: {exc}")
                failures += 1
                continue

            if expected_species is not None:
                if species == expected_species:
                    print(f"  [OK] especies: {sorted(species)}")
                else:
                    print(f"  [FAIL] especies: {sorted(species)} (esperado {sorted(expected_species)})")
                    failures += 1
            else:
                if len(species) >= 10:
                    print(f"  [OK] multiespecie: {len(species)} categorías")
                else:
                    print(f"  [FAIL] multiespecie: solo {len(species)} categorías → {sorted(species)}")
                    failures += 1

            inv_status = probe_endpoint(client, profile, "/api/inventory/summary")
            bill_status = probe_endpoint(client, profile, "/api/invoices")
            rep_status = probe_endpoint(
                client,
                profile,
                "/api/reports/overview?from_date=2026-01-01T00:00:00Z&to_date=2026-12-31T23:59:59Z",
            )
            if inventory_ok:
                if inv_status == 200:
                    print("  [OK] inventario API accesible")
                else:
                    print(f"  [FAIL] inventario API status {inv_status} (esperado 200)")
                    failures += 1
                if bill_status == 200:
                    print("  [OK] ventas API accesible")
                else:
                    print(f"  [FAIL] ventas API status {bill_status} (esperado 200)")
                    failures += 1
                if rep_status == 200:
                    print("  [OK] reportes API accesible")
                else:
                    print(f"  [FAIL] reportes API status {rep_status} (esperado 200)")
                    failures += 1
            else:
                if inv_status == 403:
                    print("  [OK] inventario bloqueado (403)")
                else:
                    print(f"  [FAIL] inventario status {inv_status} (esperado 403)")
                    failures += 1
                if bill_status == 403:
                    print("  [OK] ventas bloqueadas (403)")
                else:
                    print(f"  [FAIL] ventas status {bill_status} (esperado 403)")
                    failures += 1
                if rep_status == 403:
                    print("  [OK] reportes bloqueados (403)")
                else:
                    print(f"  [FAIL] reportes status {rep_status} (esperado 403)")
                    failures += 1

            print()

    if failures:
        print(f"Resultado: {failures} fallo(s)")
        return 1

    print("Resultado: todas las comprobaciones pasaron")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
