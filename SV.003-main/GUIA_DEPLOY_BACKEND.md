# 🚀 Guía Completa: Desplegar Backend en Railway

## 📋 Pre-requisitos

Antes de desplegar, necesitas tener:

1. ✅ Cuenta en Railway: https://railway.app
2. ✅ Repositorio en GitHub (✅ Ya lo tienes: `GUIIA_CONSULTIONS`)
3. ✅ Cuenta en Supabase: https://supabase.com
4. ✅ (Opcional) Cuenta en Anthropic para IA: https://console.anthropic.com
5. ✅ (Opcional) Cuenta en Stripe para pagos: https://stripe.com

---

## 🎯 Paso 1: Configurar Supabase

### 1.1 Crear Proyecto en Supabase (si no lo tienes)

1. Ve a https://supabase.com
2. Crea una cuenta o inicia sesión
3. Clic en "New Project"
4. Completa:
   - **Name**: Nombre del proyecto (ej: `savant-vet`)
   - **Database Password**: Crea una contraseña segura (guárdala)
   - **Region**: Selecciona la más cercana (ej: `South America (São Paulo)`)
   - **Pricing Plan**: Free tier es suficiente para empezar
5. Clic en "Create new project"
6. Espera 2-3 minutos a que se cree el proyecto

### 1.2 Obtener Credenciales de Supabase

1. En el dashboard de Supabase, ve a **Settings** → **API**
2. Anota estos valores:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **Project API keys**:
     - `anon` `public`: Esta es la clave pública (para el frontend)
     - `service_role` `secret`: Esta es la clave privada (para el backend) ⚠️ NUNCA la expongas en el frontend

### 1.3 Ejecutar Migraciones (si las hay)

Tu proyecto tiene migraciones SQL en `backend/supabase_migrations/`:
- `20251229_cedula_verification.sql`
- `20251229_payment_transactions.sql`
- `fix_dev_user.sql`

**Para ejecutarlas:**
1. En Supabase Dashboard, ve a **SQL Editor**
2. Abre cada archivo `.sql` y ejecuta el contenido
3. O usa la CLI de Supabase (opcional)

---

## 🚂 Paso 2: Desplegar en Railway

### 2.1 Crear Proyecto en Railway

1. Ve a https://railway.app
2. Clic en "Login" (puedes usar GitHub)
3. Autoriza a Railway
4. En el dashboard, clic en **"New Project"**
5. Selecciona **"Deploy from GitHub repo"**
6. Autoriza a Railway a acceder a tus repositorios si es necesario
7. Selecciona tu repositorio: `kdaipanda/GUIIA_CONSULTIONS`

### 2.2 Configurar el Servicio

Railway detectará automáticamente que es un proyecto Python, pero necesitas configurar:

1. En la configuración del servicio, busca **"Root Directory"** o **"Settings"**
2. Establece el **Root Directory** a: `SV.003-main/backend`
   - ⚠️ IMPORTANTE: Debe apuntar a la carpeta `backend`
3. Railway usará automáticamente:
   - `requirements_simple.txt` para instalar dependencias
   - `railway.json` para la configuración (ya existe)
   - `server_simple.py` como el servidor principal

### 2.3 Agregar Variables de Entorno

En Railway, ve a tu servicio → **Variables** y agrega:

#### ✅ Variables OBLIGATORIAS:

```env
# Supabase (OBLIGATORIO)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-key-aqui

# CORS (OBLIGATORIO - ajusta según tu frontend)
CORS_ALLOW_ORIGINS=https://tu-frontend.vercel.app,https://www.tu-dominio.com
```

#### ⚠️ Variables OPCIONALES (pero recomendadas):

```env
# Anthropic (para análisis con IA)
ANTHROPIC_API_KEY=tu-api-key-de-anthropic
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Stripe (para pagos reales)
STRIPE_API_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### 📝 Cómo obtener cada variable:

**SUPABASE_URL:**
- Supabase Dashboard → Settings → API → Project URL

**SUPABASE_KEY:**
- Supabase Dashboard → Settings → API → Project API keys → `service_role` (secret key)

**ANTHROPIC_API_KEY:**
- Ve a https://console.anthropic.com
- Crea una cuenta o inicia sesión
- Ve a API Keys → Create Key
- Copia la clave (solo se muestra una vez)

**STRIPE_API_KEY:**
- Ve a https://stripe.com
- Dashboard → Developers → API keys
- Copia la "Publishable key" y "Secret key"
- Para webhooks: Developers → Webhooks → Add endpoint

**CORS_ALLOW_ORIGINS:**
- Si usas Vercel: `https://tu-proyecto.vercel.app`
- Si tienes dominio: `https://tu-dominio.com,https://www.tu-dominio.com`
- Para desarrollo local: `http://localhost:3000` (solo para pruebas)

### 2.4 Configurar el Deploy

Railway debería detectar automáticamente la configuración desde `railway.json`, pero verifica:

**Start Command:**
```bash
uvicorn server_simple:app --host 0.0.0.0 --port $PORT
```

**Healthcheck Path:** `/health` (si existe) o `/docs`

