#!/usr/bin/env python3
"""Healthcheck recurrente de producción GUIAA.

Ejecuta en serie los smokes/E2E críticos contra api.guiaa.vet y guiaa.vet,
sin dejar cuentas de prueba (los E2E de registro ya se limpian solos).

Uso:
  python scripts/prod_healthcheck.py
  python scripts/prod_healthcheck.py --quick
  python scripts/prod_healthcheck.py --with-ui
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
SCRIPTS = BACKEND / "scripts"

# (label, script_relpath, env_extra, quick?)
CHECKS = [
    ("smoke API", "e2e_production_smoke.py", {}, True),
    ("auth security", "smoke_auth_security.py", {"SMOKE_API_BASE": "https://api.guiaa.vet"}, True),
    ("membresías", "qa_membership_api.py", {"QA_BACKEND_URL": "https://api.guiaa.vet"}, True),
    ("pagos Stripe", "verify_payments_prod.py", {}, True),
    ("historial clínico", "verify_clinical_history_prod.py", {}, True),
    ("consultas E2E", "e2e_consultations_flow.py", {}, False),
    ("registro+password", "e2e_register_password_phone.py", {}, False),
    ("registro+cédula", "e2e_register_flow.py", {}, False),
]


def run_check(label: str, script: str, env_extra: dict) -> tuple[bool, float, str]:
    path = SCRIPTS / script
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    env["PROBE_API_BASE"] = env.get("PROBE_API_BASE", "https://api.guiaa.vet")
    env["QA_BACKEND_URL"] = env.get("QA_BACKEND_URL", "https://api.guiaa.vet")
    env.update(env_extra)
    started = time.time()
    try:
        proc = subprocess.run(
            [sys.executable, str(path)],
            cwd=str(BACKEND),
            env=env,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=300,
        )
        elapsed = time.time() - started
        out = (proc.stdout or "") + (proc.stderr or "")
        ok = proc.returncode == 0
        return ok, elapsed, out
    except subprocess.TimeoutExpired:
        return False, time.time() - started, "TIMEOUT (>300s)"
    except Exception as exc:  # noqa: BLE001
        return False, time.time() - started, str(exc)


def run_ui_smoke() -> tuple[bool, float, str]:
    ui_script = SCRIPTS / "prod_ui_smoke.mjs"
    if not ui_script.is_file():
        return False, 0.0, "Falta scripts/prod_ui_smoke.mjs"
    started = time.time()
    try:
        proc = subprocess.run(
            ["node", str(ui_script)],
            cwd=str(BACKEND),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=180,
            shell=True,
        )
        elapsed = time.time() - started
        out = (proc.stdout or "") + (proc.stderr or "")
        return proc.returncode == 0, elapsed, out
    except Exception as exc:  # noqa: BLE001
        return False, time.time() - started, str(exc)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--quick", action="store_true", help="Solo checks rápidos (sin E2E de escritura)")
    parser.add_argument("--with-ui", action="store_true", help="Incluye smoke de UI con Playwright")
    args = parser.parse_args()

    print("=== GUIAA prod healthcheck ===")
    print(f"API: {os.getenv('PROBE_API_BASE', 'https://api.guiaa.vet')}")
    print(f"Modo: {'quick' if args.quick else 'full'}" + (" + UI" if args.with_ui else ""))
    print()

    selected = [c for c in CHECKS if (c[3] or not args.quick)]
    results: list[tuple[str, bool, float]] = []
    failed_details: list[tuple[str, str]] = []

    for label, script, env_extra, _quick in selected:
        print(f"→ {label} ({script})…", flush=True)
        ok, elapsed, out = run_check(label, script, env_extra)
        status = "OK" if ok else "FAIL"
        print(f"  [{status}] {label} ({elapsed:.1f}s)")
        results.append((label, ok, elapsed))
        if not ok:
            # últimas líneas útiles
            tail = "\n".join(out.strip().splitlines()[-20:])
            failed_details.append((label, tail))
            print(tail)
        print()

    if args.with_ui:
        print("→ UI smoke (Playwright)…", flush=True)
        ok, elapsed, out = run_ui_smoke()
        status = "OK" if ok else "FAIL"
        print(f"  [{status}] UI smoke ({elapsed:.1f}s)")
        results.append(("UI smoke", ok, elapsed))
        if not ok:
            failed_details.append(("UI smoke", "\n".join(out.strip().splitlines()[-30:])))
            print("\n".join(out.strip().splitlines()[-30:]))
        print()

    ok_n = sum(1 for _, ok, _ in results if ok)
    fail_n = len(results) - ok_n
    total_t = sum(t for _, _, t in results)
    print("=== Resumen ===")
    for label, ok, elapsed in results:
        print(f"  [{'OK' if ok else 'FAIL'}] {label} ({elapsed:.1f}s)")
    print(f"\nPasaron: {ok_n}/{len(results)} · Fallaron: {fail_n} · Tiempo: {total_t:.1f}s")

    if failed_details:
        print("\nDetalle de fallos:")
        for label, detail in failed_details:
            print(f"\n--- {label} ---\n{detail}")

    return 1 if fail_n else 0


if __name__ == "__main__":
    raise SystemExit(main())
