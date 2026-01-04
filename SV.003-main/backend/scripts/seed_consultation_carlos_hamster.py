"""
Crea consulta de prueba (Hámster) para carlos.hernandez@vetmed.com
"""
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Agregar el directorio backend al path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv(dotenv_path=backend_dir / ".env")

from supabase_client import get_profile_by_email, insert_consultation

def main():
    # 1. Obtener el perfil de Carlos
    email = "carlos.hernandez@vetmed.com"
    profile, err = get_profile_by_email(email)
    
    if err or not profile:
        print(f"[ERROR] No se pudo obtener el perfil de {email}: {err}")
        return
    
    user_id = profile["id"]
    print(f"[OK] Perfil encontrado: {email} (ID: {user_id})")
    
    # 2. Datos de la consulta de hámster
    consultation_data = {
        "user_id": user_id,
        "status": "pending",  # Antes del análisis
        "category": "hamsters",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "payload": {
            "category": "hamsters",
            "form_data": {
                "nombre_mascota": "Coco",
                "edad": "1.5 anos",
                "raza": "Hámster sirio",
                "peso": "120 g",
                "sexo": "Macho",
                "motivo_consulta": "Letargo, pérdida de apetito y diarrea desde hace 3 dias",
                "sintomas": "Duerme mas de lo normal, no come, diarrea liquida, pelo erizado, ojos semicerrados",
                "ultima_comida": "Hace 36 horas (solo probo un poco de semilla)",
                "vacunas_vigentes": "No aplica (hámster)",
                "medicamentos_actuales": "Ninguno",
                "condiciones_preexistentes": "Ninguna conocida",
                "temperatura": "37.5 C",
                "frecuencia_cardiaca": "No medida",
                "frecuencia_respiratoria": "No medida"
            },
            "nombre_mascota": "Coco",
            "raza": "Hámster sirio",
            "motivo_consulta": "Letargo, pérdida de apetito y diarrea desde hace 3 dias",
            "detalle_paciente": """Hámster sirio macho de 1.5 anos que presenta cuadro de deterioro desde hace 3 dias.

Propietario reporta que Coco ha dejado de comer casi completamente desde hace 36 horas, solo probo un poco de semilla.
Duerme mucho mas de lo normal, presenta diarrea liquida y el pelo esta erizado. Los ojos estan semicerrados.

Al examen fisico:
- Temperatura: 37.5 C (normal-baja, normal: 36.5-38 C)
- Peso: 120 g (normal para hámster sirio adulto: 100-150 g)
- Condicion corporal: 2/5 (perdida de peso evidente)
- Pelo erizado y desordenado
- Ojos semicerrados (signo de malestar)
- Deshidratacion moderada (5-7%)
- Abdomen ligeramente distendido
- Diarrea liquida visible en la jaula
- Letargo severo, apenas se mueve

Historia adicional:
- Vive en jaula estandar para hámster con rueda, escondite y sustrato de viruta
- Dieta: mezcla comercial de semillas para hámster + frutas/verduras ocasionales
- Cambio de sustrato hace 5 dias (nueva marca de viruta)
- Sin cambios recientes en la dieta
- No hay evidencia de acceso a productos toxicos
- No convive con otros animales

El propietario menciona que hace aproximadamente 1 semana cambio la marca de sustrato (viruta) por una nueva marca mas economica.
Tambien menciona que ultimamente ha estado dando mas frutas de lo normal (manzana, uvas).

Vacunacion: No aplica para hámsters. Sin enfermedades previas conocidas.

NOTA CRITICA: Los hámsters son muy sensibles a cambios en la dieta y el sustrato. La combinacion de diarrea liquida, 
letargo, anorexia y deshidratacion en un hámster puede ser critica. La diarrea en roedores pequeños puede deshidratar 
rapidamente y ser fatal. Requiere atencion urgente."""
        }
    }
    
    # 3. Insertar la consulta
    inserted, err = insert_consultation(consultation_data)
    
    if err:
        print(f"[ERROR] No se pudo crear la consulta: {err}")
        return
    
    consultation_id = inserted.get("id") if inserted else "unknown"
    
    print(f"[OK] Consulta creada (Hámster)")
    print(f"  user_id: {user_id}")
    print(f"  consultation_id: {consultation_id}")
    print(f"  category: hamsters")
    print(f"  paciente: Coco")
    print(f"  status: pending (antes del analisis)")

if __name__ == "__main__":
    main()