### 2.5 Hacer el Deploy

1. Guarda todas las variables de entorno
2. Railway iniciará automáticamente el deploy
3. Espera 2-5 minutos mientras:
   - Instala dependencias de Python
   - Construye el proyecto
   - Inicia el servidor
4. Revisa los logs para ver si hay errores

---

## ✅ Paso 3: Verificar el Deploy

### 3.1 Obtener la URL del Backend

1. En Railway, ve a tu servicio
2. Clic en **"Settings"** → **"Domains"** o busca **"Public Domain"**
3. Railway te dará una URL como: `tu-proyecto.railway.app`
4. Anota esta URL (la necesitarás para el frontend)

### 3.2 Probar el Backend

Abre en tu navegador:

- **Documentación API**: `https://tu-proyecto.railway.app/docs`
- **Healthcheck** (si existe): `https://tu-proyecto.railway.app/health`

Deberías ver:
- ✅ La documentación interactiva de FastAPI
- ✅ Los endpoints listados
- ✅ Posibilidad de probar los endpoints

### 3.3 Probar un Endpoint

En la documentación (`/docs`), prueba:
- `GET /api/debug/instructions` - Debería funcionar sin autenticación
- `GET /health` - Si existe, debería responder OK

---

## 🌐 Paso 4: Configurar Dominio Personalizado (Opcional)

Si quieres usar un dominio como `api.tu-dominio.com`:

1. En Railway → tu servicio → **Settings** → **Domains**
2. Clic en **"Add Custom Domain"**
3. Ingresa: `api.tu-dominio.com`
4. Railway te dará un **CNAME target** (ej: `cname.railway.app`)
5. Ve a tu proveedor de DNS (Google Domains, Cloudflare, etc.)
6. Agrega un registro CNAME:
   - Tipo: `CNAME`
   - Nombre: `api`
   - Valor: `cname.railway.app` (el que Railway te dio)
7. Espera 5-30 minutos a que se propague el DNS

---

## 🔧 Paso 5: Configurar Variables Adicionales

### 5.1 Variables de Entorno Recomendadas

Agrega estas si las necesitas:

```env
# Para instrucciones del sistema (opcional)
ANTHROPIC_INSTRUCTIONS_FILE=/app/instrucciones_veterinarias.txt

# Para logs (opcional)
LOG_LEVEL=INFO
```

### 5.2 Verificar que las Variables se Aplicaron

1. En Railway → tu servicio → **Variables**
2. Verifica que todas las variables estén configuradas
3. Si cambiaste variables, Railway hará un redeploy automático

---

## 📊 Monitoreo y Logs

### Ver Logs en Railway

1. En Railway → tu servicio
2. Ve a la pestaña **"Deployments"** o **"Logs"**
3. Verás los logs en tiempo real

### Comandos Útiles

```bash
# Instalar Railway CLI (opcional)
npm i -g @railway/cli

# Login
railway login

# Ver logs
railway logs

# Ver variables
railway variables
```

---

## 🆘 Solución de Problemas

### El deploy falla

**Error: "Module not found"**
- Verifica que `Root Directory` sea `SV.003-main/backend`
- Verifica que `requirements_simple.txt` esté en el directorio correcto

**Error: "Port already in use"**
- Railway usa la variable `$PORT` automáticamente
- No necesitas configurarla manualmente

**Error: "Supabase connection failed"**
- Verifica `SUPABASE_URL` y `SUPABASE_KEY`
- Asegúrate de usar la `service_role` key (no la `anon` key)

### El servidor no inicia

**Revisa los logs:**
1. Railway → tu servicio → Logs
2. Busca errores en rojo
3. Los errores comunes:
   - Variables de entorno faltantes
   - Credenciales incorrectas
   - Dependencias faltantes

### CORS errors

Si ves errores de CORS desde el frontend:
1. Verifica `CORS_ALLOW_ORIGINS` en Railway
2. Asegúrate de incluir la URL exacta del frontend
3. Incluye `https://` (no `http://`)
4. Si usas dominio personalizado, incluye ambas: `https://tu-dominio.com,https://www.tu-dominio.com`

---

## ✅ Checklist Final

Antes de continuar con el frontend, verifica:

- [ ] Backend desplegado en Railway
- [ ] URL del backend funcionando (ej: `https://tu-proyecto.railway.app`)
- [ ] Documentación accesible en `/docs`
- [ ] Variables de entorno configuradas (al menos Supabase)
- [ ] Logs sin errores críticos
- [ ] (Opcional) Dominio personalizado configurado
- [ ] URL del backend anotada (la necesitarás para el frontend)

---

## 📝 Próximos Pasos

Una vez que el backend esté desplegado:

1. ✅ Anota la URL del backend (ej: `https://tu-proyecto.railway.app`)
2. ✅ Usa esta URL para configurar `REACT_APP_BACKEND_URL` en Vercel (frontend)
3. ✅ Continúa con el deploy del frontend en Vercel

---

## 🔗 Recursos Útiles

- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- Railway Status: https://status.railway.app

---

**¿Necesitas ayuda con algún paso específico?** Dime en qué paso estás y qué problema encuentras.

