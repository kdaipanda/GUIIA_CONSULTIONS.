#!/usr/bin/env python3
"""
Semilla una consulta de prueba (Conejos) para carlos.hernandez@vetmed.com
para que puedas entrar al historial y ejecutar "Obtener Análisis" (Claude).

Ejecutar desde backend/:
    python scripts/seed_consultation_carlos_conejo.py
"""

import os
import sys
import uuid
from datetime import datetime, timezone

# Agregar el directorio padre al path para importar supabase_client
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv  # noqa: E402
from supabase_client import get_profile_by_email, insert_consultation  # noqa: E402

DEV_EMAIL = "carlos.hernandez@vetmed.com"


def main() -> int:
    # Cargar backend/.env para SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"), override=False)

    profile, err = get_profile_by_email(DEV_EMAIL)
    if err:
        print(f"[ERROR] get_profile_by_email: {err}")
        return 1
    if not profile:
        print(f"[ERROR] No existe perfil para {DEV_EMAIL}. Regístrate primero.")
        return 1

    vet_id = profile["id"]
    consultation_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    form_data = {
        "fecha": datetime.now().strftime("%Y-%m-%d"),
        "nombre_mascota": "Nube",
        "nombre_dueño": "Ana López",
        "raza": "Enano Holandés",
        "mix": "NO",
        "edad": "2 años 8 meses",
        "peso": "1.35 kg",
        "condicion_corporal": "4/9",
        "sexo": "Hembra",
        "estado_reproductivo": "No esterilizada",
        "vacunas_vigentes": "SI",
        "vacunas_cual": "Mixomatosis / RHD",
        "desparasitacion_interna": "SI",
        "desparasitacion_interna_cual": "hace 4 meses",
        "desparasitacion_externa": "NO",
        "habitat": "Interior (jaula + tiempo suelta)",
        "zona_geografica": "Guadalajara",
        "alimentacion_seco": "Pellets (1 cucharada/día) - rechazo reciente",
        "alimentacion_casero": "Verduras (poca aceptación)",
        "alimentacion_frecuencia": "Heno a libre demanda (come menos)",
    }

    detalle = (
        "Motivo de consulta: anorexia parcial, heces pequeñas y disminución de actividad.\n\n"
        "Historia:\n"
        "Conejo hembra no esterilizada, 2 años 8 meses, 1.35 kg. Desde hace 24-36 horas come muy poco "
        "(rechaza pellets, apenas mordisquea heno), está más quieta y se esconde. Las heces son más pequeñas, "
        "secas y en menor cantidad. No se ha observado diarrea. Bebida disminuida.\n\n"
        "Signos asociados:\n"
        "Bruxismo ocasional (posible dolor). Postura encorvada por momentos. No estornudos ni secreción nasal. "
        "No tos.\n\n"
        "Exposiciones y cambios:\n"
        "Ayer se cambió el tipo de heno y hubo estrés por visita/ruido. No acceso a plantas tóxicas conocido. "
        "Vive con otro conejo sin signos.\n\n"
        "Antecedentes:\n"
        "Episodios previos leves de bolitas pequeñas tras estrés. No medicación actual. Vacunas al día.\n\n"
        "Exploración (si aplica):\n"
        "T° 38.8°C, FC 220, FR 60. Mucosas rosadas, TRC 2 s. Deshidratación leve (~5%). "
        "Abdomen con borborigmos disminuidos. Dolor leve en abdomen craneal. Incisivos normales; "
        "no se ha evaluado fondo oral.\n\n"
        "Objetivo:\n"
        "Descartar íleo/estasis gastrointestinal vs dolor dental (molares) vs estrés/dieta. "
        "Solicito plan diagnóstico y tratamiento inicial seguro para conejo (analgesia, soporte nutricional) "
        "y criterios de urgencia."
    )

    row = {
        "id": consultation_id,
        "user_id": vet_id,
        "payload": {
            "category": "conejos",
            "form_data": form_data,
            "detalle_paciente": detalle,
        },
        "status": "draft",
        "created_at": created_at,
    }

    inserted, err_ins = insert_consultation(row)
    if err_ins:
        print(f"[ERROR] insert_consultation: {err_ins}")
        return 1

    print("[OK] Consulta creada (Conejos)")
    print(f"  user_id: {vet_id}")
    print(f"  consultation_id: {inserted.get('id') if inserted else consultation_id}")
    print("  category: conejos")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())



