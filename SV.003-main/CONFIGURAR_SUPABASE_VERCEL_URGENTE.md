# ⚠️ URGENTE: Configurar Variables de Supabase en Vercel

## 🔴 Problema Actual

Los errores en la consola muestran:
- ❌ "Supabase env vars missing: REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY"
- ❌ "Uncaught Error: supabaseUrl is required."

**Causa**: Las variables de entorno de Supabase no están configuradas en Vercel.

---

## ✅ Solución: Configurar Variables en Vercel

### Paso 1: Obtener Credenciales de Supabase

1. Ve a **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️) → **API**
4. Copia estos valores:

   **Project URL:**
   - Algo como: `https://xxxxx.supabase.co`
   - Copia el valor completo

   **anon public key:**
   - Una cadena muy larga que empieza con `eyJhbGc...`
   - Copia el valor completo

---

### Paso 2: Configurar en Vercel

1. Ve a **Vercel Dashboard**: https://vercel.com/dashboard
2. Selecciona tu proyecto **guiia-consultions**
3. Ve a **Settings** → **Environment Variables**
4. Haz clic en **"Add New"**

---

### Paso 3: Agregar Primera Variable

**Variable 1: REACT_APP_SUPABASE_URL**

1. **Name**: `REACT_APP_SUPABASE_URL`
2. **Value**: Pega el **Project URL** que copiaste de Supabase
   - Ejemplo: `https://xxxxx.supabase.co`
3. **Environments**: Marca ✅ **Production**, ✅ **Preview**, ✅ **Development**
4. Haz clic en **"Save"**

---

### Paso 4: Agregar Segunda Variable

Haz clic en **"Add New"** nuevamente:

**Variable 2: REACT_APP_SUPABASE_ANON_KEY**

1. **Name**: `REACT_APP_SUPABASE_ANON_KEY`
2. **Value**: Pega el **anon public key** que copiaste de Supabase
   - Ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (muy largo)
3. **Environments**: Marca ✅ **Production**, ✅ **Preview**, ✅ **Development**
4. Haz clic en **"Save"**

---

### Paso 5: Verificar Tercera Variable

Verifica que exista esta variable (debería estar en `vercel.json`, pero confírmalo):

**Variable 3: REACT_APP_BACKEND_URL**

1. Busca `REACT_APP_BACKEND_URL` en la lista
2. Si existe, verifica que el valor sea: `https://api.guiaa.vet`
3. Si no existe, agrégalo:
   - **Name**: `REACT_APP_BACKEND_URL`
   - **Value**: `https://api.guiaa.vet`
   - **Environments**: Marca ✅ **Production**, ✅ **Preview**, ✅ **Development**
   - Guarda

---

### Paso 6: Redesplegar Frontend

**⚠️ IMPORTANTE**: Después de agregar las variables, DEBES redesplegar:

1. Ve a **Deployments** en Vercel
2. Haz clic en los **3 puntos** (⋯) del deployment más reciente
3. Selecciona **"Redeploy"**
4. Espera 1-2 minutos para que termine el deployment

---

## ✅ Verificación

Después de redesplegar:

1. Visita `https://guiaa.vet` (o el dominio que uses)
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
- [ ] Frontend redesplegado después de agregar variables
- [ ] Página carga sin errores de Supabase en la consola

---

## 🐛 Si Aún No Funciona

### Verificar que las Variables Estén Correctas

1. En Vercel → **Settings** → **Environment Variables**
2. Verifica que:
   - `REACT_APP_SUPABASE_URL` empiece con `https://`
   - `REACT_APP_SUPABASE_ANON_KEY` sea muy largo (cientos de caracteres)
   - Ambas estén marcadas para **Production**

### Verificar que el Deployment Haya Terminado

1. En Vercel → **Deployments**
2. Verifica que el último deployment esté en estado **"Ready"** (verde)
3. Si está en "Building" o "Error", espera o revisa los logs

### Limpiar Caché del Navegador

1. Presiona **Ctrl + Shift + R** (o **Cmd + Shift + R** en Mac)
2. O en la consola ejecuta:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

---

## 🆘 Si Necesitas Ayuda

Comparte:
1. **¿Tienes acceso a Supabase Dashboard?** (para obtener las credenciales)
2. **¿Ya agregaste las variables en Vercel?**
3. **¿Redesplegaste el frontend después de agregar las variables?**

Con esa información podré ayudarte a resolver cualquier problema.

---

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Documentación Vercel Env Vars**: https://vercel.com/docs/concepts/projects/environment-variables

