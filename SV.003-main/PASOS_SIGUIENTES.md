# 🚀 Pasos Siguientes: Desplegar Frontend en Vercel

## ✅ Lo que ya tienes completado:

- ✅ Backend desplegado en Railway
- ✅ Backend funcionando online
- ✅ Código en GitHub

---

## 📋 Paso 1: Obtener URL del Backend

1. Ve a Railway Dashboard → Tu servicio
2. Busca la sección **"Domains"** o **"Public Domain"**
3. Anota la URL que Railway te dio (ejemplo: `tu-proyecto.railway.app`)
4. Prueba que funciona: Abre `https://tu-url.railway.app/docs` en tu navegador
   - Deberías ver la documentación de FastAPI

**Ejemplo de URL:**
```
https://tu-proyecto.up.railway.app
```

---

## 📋 Paso 2: Configurar Supabase (si aún no lo tienes)

Necesitas las credenciales de Supabase para el frontend:

1. Ve a https://supabase.com
2. Si no tienes proyecto, créalo:
   - New Project
   - Completa los datos
   - Espera 2-3 minutos
3. Ve a **Settings** → **API**
4. Anota:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: La clave pública (para el frontend)

---

## 📋 Paso 3: Desplegar Frontend en Vercel

### 3.1 Conectar Repositorio

1. Ve a https://vercel.com/new
2. Clic en **"Import Git Repository"**
3. Selecciona: `kdaipanda/GUIIA_CONSULTIONS`
4. Autoriza a Vercel si es necesario

### 3.2 Configurar el Proyecto

En la configuración del proyecto:

- **Framework Preset**: `Create React App` (o auto-detect)
- **Root Directory**: `SV.003-main/frontend` ⚠️ IMPORTANTE
- **Build Command**: `npm run build` (dejar por defecto)
- **Output Directory**: `build` (dejar por defecto)
- **Install Command**: `npm install --legacy-peer-deps` ⚠️ IMPORTANTE

### 3.3 Agregar Variables de Entorno

En la sección **"Environment Variables"**, agrega:

```
REACT_APP_BACKEND_URL = https://tu-url.railway.app
```

Reemplaza `tu-url.railway.app` con la URL real de tu backend en Railway.

**Si tienes Supabase, también agrega:**
```
REACT_APP_SUPABASE_URL = https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY = tu-anon-key-aqui
```

### 3.4 Desplegar

1. Haz clic en **"Deploy"**
2. Espera 2-5 minutos mientras construye
3. Verifica que el deploy sea exitoso

---

## 📋 Paso 4: Verificar que Todo Funciona

1. **Frontend**: Abre la URL que Vercel te dio (ej: `tu-proyecto.vercel.app`)
2. **Backend**: Verifica que `https://tu-backend.railway.app/docs` funcione
3. **Pruebas**:
   - Intenta registrarte en el frontend
   - Intenta hacer login
   - Verifica que las peticiones lleguen al backend

---

## 🔧 Paso 5: Configurar CORS en el Backend (si hay errores)

Si ves errores de CORS, agrega esta variable en Railway:

**En Railway → Variables:**
```
CORS_ALLOW_ORIGINS = https://tu-frontend.vercel.app
```

Reemplaza `tu-frontend.vercel.app` con la URL real de tu frontend en Vercel.

---

## 📝 Resumen de URLs que Necesitas

Antes de empezar, asegúrate de tener:

- [ ] URL del backend en Railway: `https://__________.railway.app`
- [ ] (Opcional) URL de Supabase: `https://__________.supabase.co`
- [ ] (Opcional) Anon key de Supabase: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 🆘 Si algo falla

### Error: "Failed to fetch" en el frontend
- Verifica que `REACT_APP_BACKEND_URL` apunte a la URL correcta
- Verifica que el backend esté online en Railway
- Verifica CORS en Railway

### Error: Build falla en Vercel
- Verifica que `Root Directory` sea `SV.003-main/frontend`
- Verifica que `Install Command` incluya `--legacy-peer-deps`

### Error: CORS
- Agrega la URL del frontend a `CORS_ALLOW_ORIGINS` en Railway

---

**¿Listo para empezar?** Necesitas la URL del backend de Railway primero. ¿Ya la tienes?

