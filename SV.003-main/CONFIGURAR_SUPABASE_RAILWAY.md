# ⚠️ URGENTE: Configurar Supabase en Railway

## 🔴 Problema Actual

El error 500 en login indica que el backend no puede conectarse a Supabase porque faltan las variables de entorno en Railway.

---

## ✅ Solución: Configurar Variables de Supabase en Railway

### Paso 1: Obtener Credenciales de Supabase

1. Ve a **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia estos valores:

   **Project URL:**
   - Algo como: `https://xxxxx.supabase.co`
   - Copia el valor completo

   **service_role key (secret):**
   - ⚠️ **IMPORTANTE**: Usa la **service_role key** (no la anon key)
   - Es una cadena muy larga que empieza con `eyJhbGc...`
   - Está marcada como "secret" - no la compartas públicamente

---

### Paso 2: Configurar en Railway

1. Ve a **Railway Dashboard**: https://railway.app/dashboard
2. Selecciona tu proyecto/servicio del **backend**
3. Ve a **Variables** (o **Settings** → **Variables**)

---

### Paso 3: Agregar Primera Variable

**Variable 1: SUPABASE_URL**

1. Haz clic en **"Add Variable"** o **"New Variable"**
2. **Name**: `SUPABASE_URL`
3. **Value**: Pega el **Project URL** que copiaste de Supabase
   - Ejemplo: `https://xxxxx.supabase.co`
4. Guarda

---

### Paso 4: Agregar Segunda Variable

**Variable 2: SUPABASE_SERVICE_ROLE_KEY**

1. Haz clic en **"Add Variable"** nuevamente
2. **Name**: `SUPABASE_SERVICE_ROLE_KEY`
3. **Value**: Pega el **service_role key** que copiaste de Supabase
   - Ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (muy largo)
4. Guarda

---

### Paso 5: Redesplegar Backend

**⚠️ IMPORTANTE**: Después de agregar las variables:

1. Railway debería redesplegar automáticamente
2. Si no, ve a **Deployments** → **Redeploy**
3. Espera 1-2 minutos

---

## ✅ Verificación

### 1. Verificar Logs del Backend

1. En Railway → **Deployments** → Selecciona el más reciente → **Logs**
2. Busca mensajes al inicio que muestren:
   - ✅ "Usando Supabase como base de datos" - Supabase configurado
   - ❌ "SupabaseConfigError" - Variables faltantes
   - ❌ Otros errores relacionados con Supabase

### 2. Probar el Login

Después de redesplegar:

1. Visita `https://guiaa.vet`
2. Intenta hacer login
3. El error 500 debería desaparecer
4. Si aparece error 401, es normal (credenciales incorrectas), significa que el endpoint funciona

---

## 🐛 Si el Error 500 Persiste

### Verificar que las Variables Estén Correctas

1. En Railway → **Variables**
2. Verifica que:
   - `SUPABASE_URL` empiece con `https://` y termine con `.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` sea muy largo (cientos de caracteres)
   - **NO uses la anon key**, usa la **service_role key**

### Verificar Logs para el Error Específico

1. En Railway → **Logs**
2. Intenta hacer login desde el frontend
3. Busca el error específico en los logs
4. Comparte el error para diagnosticar

---

## 📋 Checklist

- [ ] Credenciales de Supabase obtenidas (Project URL y service_role key)
- [ ] `SUPABASE_URL` agregada en Railway
- [ ] `SUPABASE_SERVICE_ROLE_KEY` agregada en Railway (service_role, NO anon)
- [ ] Backend redesplegado después de agregar variables
- [ ] Logs muestran "Usando Supabase como base de datos"
- [ ] Login funciona sin error 500

---

## 🔗 Enlaces Útiles

- **Railway Dashboard**: https://railway.app/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Documentación Railway Env Vars**: https://docs.railway.app/develop/variables

---

## 🆘 Si Necesitas Ayuda

Comparte:
1. **¿Tienes configuradas `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Railway?**
2. **¿Qué errores aparecen en los logs del backend?** (últimas 20-30 líneas)
3. **¿El backend se redesplegó después de agregar las variables?**

Con esa información podré ayudarte a resolver el problema específico.




