# ✅ Verificar Variables de Entorno en Vercel

## El Build Está Bien ✅

Tu build completó exitosamente. El problema es que **faltan variables de entorno** para que la aplicación funcione en runtime.

---

## 🔍 Paso 1: Verificar Variables en Vercel

### 1. Ve a Vercel Dashboard

1. Abre: https://vercel.com/dashboard
2. Selecciona tu proyecto **GUIIA_CONSULTIONS** (o el nombre que tenga)

### 2. Ve a Settings → Environment Variables

1. En el menú lateral, haz clic en **Settings**
2. Haz clic en **Environment Variables**

### 3. Verifica que Existan Estas Variables:

Debes tener **exactamente estas 3 variables**:

| Variable | Valor Esperado | Entornos |
|----------|----------------|----------|
| `REACT_APP_SUPABASE_URL` | `https://xxxxx.supabase.co` | ✅ Production, ✅ Preview, ✅ Development |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGc...` (muy largo) | ✅ Production, ✅ Preview, ✅ Development |
| `REACT_APP_BACKEND_URL` | `https://api.guiaa.vet` | ✅ Production, ✅ Preview, ✅ Development |

---

## ❌ Si NO Tienes Estas Variables:

### Obtener Credenciales de Supabase:

1. Ve a **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → Usa esto para `REACT_APP_SUPABASE_URL`
   - **anon public key** → Usa esto para `REACT_APP_SUPABASE_ANON_KEY`

### Agregar en Vercel:

1. En Vercel → Settings → Environment Variables
2. Haz clic en **"Add New"**
3. Agrega cada variable:
   - **Name**: `REACT_APP_SUPABASE_URL`
   - **Value**: `https://tu-proyecto.supabase.co`
   - **Environments**: Marca ✅ Production, ✅ Preview, ✅ Development
4. Repite para `REACT_APP_SUPABASE_ANON_KEY` y `REACT_APP_BACKEND_URL`

---

## 🔄 Paso 2: Redesplegar

Después de agregar las variables:

1. Ve a **Deployments** en Vercel
2. Haz clic en los **3 puntos** (⋯) del deployment más reciente
3. Selecciona **"Redeploy"**
4. Espera 1-2 minutos

---

## ✅ Paso 3: Verificar

1. Visita `https://guiaa.vet`
2. Abre la consola del navegador (F12 → Console)
3. **NO deberías ver** errores como:
   - `Supabase env vars missing`
   - `Cannot read property 'auth' of undefined`

---

## 📋 Checklist Rápido:

- [ ] Build exitoso en Vercel ✅ (ya confirmado)
- [ ] `REACT_APP_SUPABASE_URL` configurada en Vercel
- [ ] `REACT_APP_SUPABASE_ANON_KEY` configurada en Vercel
- [ ] `REACT_APP_BACKEND_URL` configurada en Vercel
- [ ] Variables marcadas para Production, Preview y Development
- [ ] Aplicación redeplegada después de agregar variables
- [ ] Página funciona en `https://guiaa.vet`

---

## 🆘 Si Aún No Funciona:

1. Abre la consola del navegador (F12 → Console)
2. Copia **todos los errores** que veas
3. Compártelos para diagnosticar el problema específico

