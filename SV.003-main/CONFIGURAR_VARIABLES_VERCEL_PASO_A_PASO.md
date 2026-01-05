# ✅ Configurar Variables de Entorno en Vercel - Paso a Paso

## 🔴 Problema Actual

Tu aplicación muestra una **página en blanco** porque faltan las variables de entorno de Supabase. Los errores en la consola confirman esto.

---

## ✅ Solución: Configurar Variables en Vercel

### Paso 1: Obtener Credenciales de Supabase

1. Ve a **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️) → **API**
4. Copia estos valores:

   - **Project URL**: Algo como `https://xxxxx.supabase.co`
   - **anon public key**: Una cadena larga que empieza con `eyJhbGc...`

---

### Paso 2: Configurar en Vercel

1. Ve a **Vercel Dashboard**: https://vercel.com/dashboard
2. Selecciona tu proyecto **GUIIA_CONSULTIONS** (o el nombre que tenga)
3. Ve a **Settings** → **Environment Variables**
4. Haz clic en **"Add New"**

---

### Paso 3: Agregar Primera Variable

**Variable 1:**
- **Name**: `REACT_APP_SUPABASE_URL`
- **Value**: Pega el **Project URL** que copiaste de Supabase
- **Environments**: Marca ✅ **Production**, ✅ **Preview**, ✅ **Development**
- Haz clic en **"Save"**

---

### Paso 4: Agregar Segunda Variable

Haz clic en **"Add New"** nuevamente:

**Variable 2:**
- **Name**: `REACT_APP_SUPABASE_ANON_KEY`
- **Value**: Pega el **anon public key** que copiaste de Supabase
- **Environments**: Marca ✅ **Production**, ✅ **Preview**, ✅ **Development**
- Haz clic en **"Save"**

---

### Paso 5: Verificar Tercera Variable

Verifica que exista esta variable (debería estar en `vercel.json`, pero confírmalo):

**Variable 3:**
- **Name**: `REACT_APP_BACKEND_URL`
- **Value**: `https://api.guiaa.vet`
- **Environments**: Marca ✅ **Production**, ✅ **Preview**, ✅ **Development**

Si no existe, agrégalo también.

---

### Paso 6: Redesplegar la Aplicación

Después de agregar las variables:

1. Ve a **Deployments** en Vercel
2. Haz clic en los **3 puntos** (⋯) del deployment más reciente
3. Selecciona **"Redeploy"**
4. Espera 1-2 minutos para que termine el deployment

---

## ✅ Verificación

Después de redesplegar:

1. Visita `https://guiaa.vet`
2. Presiona **F12** → **Console**
3. **NO deberías ver** estos errores:
   - ❌ "Supabase env vars missing"
   - ❌ "supabaseUrl is required"
4. **Deberías ver**:
   - ✅ "Backend URL being used: https://api.guiaa.vet"
   - ✅ La página carga correctamente (no en blanco)

---

## 📋 Checklist

- [ ] Credenciales de Supabase obtenidas (Project URL y anon key)
- [ ] `REACT_APP_SUPABASE_URL` agregada en Vercel
- [ ] `REACT_APP_SUPABASE_ANON_KEY` agregada en Vercel
- [ ] `REACT_APP_BACKEND_URL` verificada/agregada en Vercel
- [ ] Todas las variables marcadas para Production, Preview y Development
- [ ] Aplicación redeplegada en Vercel
- [ ] Página carga sin errores en la consola

---

## 🆘 Si Aún No Funciona

1. **Verifica que las variables estén correctas**:
   - `REACT_APP_SUPABASE_URL` debe empezar con `https://`
   - `REACT_APP_SUPABASE_ANON_KEY` debe ser muy largo (cientos de caracteres)

2. **Verifica que el deployment haya terminado**:
   - Ve a **Deployments** → Verifica que el último esté en estado "Ready" (verde)

3. **Limpia la caché del navegador**:
   - Presiona **Ctrl + Shift + R** (o **Cmd + Shift + R** en Mac) para recargar sin caché

4. **Comparte los errores** que veas en la consola después de redesplegar

---

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Documentación Vercel Env Vars**: https://vercel.com/docs/concepts/projects/environment-variables

