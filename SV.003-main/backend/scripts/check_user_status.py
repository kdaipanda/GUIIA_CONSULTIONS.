#!/usr/bin/env python3
"""
Script para verificar el estado de un usuario y sus consultas
"""
import os
import sys
from datetime import datetime
from pathlib import Path

# Agregar el directorio padre al path para importar módulos
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Cargar variables de entorno desde .env si existe
env_file = Path(__file__).parent.parent / ".env"
if env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(env_file)

from supabase_client import get_profile_by_email, list_consultations

def check_user_status(email: str):
    """Verifica el estado de un usuario y sus consultas"""
    print(f"\n{'='*60}")
    print(f"Verificando usuario: {email}")
    print(f"{'='*60}\n")
    
    # Obtener perfil del usuario
    profile, err = get_profile_by_email(email)
    
    if err:
        print(f"[ERROR] Error al buscar perfil: {err}")
        return
    
    if not profile:
        print(f"[ERROR] Usuario no encontrado con email: {email}")
        return
    
    # Mostrar información del perfil
    print("[INFO] INFORMACION DEL PERFIL:")
    print(f"   ID: {profile.get('id', 'N/A')}")
    print(f"   Nombre: {profile.get('nombre', 'N/A')}")
    print(f"   Email: {profile.get('email', 'N/A')}")
    print(f"   Cedula: {profile.get('cedula_profesional', 'N/A')}")
    print(f"   Membresia: {profile.get('membership_type', 'Sin membresia')}")
    print(f"   Consultas restantes: {profile.get('consultations_remaining', 0)}")
    
    membership_expires = profile.get('membership_expires')
    if membership_expires:
        print(f"   Membresia expira: {membership_expires}")
    else:
        print(f"   Membresia expira: No definido")
    
    print(f"\n{'='*60}")
    print("[CONSULTAS] CONSULTAS DEL USUARIO:")
    print(f"{'='*60}\n")
    
    # Obtener consultas del usuario
    user_id = profile.get('id')
    if not user_id:
        print("[ERROR] El usuario no tiene ID")
        return
    
    consultations, err = list_consultations(user_id, limit=100)
    
    if err:
        print(f"[ERROR] Error al obtener consultas: {err}")
        return
    
    if not consultations:
        print("[INFO] El usuario no tiene consultas registradas")
        return
    
    print(f"Total de consultas encontradas: {len(consultations)}\n")
    
    # Contar consultas por estado
    status_count = {}
    for consultation in consultations:
        status = consultation.get('status', 'unknown')
        status_count[status] = status_count.get(status, 0) + 1
    
    print("[RESUMEN] RESUMEN POR ESTADO:")
    for status, count in status_count.items():
        status_label = {
            'draft': 'Borrador',
            'in_progress': 'En Progreso',
            'completed': 'Completada'
        }.get(status, status)
        print(f"   {status_label}: {count}")
    
    print(f"\n{'='*60}")
    print("[DETALLE] DETALLE DE CONSULTAS:")
    print(f"{'='*60}\n")
    
    # Mostrar detalles de cada consulta
    for idx, consultation in enumerate(consultations, 1):
        consultation_id = consultation.get('id', 'N/A')
        status = consultation.get('status', 'unknown')
        created_at = consultation.get('created_at', 'N/A')
        category = consultation.get('payload', {}).get('category', 'N/A') if consultation.get('payload') else 'N/A'
        
        status_label = {
            'draft': 'Borrador',
            'in_progress': 'En Progreso',
            'completed': 'Completada'
        }.get(status, status)
        
        print(f"{idx}. Consulta ID: {consultation_id[:8]}...")
        print(f"   Estado: {status_label}")
        print(f"   Categoría: {category}")
        print(f"   Creada: {created_at}")
        
        # Verificar si tiene análisis
        has_analysis = bool(consultation.get('analysis') or consultation.get('ai_analysis'))
        if has_analysis:
            print(f"   [OK] Tiene analisis")
        else:
            print(f"   [WARN] Sin analisis")
        
        print()
    
    # Verificar consultas abiertas (draft o in_progress)
    open_consultations = [c for c in consultations if c.get('status') in ['draft', 'in_progress']]
    
    print(f"{'='*60}")
    print("[ABIERTAS] CONSULTAS ABIERTAS (Borrador o En Progreso):")
    print(f"{'='*60}\n")
    
    if open_consultations:
        print(f"Total: {len(open_consultations)} consulta(s) abierta(s)\n")
        for idx, consultation in enumerate(open_consultations, 1):
            consultation_id = consultation.get('id', 'N/A')
            status = consultation.get('status', 'unknown')
            created_at = consultation.get('created_at', 'N/A')
            
            status_label = {
                'draft': 'Borrador',
                'in_progress': 'En Progreso'
            }.get(status, status)
            
            print(f"{idx}. ID: {consultation_id[:8]}... | Estado: {status_label} | Creada: {created_at}")
    else:
        print("[INFO] No hay consultas abiertas")
    
    print(f"\n{'='*60}")
    print("[OK] VERIFICACION COMPLETA")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    email = "carlos.hernandez@vetmed.com"
    
    if len(sys.argv) > 1:
        email = sys.argv[1]
    
    check_user_status(email)

