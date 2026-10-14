"""Verifica cupo compartido: descuento al owner cuando un vet del equipo 'usa' CDS."""
from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
load_dotenv(BACKEND / ".env", override=False)

from clinic_db import (  # noqa: E402
    apply_team_membership_overlay,
    resolve_consultation_billing_profile_id,
)
from supabase_client import get_profile, get_profile_by_email, update_profile  # noqa: E402

OWNER = "gonzalezpardoceleste@gmail.com"
MEMBER = "citricostierracaliente@gmail.com"


def main() -> int:
    owner, _ = get_profile_by_email(OWNER)
    member, _ = get_profile_by_email(MEMBER)
    assert owner and member

    # Miembro no debe tener cupo personal paralelo (solo hereda del owner)
    if member.get("membership_type") or int(member.get("consultations_remaining") or 0) > 0:
        print("clearing member personal quota (shared pool on owner only)")
        err = update_profile(
            member["id"],
            {
                "membership_type": None,
                "consultations_remaining": 0,
                "membership_expires": None,
            },
        )
        print("clear_err", err)
        member, _ = get_profile(member["id"])

    before_owner = int(owner.get("consultations_remaining") or 0)
    print("owner_before", before_owner, owner.get("membership_type"))
    print("member_raw", member.get("membership_type"), member.get("consultations_remaining"))

    overlay = apply_team_membership_overlay(member)
    print(
        "member_overlay",
        overlay.get("membership_type"),
        overlay.get("consultations_remaining"),
        overlay.get("membership_source"),
        overlay.get("membership_owner_id") == owner["id"],
    )
    bill_to = resolve_consultation_billing_profile_id(member)
    print("bill_to_is_owner", bill_to == owner["id"], bill_to)

    if bill_to != owner["id"]:
        print("FAIL: billing no apunta al owner")
        return 1
    if overlay.get("consultations_remaining") != before_owner:
        print("FAIL: overlay no refleja cupo del owner")
        return 1

    # Simular 1 consulta del miembro
    new_rem = max(0, before_owner - 1)
    err = update_profile(owner["id"], {"consultations_remaining": new_rem})
    print("decrement_err", err)
    owner2, _ = get_profile(owner["id"])
    member2, _ = get_profile(member["id"])
    overlay2 = apply_team_membership_overlay(member2)
    print("owner_after", owner2.get("consultations_remaining"))
    print("member_overlay_after", overlay2.get("consultations_remaining"))

    ok = (
        int(owner2.get("consultations_remaining") or 0) == new_rem
        and int(overlay2.get("consultations_remaining") or 0) == new_rem
        and int(member2.get("consultations_remaining") or 0) == 0
    )

    # Restaurar
    update_profile(owner["id"], {"consultations_remaining": before_owner})
    owner3, _ = get_profile(owner["id"])
    print("restored", owner3.get("consultations_remaining"))

    if not ok:
        print("FAIL shared pool")
        return 1
    print("OK: cupo compartido — se descuenta del owner y el miembro lo ve igual")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
