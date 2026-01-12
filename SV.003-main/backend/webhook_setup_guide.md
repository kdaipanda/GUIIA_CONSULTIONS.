# Guía para Configurar el Webhook Secret de Stripe

## Paso 1: Obtener el Webhook Secret desde Stripe

1. Ve a https://stripe.com
2. Inicia sesión en tu cuenta
3. Ve a **Developers** → **Webhooks**
4. Haz clic en **"Add endpoint"** (si no tienes uno) o selecciona tu endpoint existente
5. La URL del endpoint debe ser: `https://tu-dominio.com/api/payments/stripe/webhook`
   - Para desarrollo local: usa un túnel como ngrok o cloudflare tunnel
   - Ejemplo con ngrok: `https://abc123.ngrok.io/api/payments/stripe/webhook`
6. En la sección "Signing secret", haz clic en **"Reveal"** o **"Click to reveal"**
7. Copia el secreto que empieza con `whsec_...`

## Paso 2: Configurar el Webhook Secret en el Backend

Agrega esta línea en `backend/.env`:

```
STRIPE_WEBHOOK_SECRET=whsec_tu_secreto_aqui
```

## Paso 3: Eventos que el Webhook Escucha

El webhook está configurado para escuchar estos eventos:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

## Paso 4: Verificar la Configuración

Ejecuta el script de verificación:
```bash
python backend/check_stripe_config.py
```

O verifica usando el endpoint:
```
GET http://localhost:8000/api/stripe/config
```

## Notas Importantes

- El webhook secret es diferente para cada endpoint que crees
- Si cambias la URL del webhook, necesitarás un nuevo secret
- Para desarrollo local, usa ngrok: `ngrok http 8000`
- El endpoint del webhook es: `/api/payments/stripe/webhook`


