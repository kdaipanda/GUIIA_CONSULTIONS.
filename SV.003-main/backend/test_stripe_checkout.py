"""
Script para probar la creacion de sesion de checkout de Stripe
"""
import os
import sys
from dotenv import load_dotenv

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))

load_dotenv()

STRIPE_API_KEY = os.getenv("STRIPE_API_KEY", "").strip()

print("=== Test de Stripe Checkout ===")
print(f"API Key configurada: {'SI' if STRIPE_API_KEY else 'NO'}")
print(f"Modo: {'LIVE' if STRIPE_API_KEY and 'sk_live' in STRIPE_API_KEY else ('TEST' if STRIPE_API_KEY and 'sk_test' in STRIPE_API_KEY else 'NO CONFIGURADA')}")
print()

if not STRIPE_API_KEY:
    print("ERROR: STRIPE_API_KEY no esta configurada")
    sys.exit(1)

try:
    import stripe
    stripe.api_key = STRIPE_API_KEY
    print("SDK de Stripe: Disponible")
    
    # Probar crear una sesion de checkout
    print("\nProbando creacion de sesion de checkout...")
    
    session = stripe.checkout.Session.create(
        mode="payment",
        success_url="https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url="https://example.com/cancel",
        line_items=[
            {
                "price_data": {
                    "currency": "mxn",
                    "product_data": {
                        "name": "Test Membership",
                    },
                    "unit_amount": 10000,  # 100.00 MXN
                },
                "quantity": 1,
            }
        ],
    )
    
    print(f"Sesion creada exitosamente!")
    print(f"Session ID: {session.id}")
    print(f"Checkout URL: {session.url}")
    print(f"URL valida: {'SI' if session.url and session.url.startswith('https://checkout.stripe.com') else 'NO'}")
    
except ImportError:
    print("ERROR: SDK de Stripe no disponible. Instala con: pip install stripe")
except Exception as e:
    print(f"ERROR al crear sesion: {str(e)}")
    import traceback
    traceback.print_exc()

