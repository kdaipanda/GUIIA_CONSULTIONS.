"""
Crea nueva consulta de prueba (Hurones) para carlos.hernandez@vetmed.com
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
    
    # 2. Datos de la consulta de hurón
    consultation_data = {
        "user_id": user_id,
        "status": "pending",  # Antes del análisis
        "category": "hurones",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "payload": {
            "category": "hurones",
            "form_data": {
                "nombre_mascota": "Luna",
                "edad": "4 anos",
                "raza": "Huron estandar",
                "peso": "1.0 kg",
                "sexo": "Hembra",
                "motivo_consulta": "Anorexia completa, letargo extremo y debilidad desde hace 4 dias",
                "sintomas": "No come nada, duerme constantemente, debilidad severa, dificultad para moverse, mucosas muy palidas",
                "ultima_comida": "Hace 96 horas (rechazo total de alimento)",
                "vacunas_vigentes": "Si (moquillo y rabia)",
                "medicamentos_actuales": "Ninguno",
                "condiciones_preexistentes": "Ninguna conocida",
                "temperatura": "38.2 C",
                "frecuencia_cardiaca": "200 lpm",
                "frecuencia_respiratoria": "30 rpm"
            },
            "nombre_mascota": "Luna",
            "raza": "Huron estandar",
            "motivo_consulta": "Anorexia completa, letargo extremo y debilidad desde hace 4 dias",
            "detalle_paciente": """Huron hembra de 4 anos que presenta cuadro critico de deterioro progresivo desde hace 4 dias.

Propietario reporta que Luna ha dejado de comer completamente desde hace 96 horas. Presenta letargo extremo, 
duerme casi todo el tiempo y muestra debilidad severa que le impide moverse normalmente. Las mucosas estan muy palidas.

Al examen fisico:
- Temperatura: 38.2 C (normal-baja, normal: 37.8-40 C)
- Frecuencia cardiaca: 200 lpm (normal para hurones)
- Frecuencia respiratoria: 30 rpm (normal)
- Mucosas muy palidas (cianosis leve)
- Deshidratacion severa (8-10%)
- Condicion corporal 1.5/5 (perdida de masa muscular muy evidente)
- Debilidad muscular generalizada
- Abdomen ligeramente distendido
- No hay evidencia de dolor a la palpacion abdominal

Historia adicional:
- Vive en jaula amplia con acceso diario supervisado
- Dieta: pellets premium para hurones + premios ocasionales
- Sin cambios recientes en el entorno
- No hay evidencia de acceso a plantas toxicas o productos quimicos
- Convive con otro huron que permanece sano

El propietario menciona que hace aproximadamente 2 semanas Luna estuvo explorando una zona donde habia productos de limpieza, 
pero no vio que ingiriera nada. Sin embargo, el propietario no esta seguro.

Vacunacion completa y al dia (moquillo y rabia). Sin enfermedades previas conocidas.

NOTA CRITICA: La combinacion de anorexia completa de 96 horas, letargo extremo, debilidad severa, mucosas muy palidas 
y deshidratacion severa indica un cuadro critico que requiere diagnostico urgente. La hipoglucemia es una posibilidad 
muy alta en hurones con anorexia prolongada."""
        }
    }
    
    # 3. Insertar la consulta
    inserted, err = insert_consultation(consultation_data)
    
    if err:
        print(f"[ERROR] No se pudo crear la consulta: {err}")
        return
    
    consultation_id = inserted.get("id") if inserted else "unknown"
    
    print(f"[OK] Consulta creada (Hurones)")
    print(f"  user_id: {user_id}")
    print(f"  consultation_id: {consultation_id}")
    print(f"  category: hurones")
    print(f"  paciente: Luna")
    print(f"  status: pending (antes del analisis)")

if __name__ == "__main__":
    main()





