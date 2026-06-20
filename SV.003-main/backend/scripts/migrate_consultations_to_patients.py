#!/usr/bin/env python3
"""
Migra consultas históricas: extrae clientes/pacientes desde payload.form_data
y enlaza consultations con patient_id / client_id / organization_id.

Uso:
  cd backend
  python scripts/migrate_consultations_to_patients.py [--dry-run]
"""
from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"), override=False)

import clinic_db  # noqa: E402
from supabase_client import get_supabase_client, list_profiles  # noqa: E402


def normalize_key(name: str) -> str:
    return " ".join((name or "").strip().lower().split())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="No escribe en BD")
    args = parser.parse_args()

    client = get_supabase_client()
    profiles, err = list_profiles(limit=5000)
    if err:
        print(f"Error listando perfiles: {err}")
        sys.exit(1)

    stats = {"clients_created": 0, "patients_created": 0, "consultations_linked": 0, "skipped": 0}

    for profile in profiles:
        vet_id = profile.get("id")
        if not vet_id:
            continue

        org_ctx, org_err = clinic_db.ensure_organization_for_profile(
            vet_id, f"Consultorio {profile.get('nombre') or vet_id}"
        )
        if org_err or not org_ctx:
            print(f"[WARN] Sin org para {vet_id}: {org_err}")
            continue

        org_id = (org_ctx.get("organization") or {}).get("id") or (
            org_ctx.get("membership") or {}
        ).get("organization_id")

        resp = (
            client.table("consultations")
            .select("*")
            .eq("user_id", vet_id)
            .execute()
        )
        consultations = resp.data or []

        client_cache: dict[str, str] = {}
        patient_cache: dict[str, str] = {}

        for row in consultations:
            if row.get("patient_id"):
                stats["skipped"] += 1
                continue

            payload = row.get("payload") or {}
            form = payload.get("form_data") or payload.get("consultation_data") or {}
            owner_name = (
                form.get("nombre_dueño")
                or form.get("nombre_dueno")
                or form.get("nombre_dueño")
                or ""
            ).strip()
            pet_name = (form.get("nombre_mascota") or "").strip()
            species = form.get("especie") or payload.get("category") or form.get("category") or ""

            if not owner_name and not pet_name:
                stats["skipped"] += 1
                continue

            owner_key = normalize_key(owner_name or "Sin nombre")
            pet_key = f"{owner_key}::{normalize_key(pet_name or 'paciente')}"

            client_id = client_cache.get(owner_key)
            if not client_id:
                if args.dry_run:
                    client_id = f"dry-client-{owner_key[:8]}"
                else:
                    existing, _ = clinic_db.list_clients(org_id, search=owner_name, limit=5)
                    match = next(
                        (c for c in existing if normalize_key(c.get("name", "")) == owner_key),
                        None,
                    )
                    if match:
                        client_id = match["id"]
                    else:
                        created, ins_err = clinic_db.insert_client(
                            {
                                "organization_id": org_id,
                                "name": owner_name or "Propietario sin nombre",
                                "phone": form.get("telefono") or form.get("phone"),
                                "email": form.get("email"),
                            }
                        )
                        if ins_err or not created:
                            print(f"[WARN] Cliente no creado: {ins_err}")
                            continue
                        client_id = created["id"]
                        stats["clients_created"] += 1
                client_cache[owner_key] = client_id

            patient_id = patient_cache.get(pet_key)
            if not patient_id:
                if args.dry_run:
                    patient_id = f"dry-patient-{pet_key[:8]}"
                else:
                    created_p, p_err = clinic_db.insert_patient(
                        {
                            "organization_id": org_id,
                            "client_id": client_id,
                            "name": pet_name or "Paciente sin nombre",
                            "species": species,
                            "breed": form.get("raza"),
                            "sex": form.get("sexo"),
                            "weight_kg": _parse_weight(form.get("peso")),
                        }
                    )
                    if p_err or not created_p:
                        print(f"[WARN] Paciente no creado: {p_err}")
                        continue
                    patient_id = created_p["id"]
                    stats["patients_created"] += 1
                patient_cache[pet_key] = patient_id

            if args.dry_run:
                stats["consultations_linked"] += 1
                continue

            update_fields = {
                "organization_id": org_id,
                "client_id": client_id,
                "patient_id": patient_id,
            }
            try:
                client.table("consultations").update(update_fields).eq("id", row["id"]).execute()
                stats["consultations_linked"] += 1
            except Exception as exc:  # noqa: BLE001
                update_fields.pop("organization_id", None)
                try:
                    client.table("consultations").update(
                        {"client_id": client_id, "patient_id": patient_id}
                    ).eq("id", row["id"]).execute()
                    stats["consultations_linked"] += 1
                except Exception as exc2:  # noqa: BLE001
                    print(f"[WARN] Consulta {row.get('id')}: {exc} / {exc2}")

    print("Migración completada:", stats)


def _parse_weight(value):
    if value is None or value == "":
        return None
    try:
        return float(str(value).replace(",", ".").split()[0])
    except (ValueError, IndexError):
        return None


if __name__ == "__main__":
    main()
