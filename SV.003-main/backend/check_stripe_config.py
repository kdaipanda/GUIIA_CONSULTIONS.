import os
from dotenv import load_dotenv

load_dotenv()

sk = os.getenv('STRIPE_API_KEY', '')
pk = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
ws = os.getenv('STRIPE_WEBHOOK_SECRET', '')

print('=== Configuracion de Stripe ===')
print(f'Clave Secreta (STRIPE_API_KEY): {"SI" if sk else "NO"} configurada')
if sk:
    modo = 'test' if 'sk_test' in sk else ('live' if 'sk_live' in sk else 'desconocido')
    print(f'  Modo: {modo}')
    print(f'  Prefijo: {sk[:7]}...' if len(sk) > 7 else '')

print(f'Clave Publica (STRIPE_PUBLISHABLE_KEY): {"SI" if pk else "NO"} configurada')
if pk:
    modo_pk = 'test' if 'pk_test' in pk else ('live' if 'pk_live' in pk else 'desconocido')
    print(f'  Modo: {modo_pk}')
    print(f'  Prefijo: {pk[:7]}...' if len(pk) > 7 else '')

print(f'Webhook Secret (STRIPE_WEBHOOK_SECRET): {"SI" if ws else "NO"} configurada')
print()
print('Para agregar la clave publica:')
print('   1. Ve a https://stripe.com -> Developers -> API keys')
print('   2. Copia la "Publishable key" (debe empezar con pk_test_ para modo test)')
print('   3. Agrega en backend/.env: STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx')

