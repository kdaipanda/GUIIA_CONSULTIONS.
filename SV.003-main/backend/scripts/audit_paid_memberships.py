#!/usr/bin/env python3
"""Audita pagos vs membresía en Supabase (y Stripe si hay clave).

Uso:
  python scripts/audit_paid_memberships.py
  python scripts/audit_paid_memberships.py --repair
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)

from supabase_client import get_profile, get_supabase_client  # noqa: E402


def _mask(value: str, keep: int = 8) -> str:
    raw = (value or "").strip()
    if len(raw) <= keep:
        return raw or "-"
    return f"{raw[:keep]}…"


def _stripe_sessions():
    try:
        import stripe
    except ImportError:
        return None, "stripe sdk no instalado"
    key = os.getenv("STRIPE_API_KEY", "").strip()
    if not key:
        return None, "STRIPE_API_KEY no configurada"
    stripe.api_key = key
    return stripe, None


def _load_transactions(client):
    page_size = 200
    offset = 0
    rows = []
    while True:
        resp = (
            client.table("payment_transactions")
            .select(
                "id,session_id,type,package,package_id,billing_cycle,credits,"
                "amount,currency,status,payment_status,stripe,veterinarian_id,"
                "membership_activated,credits_applied,created_at,updated_at"
            )
            .order("created_at", desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        chunk = resp.data or []
        rows.extend(chunk)
        if len(chunk) < page_size:
            break
        offset += page_size
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repair", action="store_true", help="Activa membresía/créditos de pagos ya cobrados")
    args = parser.parse_args()

    client = get_supabase_client()
    rows = _load_transactions(client)
    print(f"Transacciones en DB: {len(rows)}\n")

    if not rows:
        print("No hay payment_transactions.")
        return 0

    stripe_api, stripe_err = _stripe_sessions()
    if stripe_err:
        print(f"[INFO] Stripe omitido: {stripe_err}\n")

    mismatches = []
    for tx in rows:
        sid = tx.get("session_id") or ""
        stripe_paid = None
        stripe_status = None
        if stripe_api and str(sid).startswith("cs_"):
            try:
                session = stripe_api.checkout.Session.retrieve(sid)
                stripe_paid = session.payment_status
                stripe_status = session.status
            except Exception as exc:  # noqa: BLE001
                stripe_paid = f"error:{exc}"

        vet_id = (tx.get("veterinarian_id") or "").strip()
        profile = None
        if vet_id:
            profile, _ = get_profile(vet_id)

        db_paid = (tx.get("payment_status") or "").lower() == "paid"
        stripe_is_paid = (stripe_paid or "").lower() == "paid" if isinstance(stripe_paid, str) else False
        effectively_paid = db_paid or stripe_is_paid
        membership = (profile or {}).get("membership_type") if profile else None
        activated = bool(tx.get("membership_activated"))
        credits_applied = bool(tx.get("credits_applied"))
        tx_type = tx.get("type")

        problem = None
        if str(sid).startswith("sim_") or str(sid).startswith("test_"):
            continue

        if effectively_paid and tx_type == "membership" and (not activated or not membership):
            problem = "paid_membership_not_granted"
        elif effectively_paid and tx_type == "consultation_credits" and not credits_applied:
            problem = "paid_credits_not_applied"
        elif stripe_is_paid and not db_paid:
            problem = "stripe_paid_db_unpaid"
        elif db_paid and stripe_paid and not stripe_is_paid and not str(stripe_paid).startswith("error"):
            problem = "db_paid_stripe_not_paid"

        if problem:
            mismatches.append(
                {
                    "problem": problem,
                    "tx": tx,
                    "profile": profile,
                    "stripe_paid": stripe_paid,
                    "stripe_status": stripe_status,
                }
            )

    print("=== Pagos recientes (hasta 15) ===")
    for tx in rows[:15]:
        print(
            f"  {tx.get('created_at')} | {tx.get('type')} | {tx.get('package') or tx.get('package_id')} | "
            f"db={tx.get('payment_status')}/{tx.get('status')} | "
            f"activated={tx.get('membership_activated')} credits={tx.get('credits_applied')} | "
            f"vet={_mask(tx.get('veterinarian_id') or '', 8)} | {_mask(tx.get('session_id') or '', 14)}"
        )

    print(f"\n=== Inconsistencias: {len(mismatches)} ===")
    for item in mismatches:
        tx = item["tx"]
        profile = item["profile"] or {}
        print(
            f"  [{item['problem']}] email={profile.get('email') or '-'} "
            f"nombre={profile.get('nombre') or '-'} "
            f"plan={profile.get('membership_type') or 'sin plan'} "
            f"consultas={profile.get('consultations_remaining')} "
            f"db_pay={tx.get('payment_status')} stripe_pay={item['stripe_paid']} "
            f"type={tx.get('type')} pkg={tx.get('package') or tx.get('package_id')} "
            f"activated={tx.get('membership_activated')} session={_mask(tx.get('session_id') or '', 16)}"
        )

    if args.repair and mismatches:
        from payment_fulfillment import fulfill_paid_transaction, sync_transaction_status

        repaired = 0
        for item in mismatches:
            tx = item["tx"]
            sid = tx.get("session_id")
            if item["stripe_paid"] == "paid":
                err = sync_transaction_status(
                    sid,
                    status=item["stripe_status"] or "complete",
                    payment_status="paid",
                )
                if err:
                    print(f"  [FAIL] sync status {sid}: {err}")
                    continue
            profile, err, applied = fulfill_paid_transaction(tx)
            if err:
                print(f"  [FAIL] fulfill {sid}: {err}")
                continue
            if applied:
                repaired += 1
                print(
                    f"  [OK] reparado {profile.get('email') if profile else sid} "
                    f"-> {profile.get('membership_type') if profile else '?'}"
                )
        print(f"\nReparados: {repaired}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
