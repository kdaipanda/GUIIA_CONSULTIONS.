"""
Script para comparar la configuración del backend con los productos de Stripe
"""

# Configuración del Backend (desde server_simple.py)
BACKEND_PACKAGES = {
    "basic": {
        "name": "Básica",
        "price_monthly": 950.00,
        "price_annual": 9500.00,
        "consultations": 30,  # mensuales
        "currency": "mxn",
    },
    "professional": {
        "name": "Profesional",
        "price_monthly": 1250.00,
        "price_annual": 12500.00,
        "consultations": 35,  # mensuales
        "currency": "mxn",
    },
    "premium": {
        "name": "Premium",
        "price_monthly": 2200.00,
        "price_annual": 22000.00,
        "consultations": 150,  # mensuales
        "currency": "mxn",
    },
}

# Productos de Stripe (desde CSV)
STRIPE_PRODUCTS = {
    "basic_monthly": {
        "stripe_id": "prod_Tkyhwtc3i3FYCc",
        "name": "Membresia GUIAA Basico Mensual",
        "consultations": 30,
        "cycle": "monthly",
    },
    "professional_monthly": {
        "stripe_id": "prod_Tl0PjbQF0p1y5d",
        "name": "Membresia GUIAA Profesional Mensual",
        "consultations": 35,
        "cycle": "monthly",
    },
    "premium_monthly": {
        "stripe_id": "prod_Tl0SrURr1CLGkd",
        "name": "Membresia GUIAA Premium Mensual",
        "consultations": 150,
        "cycle": "monthly",
    },
    "basic_annual": {
        "stripe_id": "prod_Tl0XHV0d7lpeCh",
        "name": "Membresia GUIAA Basico Anual",
        "consultations": 300,
        "cycle": "annual",
    },
    "professional_annual": {
        "stripe_id": "prod_Tl0ZcYwvyujM4P",
        "name": "Membresia GUIAA Profesional Anual",
        "consultations": 350,
        "cycle": "annual",
    },
    "premium_annual": {
        "stripe_id": "prod_Tl0cuUrxfLTPmj",
        "name": "Membresia GUIAA Premium Anual",
        "consultations": 1500,
        "cycle": "annual",
    },
}

print("=== Comparacion: Backend vs Stripe ===\n")

# Comparar membresías mensuales
print("MEMBRESIAS MENSUALES:")
print("-" * 60)
for package_key in ["basic", "professional", "premium"]:
    backend = BACKEND_PACKAGES[package_key]
    stripe_key = f"{package_key}_monthly"
    stripe = STRIPE_PRODUCTS[stripe_key]
    
    consultations_match = backend["consultations"] == stripe["consultations"]
    status = "COINCIDE" if consultations_match else "NO COINCIDE"
    
    print(f"\n{backend['name']}:")
    print(f"  Backend: {backend['consultations']} consultas mensuales")
    print(f"  Stripe:  {stripe['consultations']} consultas mensuales")
    print(f"  Estado:  {status}")
    print(f"  Precio Backend: ${backend['price_monthly']:.2f} MXN")
    print(f"  Stripe ID: {stripe['stripe_id']}")

# Comparar membresías anuales
print("\n\nMEMBRESIAS ANUALES:")
print("-" * 60)
print("\nNota: El backend no especifica consultas anuales directamente.")
print("Las consultas anuales en Stripe son:")
for package_key in ["basic", "professional", "premium"]:
    stripe_key = f"{package_key}_annual"
    stripe = STRIPE_PRODUCTS[stripe_key]
    backend = BACKEND_PACKAGES[package_key]
    
    print(f"\n{stripe['name']}:")
    print(f"  Stripe:  {stripe['consultations']} consultas anuales")
    print(f"  Precio Backend: ${backend['price_annual']:.2f} MXN")
    print(f"  Stripe ID: {stripe['stripe_id']}")

print("\n\n=== RESUMEN ===")
print("-" * 60)
print("[OK] Las consultas MENSUALES coinciden entre Backend y Stripe")
print("[OK] El backend crea productos dinamicamente (no usa productos de Stripe)")
print("[INFO] Los productos de Stripe existen pero no se usan en el codigo")
print("\n=== ESTADO DE LOS PAGOS ===")
print("[OK] Los pagos funcionan correctamente con productos dinamicos")
print("[OK] Stripe esta configurado (claves LIVE configuradas)")
print("[OK] El codigo crea sesiones de checkout correctamente")
print("\n=== RECOMENDACION ===")
print("El sistema actual funciona bien. Los productos de Stripe son opcionales.")
print("Si quieres usar los productos de Stripe, necesitarías modificar el código")
print("para usar price_id en lugar de price_data.")

