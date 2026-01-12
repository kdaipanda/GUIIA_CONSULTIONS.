# 🔴 Diagnóstico: Error 500 en Login

## Problema Actual

Veo dos errores:
1. ❌ **Error CORS**: "No 'Access-Control-Allow-Origin' header is present"
2. ❌ **Error 500**: "Internal Server Error" en `/api/auth/login`

El error 500 es más crítico - significa que el backend está recibiendo la petición pero falla al procesarla.

---

## 🔍 Paso 1: Verificar Logs del Backend en Railway

### 1.1. Ir a Railway

1. Ve a **Railway Dashboard**: https://railway.app/dashboard
2. Selecciona tu proyecto/servicio del **backend**

### 1.2. Ver Logs

1. Ve a **Deployments** → Selecciona el más reciente
2. Haz clic en **Logs**
3. Intenta hacer login desde el frontend
4. **Busca los errores** que aparecen en los logs

**Busca mensajes como:**
- `Error buscando usuario: ...`
- `Error guardando perfil: ...`
- `SupabaseConfigError: ...`
- `Traceback` o `Exception`

---

## 🔍 Paso 2: Verificar Variables de Entorno en Railway

El error 500 puede ser causado por variables de entorno faltantes en Railway.

### 2.1. Verificar Variables Requeridas

En Railway → **Variables**, verifica que existan:

**Variables Requeridas para Supabase:**
- ✅ `SUPABASE_URL` - URL de tu proyecto Supabase
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service role key (no anon key)

**Variables Opcionales:**
- `CORS_ALLOW_ORIGINS` - Para CORS
- `ANTHROPIC_API_KEY` - Para análisis con Claude (opcional)

---

### 2.2. Obtener Credenciales de Supabase

Si faltan las variables:

1. Ve a **Supabase Dashboard** → Tu proyecto → **Settings** → **API**
2. Copia:
   - **Project URL** → Para `SUPABASE_URL`
   - **service_role key** (secret) → Para `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **NO uses la anon key aquí**, usa la **service_role key**

---

### 2.3. Agregar en Railway

1. En Railway → **Variables** → **Add Variable**
2. Agrega:
   - **Name**: `SUPABASE_URL`
   - **Value**: `https://xxxxx.supabase.co`
   - Guarda
3. Agrega:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: La service_role key (muy larga, empieza con `eyJhbGc...`)
   - Guarda
4. **Redesplega** el backend después de agregar

---

## 🔍 Paso 3: Verificar Código del Endpoint

El endpoint de login usa `get_profile_by_credentials` de Supabase. Si Supabase no está configurado, esto causará un error 500.

---

## 🐛 Errores Comunes y Soluciones

### Error 1: SupabaseConfigError

**Síntoma en logs**: `SupabaseConfigError: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados`

**Solución**: Agregar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Railway

---

### Error 2: Error de Conexión a Supabase

**Síntoma en logs**: `Error buscando usuario: ...` o errores de conexión

**Solución**: 
1. Verificar que las variables estén correctas
2. Verificar que Supabase esté accesible
3. Verificar que la service_role key sea correcta

---

### Error 3: Error de RLS o Permisos

**Síntoma en logs**: `permission denied` o errores de RLS

**Solución**: Ejecutar el script de optimización RLS que creamos antes

---

## 📋 Checklist de Diagnóstico

- [ ] Logs del backend revisados en Railway
- [ ] Error específico identificado en los logs
- [ ] Variable `SUPABASE_URL` configurada en Railway
- [ ] Variable `SUPABASE_SERVICE_ROLE_KEY` configurada en Railway
- [ ] Backend redesplegado después de agregar variables
- [ ] Supabase accesible (verificar en Supabase Dashboard)

---

## 🆘 Si Necesitas Ayuda

Comparte:
1. **¿Qué errores aparecen en los logs del backend?** (últimas 20-30 líneas cuando intentas login)
2. **¿Tienes configuradas `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Railway?**
3. **¿El backend se redesplegó después de agregar las variables?**

Con esa información podré darte la solución exacta.




