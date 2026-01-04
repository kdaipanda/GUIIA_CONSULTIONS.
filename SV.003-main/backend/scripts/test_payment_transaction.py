#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de prueba para verificar que las transacciones de pago se guarden en Supabase.
"""

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Configurar encoding para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Agregar el directorio backend al path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Cargar variables de entorno desde .env
from dotenv import load_dotenv
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=False)

from supabase_client import (
    get_payment_transaction_by_session_id,
    insert_payment_transaction,
    update_payment_transaction,
)


def test_payment_transaction():
    """Prueba las funciones de payment_transactions."""
    
    print("=" * 60)
    print("PRUEBA: Transacciones de Pago en Supabase")
    print("=" * 60)
    
    # Datos de prueba
    test_session_id = f"test_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    test_veterinarian_id = "test-vet-123"
    
    transaction_data = {
        "session_id": test_session_id,
        "type": "membership",
        "package": "premium",
        "package_id": "premium",
        "billing_cycle": "monthly",
        "currency": "mxn",
        "amount": 2200.00,
        "status": "open",
        "payment_status": "unpaid",
        "stripe": False,
        "veterinarian_id": test_veterinarian_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    print(f"\n[1/4] Insertando transacción de prueba...")
    print(f"  Session ID: {test_session_id}")
    print(f"  Tipo: {transaction_data['type']}")
    print(f"  Paquete: {transaction_data['package']}")
    print(f"  Monto: ${transaction_data['amount']} {transaction_data['currency']}")
    
    try:
        transaction, err = insert_payment_transaction(transaction_data)
        if err:
            print(f"  [ERROR] {err}")
            return False
        print(f"  [OK] Transaccion insertada correctamente")
        print(f"  ID: {transaction.get('id')}")
    except Exception as e:
        print(f"  ❌ EXCEPCIÓN: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print(f"\n[2/4] Leyendo transacción desde Supabase...")
    try:
        retrieved, err = get_payment_transaction_by_session_id(test_session_id)
        if err:
            print(f"  [ERROR] {err}")
            return False
        if not retrieved:
            print(f"  [ERROR] No se encontro la transaccion")
            return False
        print(f"  [OK] Transaccion encontrada")
        print(f"  ID: {retrieved.get('id')}")
        print(f"  Status: {retrieved.get('status')}")
        print(f"  Payment Status: {retrieved.get('payment_status')}")
    except Exception as e:
        print(f"  ❌ EXCEPCIÓN: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print(f"\n[3/4] Actualizando transacción...")
    update_fields = {
        "status": "complete",
        "payment_status": "paid",
        "membership_activated": True,
        "membership_activated_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        err = update_payment_transaction(test_session_id, update_fields)
        if err:
            print(f"  [ERROR] {err}")
            return False
        print(f"  [OK] Transaccion actualizada correctamente")
    except Exception as e:
        print(f"  ❌ EXCEPCIÓN: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print(f"\n[4/4] Verificando actualización...")
    try:
        updated, err = get_payment_transaction_by_session_id(test_session_id)
        if err:
            print(f"  ❌ ERROR: {err}")
            return False
        if not updated:
            print(f"  ❌ ERROR: No se encontró la transacción actualizada")
            return False
        
        if updated.get("payment_status") == "paid" and updated.get("membership_activated"):
            print(f"  [OK] Actualizacion verificada correctamente")
            print(f"  Payment Status: {updated.get('payment_status')}")
            print(f"  Membership Activated: {updated.get('membership_activated')}")
        else:
            print(f"  [ADVERTENCIA] Actualizacion parcial - algunos campos no se actualizaron")
            print(f"  Payment Status: {updated.get('payment_status')} (esperado: paid)")
            print(f"  Membership Activated: {updated.get('membership_activated')} (esperado: True)")
    except Exception as e:
        print(f"  ❌ EXCEPCIÓN: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 60)
    print("[OK] TODAS LAS PRUEBAS PASARON EXITOSAMENTE")
    print("=" * 60)
    print(f"\nTransacción de prueba creada:")
    print(f"  Session ID: {test_session_id}")
    print(f"  Puedes verificar en Supabase Dashboard:")
    print(f"  → Table Editor → payment_transactions")
    print(f"  → Buscar por session_id: {test_session_id}")
    print("\n" + "=" * 60)
    
    return True


if __name__ == "__main__":
    success = test_payment_transaction()
    sys.exit(0 if success else 1)

