#!/usr/bin/env python3
"""QA API: categorías y endpoints de clínica según plan de membresía.

Autenticación: siempre vía POST /api/auth/login contra el backend objetivo
(no firma JWT local). Así funciona igual en localhost y en producción.

Uso:
  # Local
  python scripts/qa_membership_api.py

  # Producción
  QA_BACKEND_URL=https://api.guiaa.vet python scripts/qa_membership_api.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import httpx

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

load_dotenv(backend_dir / ".env", override=False)

BASE = os.getenv("QA_BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")
ORIGIN = os.getenv("QA_ORIGIN", "https://guiaa.vet")

# Cuentas de plan (login legacy email + cédula; ver create_test_users.py)
TEST_ACCOUNTS = [
    {
        "email": os.getenv("QA_BASIC_EMAIL", "basico@guiaa.vet"),
        "cedula": os.getenv("QA_BASIC_CEDULA", "11111111"),
        "password": os.getenv("QA_BASIC_PASSWORD", "").strip() or None,
        "plan": "basic",
        "expected_species": {"perros", "gatos"},
        "inventory_ok": False,
    },
    {
        "email": os.getenv("QA_PRO_EMAIL", "profesional@guiaa.vet"),
        "cedula": os.getenv("QA_PRO_CEDULA", "22222222"),
        "password": os.getenv("QA_PRO_PASSWORD", "").strip() or None,
        "plan": "professional",
        "expected_species": None,
        "inventory_ok": True,
    },
    {
        "email": os.getenv("QA_PREMIUM_EMAIL", "premium@guiaa.vet"),
        "cedula": os.getenv("QA_PREMIUM_CEDULA", "33333333"),
        "password": os.getenv("QA_PREMIUM_PASSWORD", "").strip() or None,
        "plan": "premium",
        "expected_species": None,
        "inventory_ok": True,
    },
]


def login_session(client: httpx.Client, account: dict) -> dict:
    """Obtiene access_token + vet_id desde el backend (secret del servidor)."""
    body: dict = {"email": account["email"]}
    if account.get("password"):
        body["password"] = account["password"]
    else:
        body["cedula_profesional"] = account["cedula"]

    resp = client.post(
        f"{BASE}/api/auth/login",
        json=body,
        headers={"Origin": ORIGIN, "Content-Type": "application/json"},
        timeout=30.0,
    )
    data = resp.json() if resp.content else {}
    if resp.status_code >= 400:
        detail = data.get("detail") if isinstance(data, dict) else data
        raise RuntimeError(f"login HTTP {resp.status_code}: {detail}")

    if data.get("status") == "requires_cedula_flow":
        raise RuntimeError(
            "cuenta en flujo de cédula (debe estar verified para QA de membresía)"
        )
    if data.get("status") == "pending_2fa":
        raise RuntimeError("cuenta requiere 2FA; desactívalo para QA o usa otra cuenta")

    token = data.get("access_token")
    vet_id = data.get("id") or data.get("veterinarian_id")
    if not token or not vet_id:
        raise RuntimeError("login sin access_token o id")

    return {
        "access_token": token,
        "vet_id": str(vet_id),
        "membership_type": (data.get("membership_type") or "").lower(),
        "email": data.get("email") or account["email"],
    }


def auth_headers(session: dict) -> dict:
    return {
        "Authorization": f"Bearer {session['access_token']}",
        "X-Veterinarian-Id": session["vet_id"],
        "Origin": ORIGIN,
    }


def fetch_categories(client: httpx.Client, session: dict) -> set[str]:
    resp = client.get(
        f"{BASE}/api/animal-categories",
        headers=auth_headers(session),
        timeout=20.0,
    )
    resp.raise_for_status()
    data = resp.json()
    cats = data.get("categories") or []
    return {(c.get("id") or "").lower() for c in cats if c.get("id")}


def probe_endpoint(client: httpx.Client, session: dict, path: str) -> int:
    resp = client.get(
        f"{BASE}{path}",
        headers=auth_headers(session),
        timeout=20.0,
    )
    return resp.status_code


def main() -> int:
    print(f"QA membresia @ {BASE}")
    print("(auth via /api/auth/login — sin JWT local)\n")
    failures = 0

    with httpx.Client() as client:
        try:
            health = client.get(f"{BASE}/", timeout=15.0)
        except Exception as exc:  # noqa: BLE001
            print(f"[ERROR] Backend no responde: {exc}")
            return 1
        if health.status_code >= 500:
            print(f"[ERROR] Backend no responde: {health.status_code}")
            return 1

        for account in TEST_ACCOUNTS:
            email = account["email"]
            plan = account["plan"]
            print(f"--- {email} (plan esperado: {plan}) ---")

            try:
                session = login_session(client, account)
            except Exception as exc:  # noqa: BLE001
                print(f"  [FAIL] login: {exc}")
                failures += 1
                print()
                continue

            plan_db = session.get("membership_type") or ""
            if plan_db and plan_db != plan:
                print(f"  [WARN] membership_type en login={plan_db}, esperado={plan}")
            else:
                print(f"  [OK] login JWT emitido por el servidor (plan={plan_db or 'n/d'})")

            try:
                species = fetch_categories(client, session)
            except Exception as exc:  # noqa: BLE001
                print(f"  [FAIL] animal-categories: {exc}")
                failures += 1
                print()
                continue

            expected_species = account["expected_species"]
            if expected_species is not None:
                if species == expected_species:
                    print(f"  [OK] especies: {sorted(species)}")
                else:
                    print(
                        f"  [FAIL] especies: {sorted(species)} "
                        f"(esperado {sorted(expected_species)})"
                    )
                    failures += 1
            else:
                if len(species) >= 10:
                    print(f"  [OK] multiespecie: {len(species)} categorias")
                else:
                    print(
                        f"  [FAIL] multiespecie: solo {len(species)} "
                        f"categorias -> {sorted(species)}"
                    )
                    failures += 1

            inventory_ok = account["inventory_ok"]
            inv_status = probe_endpoint(client, session, "/api/inventory/summary")
            bill_status = probe_endpoint(client, session, "/api/invoices")
            rep_status = probe_endpoint(
                client,
                session,
                "/api/reports/overview?from_date=2026-01-01T00:00:00Z&to_date=2026-12-31T23:59:59Z",
            )

            if inventory_ok:
                for label, status in (
                    ("inventario", inv_status),
                    ("ventas", bill_status),
                    ("reportes", rep_status),
                ):
                    if status == 200:
                        print(f"  [OK] {label} API accesible")
                    else:
                        print(f"  [FAIL] {label} API status {status} (esperado 200)")
                        failures += 1
            else:
                for label, status in (
                    ("inventario", inv_status),
                    ("ventas", bill_status),
                    ("reportes", rep_status),
                ):
                    if status == 403:
                        print(f"  [OK] {label} bloqueado (403)")
                    else:
                        print(f"  [FAIL] {label} status {status} (esperado 403)")
                        failures += 1

            print()

    if failures:
        print(f"Resultado: {failures} fallo(s)")
        return 1

    print("Resultado: todas las comprobaciones pasaron")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
