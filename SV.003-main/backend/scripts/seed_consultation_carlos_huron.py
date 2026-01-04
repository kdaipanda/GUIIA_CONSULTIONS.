"""
Crea consulta de prueba (Hurones) para carlos.hernandez@vetmed.com
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
        "status": "pending",
        "category": "hurones",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "payload": {
            "category": "hurones",
            "form_data": {
                "nombre_mascota": "Rocky",
                "edad": "2 anos",
                "raza": "Huron estandar",
                "peso": "0.9 kg",
                "sexo": "Macho",
                "motivo_consulta": "Letargo severo, dificultad respiratoria, anorexia desde hace 5 dias",
                "sintomas": "No come, respira con dificultad, duerme todo el tiempo, debilidad general, tos ocasional",
                "ultima_comida": "Hace 72 horas (rechazo completo)",
                "vacunas_vigentes": "Si (moquillo y rabia)",
                "medicamentos_actuales": "Ninguno",
                "condiciones_preexistentes": "Ninguna conocida",
                "temperatura": "39.2 C",
                "frecuencia_cardiaca": "240 lpm",
                "frecuencia_respiratoria": "45 rpm"
            },
            "nombre_mascota": "Rocky",
            "raza": "Huron estandar",
            "motivo_consulta": "Letargo severo, dificultad respiratoria, anorexia desde hace 5 dias",
            "detalle_paciente": """Huron macho de 2 anos que presenta cuadro de deterioro progresivo desde hace 5 dias.

Propietario reporta que el animal ha dejado de comer completamente desde hace 72 horas. Presenta disnea progresiva, 
tos ocasional y letargo severo. El hurón permanece en su refugio y apenas se mueve.

Al examen fisico:
- Temperatura: 39.2 C (elevada, normal: 37.8-40 C)
- Frecuencia cardiaca: 240 lpm (taquicardia moderada)
- Frecuencia respiratoria: 45 rpm (taquipnea, normal: 33-36 rpm)
- Mucosas palidas con ligera cianosis
- Respiracion con esfuerzo evidente, sonidos crepitantes audibles en auscultacion pulmonar
- Deshidratacion moderada (7%)
- Abdomen distendido, timpanismo a la percusion
- Condicion corporal 2/5 (perdida de masa muscular evidente)

Historia adicional:
- Vive en jaula amplia con acceso diario supervisado fuera
- Dieta: pellets premium para hurones + premios ocasionales
- Sin cambios recientes en el entorno
- No hay evidencia de acceso a plantas toxicas o productos quimicos
- Convive con otro huron que permanece sano

El propietario menciona que hace aproximadamente 1 semana el animal estuvo explorando una habitacion donde 
habia plantas ornamentales, pero no vio que comiera ninguna.

Vacunacion completa y al dia (moquillo y rabia). Sin enfermedades previas conocidas.

NOTA CRITICA: La combinacion de disnea progresiva, sonidos crepitantes pulmonares, anorexia completa y 
deterioro rapido requiere diagnostico urgente."""
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
    print(f"  paciente: Rocky")

if __name__ == "__main__":
    main()

