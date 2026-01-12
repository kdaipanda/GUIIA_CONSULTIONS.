#!/usr/bin/env python3
"""
Script para aplicar la migración de payment_transactions a Supabase.
Ejecutar desde el directorio backend/scripts o desde la raíz del proyecto.
"""

import os
import sys
from pathlib import Path

# Agregar el directorio backend al path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

try:
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
except ImportError:
    print("ERROR: psycopg2-binary no está instalado.")
    print("Instala con: pip install psycopg2-binary")
    sys.exit(1)


def apply_migration():
    """Aplica la migración SQL de payment_transactions."""
    
    # Leer la conexión desde variable de entorno o pedirla
    conn_string = os.getenv("SUPABASE_DB_URL")
    
    if not conn_string:
        print("=" * 60)
        print("MIGRACIÓN: payment_transactions")
        print("=" * 60)
        print("\nNecesitas proporcionar la cadena de conexión de PostgreSQL de Supabase.")
        print("Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres")
        print("\nPuedes:")
        print("1. Establecer la variable de entorno SUPABASE_DB_URL")
        print("2. O ingresarla ahora (se ocultará la contraseña)")
        print("\nIMPORTANTE: Si tu contraseña tiene caracteres especiales, URL-encodéala.")
        print("Ejemplo: '#' se convierte en '%23', espacios en '+' o '%20'")
        print("-" * 60)
        
        conn_string = input("\nCadena de conexión PostgreSQL: ").strip()
        
        if not conn_string:
            print("ERROR: Cadena de conexión requerida.")
            sys.exit(1)
    
    # Leer el archivo SQL
    migration_file = backend_dir / "supabase_migrations" / "20251229_payment_transactions.sql"
    
    if not migration_file.exists():
        print(f"ERROR: No se encontró el archivo de migración: {migration_file}")
        sys.exit(1)
    
    sql_content = migration_file.read_text(encoding="utf-8")
    
    print("\n" + "=" * 60)
    print("Aplicando migración: payment_transactions")
    print("=" * 60)
    print(f"Archivo: {migration_file.name}")
    print(f"Tamaño: {len(sql_content)} caracteres")
    print("-" * 60)
    
    try:
        # Conectar a Supabase
        print("\n[1/3] Conectando a Supabase...")
        conn = psycopg2.connect(conn_string)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        print("✓ Conexión establecida")
        
        # Verificar si la tabla ya existe
        print("\n[2/3] Verificando estado actual...")
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'payment_transactions'
            );
        """)
        table_exists = cur.fetchone()[0]
        
        if table_exists:
            print("⚠ La tabla 'payment_transactions' ya existe.")
            response = input("¿Deseas continuar? (puede actualizar índices/comentarios) [s/N]: ").strip().lower()
            if response not in ['s', 'si', 'sí', 'y', 'yes']:
                print("Migración cancelada.")
                cur.close()
                conn.close()
                return
        else:
            print("✓ La tabla no existe, se creará.")
        
        # Ejecutar la migración
        print("\n[3/3] Ejecutando migración SQL...")
        cur.execute(sql_content)
        print("✓ Migración ejecutada exitosamente")
        
        # Verificar que se creó correctamente
        cur.execute("""
            SELECT 
                column_name, 
                data_type, 
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'payment_transactions'
            ORDER BY ordinal_position;
        """)
        columns = cur.fetchall()
        
        print("\n" + "=" * 60)
        print("RESUMEN DE LA MIGRACIÓN")
        print("=" * 60)
        print(f"Tabla: payment_transactions")
        print(f"Columnas creadas: {len(columns)}")
        print("\nColumnas:")
        for col_name, data_type, is_nullable in columns:
            nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
            print(f"  - {col_name}: {data_type} ({nullable})")
        
        # Verificar índices
        cur.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'payment_transactions' 
            AND schemaname = 'public';
        """)
        indexes = [row[0] for row in cur.fetchall()]
        print(f"\nÍndices creados: {len(indexes)}")
        for idx in indexes:
            print(f"  - {idx}")
        
        cur.close()
        conn.close()
        
        print("\n" + "=" * 60)
        print("✓ MIGRACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 60)
        print("\nLa tabla payment_transactions está lista para usar.")
        print("Las transacciones de pago ahora se guardarán en Supabase.")
        
    except psycopg2.Error as e:
        print(f"\n❌ ERROR de PostgreSQL: {e}")
        print("\nVerifica:")
        print("  - Que la cadena de conexión sea correcta")
        print("  - Que tu contraseña esté URL-encodéada si tiene caracteres especiales")
        print("  - Que tengas permisos para crear tablas en Supabase")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    apply_migration()






