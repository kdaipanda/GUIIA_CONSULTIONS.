# Verificación de Configuración en Railway

## Variables que DEBEN estar configuradas en Railway

### Obligatorias:
1. `ANTHROPIC_API_KEY` - Tu clave de API de Claude
2. `SUPABASE_URL` - URL de tu proyecto Supabase
3. `SUPABASE_KEY` - Service role key de Supabase

### Recomendadas (para pagos):
4. `STRIPE_API_KEY` - Clave secreta de Stripe (sk_live_...)
5. `STRIPE_PUBLISHABLE_KEY` - Clave pública de Stripe (pk_live_...)
6. `STRIPE_WEBHOOK_SECRET` - Secret del webhook (whsec_...)

### Opcionales pero importantes:
7. `CORS_ALLOW_ORIGINS` - Dominios permitidos (ej: `https://tu-dominio.com,https://www.tu-dominio.com`)

## Cómo verificar en Railway

1. Ve a tu proyecto en https://railway.app
2. Selecciona tu servicio (backend)
3. Ve a la pestaña **"Variables"**
4. Verifica que todas las variables estén listadas

## Cómo verificar que funciona

Una vez desplegado, visita estos endpoints:

### 1. Diagnóstico completo:
```
https://tu-dominio-railway.app/api/config/diagnostics
```

### 2. Test de Claude:
```
https://tu-dominio-railway.app/api/test/claude
```

### 3. Test de Stripe:
```
https://tu-dominio-railway.app/api/stripe/config
```

## Si algo no funciona

1. Verifica que los nombres de las variables sean EXACTOS (mayúsculas/minúsculas importan)
2. Verifica que no haya espacios al inicio o final de los valores
3. Reinicia el servicio en Railway (Settings → Restart)
4. Revisa los logs en Railway para ver errores específicos


