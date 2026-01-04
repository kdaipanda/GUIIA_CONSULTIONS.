#!/usr/bin/env python3
"""
Script para auto-verificar cédula de usuario de desarrollo.
Ejecutar: python fix_dev_user_cedula.py
"""
import os
import sys
from datetime import datetime, timezone

# Agregar el directorio padre al path para importar supabase_client
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

from supabase_client import get_profile_by_email, update_profile

DEV_EMAIL = "carlos.hernandez@vetmed.com"
DEV_CEDULA = "87654321"

def main():
    # Cargar backend/.env para SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"), override=False)

    print(f"Buscando usuario de desarrollo: {DEV_EMAIL}")
    profile, err = get_profile_by_email(DEV_EMAIL)
    
    if err:
        print(f"Error: {err}")
        return 1
    
    if not profile:
        print(f"Usuario {DEV_EMAIL} no encontrado en Supabase.")
        print("Regístrate primero o verifica que el email sea correcto.")
        return 1
    
    print(f"Usuario encontrado: {profile.get('nombre', 'N/A')} (ID: {profile.get('id', 'N/A')})")
    
    current_status = (profile.get("cedula_verification_status") or "").strip()
    current_cedula = (profile.get("cedula_profesional") or "").strip()
    current_membership = (profile.get("membership_type") or "").strip()
    print(f"Estado actual de verificación: {current_status}")
    print(f"Cédula actual: {current_cedula or '(vacía)'}")
    print(f"Membresía actual: {current_membership or '(vacía)'}")

    print("Actualizando usuario de desarrollo (cédula + verificación + membresía)...")
    now = datetime.now(timezone.utc).isoformat()
    update_fields = {
        "cedula_profesional": DEV_CEDULA,
        "cedula_verification_status": "verified",
        "cedula_verification_checked_at": now,
        "cedula_sep_nombre": profile.get("nombre") or "Carlos Hernandez",
        "cedula_sep_profesion": "Médico Veterinario Zootecnista",
        "cedula_verification_error": None,
        # Para pruebas, forzar premium y créditos altos
        "membership_type": "premium",
        "consultations_remaining": 150,
    }
    
    if not profile.get("cedula_document_uploaded_at"):
        update_fields["cedula_document_uploaded_at"] = now
    
    err_upd = update_profile(profile["id"], update_fields)
    
    if err_upd:
        print(f"✗ Error actualizando: {err_upd}")
        return 1
    
    print("[OK] Usuario actualizado correctamente. Ahora debería poder hacer login sin bloqueos.")
    return 0

if __name__ == "__main__":
    sys.exit(main())


