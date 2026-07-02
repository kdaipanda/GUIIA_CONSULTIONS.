# Configuración de Variables de Entorno en Producción

## Problema Común: "API Key no configurada"

Si desde el dominio de producción recibes el error de que la API key no está configurada, es porque las variables de entorno deben configurarse en la plataforma de hosting, NO en un archivo `.env`.

## Plataformas Comunes

### Railway

1. Ve a tu proyecto en https://railway.app
2. Selecciona tu servicio (backend)
3. Ve a la pestaña **"Variables"**
4. Agrega las siguientes variables:

```
ANTHROPIC_API_KEY=sk-ant-api-tu-clave-aqui
STRIPE_API_KEY=sk_live_tu-clave-aqui
STRIPE_PUBLISHABLE_KEY=pk_live_tu-clave-aqui
STRIPE_WEBHOOK_SECRET=whsec_tu-secreto-aqui
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-key
JWT_SECRET=genera-un-secreto-largo-aleatorio-minimo-32-caracteres
ENVIRONMENT=production
CORS_ALLOW_ORIGINS=https://guiaa.vet,https://www.guiaa.vet
ALLOW_INSECURE_VET_HEADER=false
```

5. Haz clic en **"Deploy"** o reinicia el servicio

### Render

1. Ve a tu servicio en https://render.com
2. En el panel izquierdo, selecciona **"Environment"**
3. Agrega las variables de entorno una por una
4. Guarda los cambios
5. El servicio se reiniciará automáticamente

### Vercel (solo frontend)

Las variables de entorno del frontend se configuran en:
1. Settings → Environment Variables
2. Agrega variables que empiecen con `REACT_APP_` o `NEXT_PUBLIC_`

## Verificar Configuración

### Endpoint de Diagnóstico

Una vez desplegado, puedes verificar la configuración visitando:

```
https://tu-dominio-backend.com/api/config/diagnostics
```

Este endpoint te mostrará:
- Si las variables están configuradas
- Si vienen del sistema (producción) o del archivo .env (desarrollo)
- Estado de todas las configuraciones

### Endpoint de Prueba de Claude

```
GET https://tu-dominio-backend.com/api/test/claude
```

Este endpoint te dirá específicamente si la API key de Claude está configurada y funcionando.

## Variables Requeridas

### Obligatorias

- `ANTHROPIC_API_KEY` - Clave de API de Anthropic (Claude)
- `SUPABASE_URL` - URL de tu proyecto Supabase
- `SUPABASE_KEY` - Service role key de Supabase
- `JWT_SECRET` - Secreto para firmar sesiones (login). Sin esto el login devuelve error 500/503 en producción.

### Opcionales pero Recomendadas

- `STRIPE_API_KEY` - Para pagos reales
- `STRIPE_PUBLISHABLE_KEY` - Clave pública de Stripe
- `STRIPE_WEBHOOK_SECRET` - Para webhooks de Stripe
- `CORS_ALLOW_ORIGINS` - Dominios permitidos (separados por coma)
- `CEDULA_OCR_ENABLED` - `true` por defecto; lectura automática de cédulas con Claude (requiere `ANTHROPIC_API_KEY`)
- `CEDULA_OCR_MODEL` - (opcional) modelo para OCR de documentos de cédula
- `CEDULA_ELIGIBILITY_AI_ENABLED` - `true` por defecto; dictamen IA si puede ejercer (SEP + documento)
- `CEDULA_ELIGIBILITY_MODEL` - (opcional) modelo para dictamen de elegibilidad

## Notas Importantes

1. **Nunca subas el archivo `.env` a Git** - Está en `.gitignore` por seguridad
2. **En producción, las variables se configuran en la plataforma**, no en archivos
3. **Después de agregar variables, reinicia el servicio** para que tomen efecto
4. **Verifica que los nombres de las variables sean exactos** (mayúsculas/minúsculas importan)

## Solución de Problemas

### "ANTHROPIC_API_KEY no configurada"

1. Verifica que la variable esté en el panel de tu plataforma de hosting
2. Verifica que el nombre sea exactamente `ANTHROPIC_API_KEY` (sin espacios)
3. Reinicia el servicio después de agregar la variable
4. Usa el endpoint `/api/config/diagnostics` para verificar

### Variables no se cargan

1. Verifica que no haya espacios al inicio o final del valor
2. Verifica que no uses comillas en el valor (la plataforma las agrega automáticamente)
3. Reinicia el servicio completamente






