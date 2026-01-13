#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para eliminar usuarios por email.
Uso: python delete_users.py email1@example.com email2@example.com
"""

import sys
import os
import io

# Configurar UTF-8 para Windows
if sys.platform == "win32":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except (AttributeError, OSError):
        pass

from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Agregar el directorio actual al path para importar supabase_client
sys.path.insert(0, os.path.dirname(__file__))

from supabase_client import delete_profile_by_email

def main():
    if len(sys.argv) < 2:
        print("Uso: python delete_users.py email1@example.com email2@example.com ...")
        sys.exit(1)
    
    emails = sys.argv[1:]
    print(f"Eliminando {len(emails)} usuario(s)...\n")
    
    for email in emails:
        print(f"Eliminando usuario: {email}")
        success, error = delete_profile_by_email(email)
        
        if success:
            print(f"  [OK] Usuario {email} eliminado correctamente\n")
        else:
            print(f"  [ERROR] Error eliminando {email}: {error}\n")
    
    print("Proceso completado.")

if __name__ == "__main__":
    main()

