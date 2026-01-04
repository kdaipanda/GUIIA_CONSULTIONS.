#!/usr/bin/env python3
"""
Script para crear usuarios de prueba con diferentes niveles de membresía.

Ejecutar desde la carpeta backend:
    python scripts/create_test_users.py
"""

import os
import sys
from datetime import datetime, timedelta, timezone

# Agregar el directorio padre al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

from supabase_client import upsert_profile, get_profile_by_email

# Usuarios de prueba
TEST_USERS = [
    {
        "email": "basico@guiaa.vet",
        "cedula_profesional": "11111111",
        "nombre": "Usuario Básico Test",
        "telefono": "5551111111",
        "especialidad": "Medicina General",
        "años_experiencia": 3,
        "institucion": "UNAM",
        "membership_type": "basic",
        "consultations_remaining": 30,
    },
    {
        "email": "profesional@guiaa.vet",
        "cedula_profesional": "22222222",
        "nombre": "Usuario Profesional Test",
        "telefono": "5552222222",
        "especialidad": "Cirugía Veterinaria",
        "años_experiencia": 5,
        "institucion": "UAM",
        "membership_type": "professional",
        "consultations_remaining": 35,
    },
    {
        "email": "premium@guiaa.vet",
        "cedula_profesional": "33333333",
        "nombre": "Usuario Premium Test",
        "telefono": "5553333333",
        "especialidad": "Medicina de Exóticos",
        "años_experiencia": 10,
        "institucion": "IPN",
        "membership_type": "premium",
        "consultations_remaining": 150,
    },
]


def create_test_users():
    """Crea o actualiza los usuarios de prueba en Supabase."""
    
    print("=" * 60)
    print("  CREANDO USUARIOS DE PRUEBA")
    print("=" * 60)
    print()
    
    now = datetime.now(timezone.utc)
    expires = (now + timedelta(days=365)).isoformat()  # 1 año de membresía
    
    for user in TEST_USERS:
        email = user["email"]
        print(f"-> Procesando: {email}")
        
        # Verificar si ya existe
        existing, _ = get_profile_by_email(email)
        
        # Preparar perfil
        import uuid
        profile = {
            "id": existing["id"] if existing else str(uuid.uuid4()),
            "email": user["email"],
            "cedula_profesional": user["cedula_profesional"],
            "nombre": user["nombre"],
            "telefono": user["telefono"],
            "especialidad": user["especialidad"],
            "años_experiencia": user["años_experiencia"],
            "institucion": user["institucion"],
            "membership_type": user["membership_type"],
            "consultations_remaining": user["consultations_remaining"],
            "membership_expires": expires,
            "two_factor_enabled": False,
            # Verificación de cédula automática (usuarios de desarrollo)
            "cedula_verification_status": "verified",
            "cedula_sep_nombre": user["nombre"],
            "cedula_sep_profesion": "Médico Veterinario Zootecnista",
            "cedula_verification_checked_at": now.isoformat(),
            "cedula_document_uploaded_at": now.isoformat(),
        }
        
        if not existing:
            profile["created_at"] = now.isoformat()
        
        # Insertar/actualizar
        result, error = upsert_profile(profile)
        
        if error:
            print(f"   [ERROR] {error}")
        else:
            action = "Actualizado" if existing else "Creado"
            print(f"   [OK] {action}: {user['nombre']}")
            print(f"      Membresía: {user['membership_type'].upper()}")
            print(f"      Consultas: {user['consultations_remaining']}")
        
        print()
    
    print("=" * 60)
    print("  CREDENCIALES DE ACCESO")
    print("=" * 60)
    print()
    print("BASICO (30 consultas, solo perros y gatos)")
    print("  Email: basico@guiaa.vet")
    print("  Cedula: 11111111")
    print()
    print("PROFESIONAL (35 consultas, todas las categorias)")
    print("  Email: profesional@guiaa.vet")
    print("  Cedula: 22222222")
    print()
    print("PREMIUM (150 consultas, todas + analisis IA)")
    print("  Email: premium@guiaa.vet")
    print("  Cedula: 33333333")
    print()
    print("=" * 60)


if __name__ == "__main__":
    create_test_users()

