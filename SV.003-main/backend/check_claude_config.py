import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('ANTHROPIC_API_KEY', '')
model = os.getenv('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514')

print('=== Configuracion de Claude (Anthropic) ===')
print(f'API Key (ANTHROPIC_API_KEY): {"SI" if api_key else "NO"} configurada')
if api_key:
    print(f'  Longitud: {len(api_key)} caracteres')
    print(f'  Prefijo: {api_key[:10]}...' if len(api_key) > 10 else '')
    
print(f'Modelo (ANTHROPIC_MODEL): {model}')

# Verificar si el SDK está disponible
try:
    from anthropic import Anthropic
    print('SDK de Anthropic: Disponible')
    
    if api_key:
        print('\nProbando conexion...')
        try:
            client = Anthropic(api_key=api_key)
            # Prueba simple: obtener un mensaje
            message = client.messages.create(
                model=model,
                max_tokens=50,
                messages=[{
                    "role": "user",
                    "content": "Responde solo con 'OK' si puedes leer esto."
                }]
            )
            response_text = message.content[0].text if message.content else "Sin respuesta"
            print(f'Respuesta: {response_text[:100]}')
            print('Estado: Conexion exitosa!')
        except Exception as e:
            print(f'Estado: Error al conectar')
            print(f'Error: {str(e)[:200]}')
    else:
        print('No se puede probar conexion: falta la API key')
        
except ImportError:
    print('SDK de Anthropic: NO disponible')
    print('Instala con: pip install anthropic')


