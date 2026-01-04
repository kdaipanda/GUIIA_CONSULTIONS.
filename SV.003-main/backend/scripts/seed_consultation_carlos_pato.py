"""
Crea consulta de prueba (Pato) para carlos.hernandez@vetmed.com
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
    
    # 2. Datos de la consulta de pato
    consultation_data = {
        "user_id": user_id,
        "status": "pending",  # Antes del análisis
        "category": "patos_pollos",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "payload": {
            "category": "patos_pollos",
            "form_data": {
                "nombre_mascota": "Donald",
                "edad": "2 anos",
                "raza": "Pato Pekin",
                "peso": "3.2 kg",
                "sexo": "Macho",
                "motivo_consulta": "Letargo, perdida de apetito y dificultad respiratoria desde hace 4 dias",
                "sintomas": "Duerme mucho, no come, respira con el pico abierto, plumaje erizado, secrecion nasal",
                "ultima_comida": "Hace 48 horas (rechazo de alimento)",
                "vacunas_vigentes": "No aplica (pato domestico)",
                "medicamentos_actuales": "Ninguno",
                "condiciones_preexistentes": "Ninguna conocida",
                "temperatura": "No medida",
                "frecuencia_cardiaca": "No medida",
                "frecuencia_respiratoria": "No medida"
            },
            "nombre_mascota": "Donald",
            "raza": "Pato Pekin",
            "motivo_consulta": "Letargo, perdida de apetito y dificultad respiratoria desde hace 4 dias",
            "detalle_paciente": """Pato Pekin macho de 2 anos que presenta cuadro de deterioro desde hace 4 dias.

Propietario reporta que Donald ha dejado de comer desde hace 48 horas. Presenta letargo severo, duerme mucho 
y muestra dificultad respiratoria evidente (respira con el pico abierto). El plumaje esta erizado y hay 
secrecion nasal visible.

Al examen fisico:
- Peso: 3.2 kg (normal para pato Pekin adulto: 3-4 kg)
- Condicion corporal: 2.5/5 (perdida de peso moderada)
- Plumaje erizado y desordenado
- Secrecion nasal serosa a mucopurulenta
- Respira con el pico abierto (disnea)
- Sonidos respiratorios audibles (estertores)
- Ojos semicerrados
- Deshidratacion moderada (5-7%)
- Letargo severo, apenas se mueve
- No hay evidencia de cojera o problemas en las patas

Historia adicional:
- Vive en estanque al aire libre con acceso a pasto y agua
- Dieta: alimento comercial para patos + pasto + insectos naturales
- Convive con otros 3 patos que permanecen sanos
- Sin cambios recientes en el entorno o dieta
- No hay evidencia de acceso a productos quimicos o toxicos
- El estanque se limpia semanalmente

El propietario menciona que hace aproximadamente 1 semana hubo un cambio brusco de temperatura (frio intenso 
seguido de calor), pero los otros patos no se afectaron.

Vacunacion: No aplica para patos domesticos. Sin enfermedades previas conocidas.

NOTA CRITICA: Las aves acuaticas pueden ocultar signos de enfermedad hasta fases avanzadas. La combinacion de 
anorexia, disnea, secrecion nasal y letargo en un pato puede indicar enfermedad respiratoria grave o sistémica. 
La dificultad respiratoria en aves es siempre un signo critico que requiere atencion urgente. Ademas, las aves 
con signos inespecificos deben evaluarse para Chlamydia psittaci (psitacosis) como diagnostico diferencial, 
aunque sea un pato y no un psitacido."""
        }
    }
    
    # 3. Insertar la consulta
    inserted, err = insert_consultation(consultation_data)
    
    if err:
        print(f"[ERROR] No se pudo crear la consulta: {err}")
        return
    
    consultation_id = inserted.get("id") if inserted else "unknown"
    
    print(f"[OK] Consulta creada (Pato)")
    print(f"  user_id: {user_id}")
    print(f"  consultation_id: {consultation_id}")
    print(f"  category: patos_pollos")
    print(f"  paciente: Donald")
    print(f"  status: pending (antes del analisis)")

if __name__ == "__main__":
    main()


