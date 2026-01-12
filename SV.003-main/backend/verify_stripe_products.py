"""
Script para verificar que los productos de Stripe coincidan con la configuración del backend
"""

# Productos de Stripe (desde el CSV)
STRIPE_PRODUCTS = {
    "prod_Tkyhwtc3i3FYCc": {
        "name": "Membresia GUIAA Basico Mensual",
        "consultations": 30,
        "cycle": "monthly",
        "package_key": "basic"
    },
    "prod_Tl0PjbQF0p1y5d": {
        "name": "Membresia GUIAA Profesional Mensual",
        "consultations": 35,
        "cycle": "monthly",
        "package_key": "professional"
    },
    "prod_Tl0SrURr1CLGkd": {
        "name": "Membresia GUIAA Premium Mensual",
        "consultations": 150,
        "cycle": "monthly",
        "package_key": "premium"
    },
    "prod_Tl0XHV0d7lpeCh": {
        "name": "Membresia GUIAA Basico Anual",
        "consultations": 300,
        "cycle": "annual",
        "package_key": "basic"
    },
    "prod_Tl0ZcYwvyujM4P": {
        "name": "Membresia GUIAA Profesional Anual",
        "consultations": 350,
        "cycle": "annual",
        "package_key": "professional"
    },
    "prod_Tl0cuUrxfLTPmj": {
        "name": "Membresia GUIAA Premium Anual",
        "consultations": 1500,
        "cycle": "annual",
        "package_key": "premium"
    },
    "prod_Tl0fjBTflSJtHh": {
        "name": "10 Consultas Extras GUIAA",
        "consultations": 10,
        "cycle": "one_time",
        "package_key": "consultation_credits"
    }
}

# Configuración esperada del backend (necesitamos obtenerla del código)
# Por ahora, usaremos la que vimos en server.py como referencia

print("=== Productos de Stripe ===")
print(f"Total productos: {len(STRIPE_PRODUCTS)}")
print()

for prod_id, prod_info in STRIPE_PRODUCTS.items():
    print(f"Producto: {prod_info['name']}")
    print(f"  ID: {prod_id}")
    print(f"  Consultas: {prod_info['consultations']}")
    print(f"  Ciclo: {prod_info['cycle']}")
    print(f"  Package Key: {prod_info['package_key']}")
    print()

print("\n=== Notas ===")
print("1. El backend actualmente NO usa IDs de productos de Stripe")
print("2. El backend crea productos dinámicamente en cada checkout")
print("3. Necesitamos verificar que las consultas y precios coincidan")
print("\n4. Para usar productos de Stripe, necesitaríamos:")
print("   - Configurar price_ids en el backend")
print("   - Modificar el código para usar price_id en lugar de price_data")
print("   - Mapear productos de Stripe a packages del backend")

