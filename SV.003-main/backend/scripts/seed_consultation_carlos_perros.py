#!/usr/bin/env python3
"""
Semilla una consulta de prueba (Perros) para carlos.hernandez@vetmed.com
para que puedas entrar al historial y ejecutar "Obtener Análisis" (Claude).

Ejecutar desde backend/:
    python scripts/seed_consultation_carlos_perros.py
"""

import os
import sys
import uuid
from datetime import datetime, timezone

# Agregar el directorio padre al path para importar supabase_client
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
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

    # Caso de prueba (Perros)
    form_data = {
        "fecha": datetime.now().strftime("%Y-%m-%d"),
        "nombre_mascota": "Pepo",
        "nombre_dueño": "Víctor Olvera",
        "raza": "Labrador Retriever",
        "mix": "NO",
        "edad": "6 años",
        "peso": "28 kg",
        "condicion_corporal": "7/9",
        "sexo": "Macho",
        "estado_reproductivo": "Castrado",
        "vacunas_vigentes": "SI",
        "desparasitacion_interna": "SI",
        "desparasitacion_interna_cual": "Milbemax (hace 3 meses)",
        "desparasitacion_externa": "SI",
        "desparasitacion_externa_producto": "Bravecto (hace 1 mes)",
        "habitat": "Casa con patio",
        "zona_geografica": "CDMX",
        "alimentacion_seco": "SI",
        "alimentacion_frecuencia": "2 veces/día",
        "paseos": "SI",
        "paseos_frecuencia": "2 diarios",
    }

    detalle = (
        "Motivo de consulta: vómito y letargo agudos.\n\n"
        "Inicio hace 10-12 horas: 5 episodios de vómito (primero alimento, después bilis espumosa). "
        "Anorexia desde la mañana, toma poca agua. Un episodio de diarrea blanda sin sangre. "
        "Decaído, postura encorvada, dolor abdominal leve al cargarlo.\n\n"
        "Exposición: anoche comió restos de comida grasosa (carne/embutidos) y pudo acceder a basura. "
        "No venenos conocidos. Mastica juguetes (no se ha visto ingestión).\n\n"
        "Signos reportados: T° 39.3°C, FC 140, FR 36. Mucosas rosadas, TRC 2-3 s. Deshidratación ~6%. "
        "Dolor epigástrico a palpación, abdomen blando. Micción disminuida hoy.\n\n"
        "Objetivo: descartar pancreatitis aguda vs gastroenteritis por indiscreción alimentaria vs cuerpo extraño. "
        "Solicito plan diagnóstico, tratamiento inicial y criterios de urgencia."
    )

    row = {
        "id": consultation_id,
        "user_id": vet_id,
        "payload": {
            "category": "perros",
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

    print("[OK] Consulta creada")
    print(f"  user_id: {vet_id}")
    print(f"  consultation_id: {inserted.get('id') if inserted else consultation_id}")
    print("  category: perros")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


