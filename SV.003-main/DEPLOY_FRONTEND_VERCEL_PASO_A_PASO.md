# 🚀 Desplegar Frontend en Vercel - Paso a Paso

## 📋 Paso 1: Ir a Vercel y Conectar Repositorio

1. Abre tu navegador y ve a: **https://vercel.com/new**
2. Si no has iniciado sesión, haz clic en **"Sign In"** (puedes usar GitHub)
3. Haz clic en **"Import Git Repository"**
4. Busca y selecciona: **`kdaipanda/GUIIA_CONSULTIONS`**
5. Si es la primera vez, autoriza a Vercel para acceder a tu repositorio de GitHub

---

## 📋 Paso 2: Configurar el Proyecto

Una vez que selecciones el repositorio, verás la pantalla de configuración. Configura estos valores:

### ⚠️ CONFIGURACIÓN IMPORTANTE:

1. **Framework Preset**: 
   - Déjalo en **"Create React App"** o **"Auto-detect"**

2. **Root Directory**: 
   - Haz clic en **"Edit"** o **"Configure"**
   - Cambia a: **`SV.003-main/frontend`**
   - ⚠️ MUY IMPORTANTE: Debe ser exactamente `SV.003-main/frontend`

3. **Build Command**: 
   - Déjalo por defecto: `npm run build`

4. **Output Directory**: 
   - Déjalo por defecto: `build`

5. **Install Command**: 
   - Haz clic en **"Override"** o **"Edit"**
   - Cambia a: **`npm install --legacy-peer-deps`**
   - ⚠️ IMPORTANTE: Esto es necesario por las dependencias del proyecto

---

## 📋 Paso 3: Agregar Variables de Entorno

En la sección **"Environment Variables"**, agrega:

### Variable Obligatoria:

1. Haz clic en **"Add Environment Variable"** o el botón **"+"**
2. Agrega:
   - **Name**: `REACT_APP_BACKEND_URL`
   - **Value**: `https://tu-proyecto.railway.app`
     - ⚠️ Reemplaza `tu-proyecto.railway.app` con la URL real de tu backend en Railway
     - Si no la tienes, déjala como está por ahora y la cambias después
   - **Environment**: Selecciona **Production**, **Preview** y **Development** (o solo Production)

### Variable Opcional (si tienes Supabase):

Si ya tienes Supabase configurado, también agrega:

- **Name**: `REACT_APP_SUPABASE_URL`
- **Value**: `https://tu-proyecto.supabase.co`

- **Name**: `REACT_APP_SUPABASE_ANON_KEY`
- **Value**: `tu-anon-key-aqui`

---

## 📋 Paso 4: Obtener URL del Backend (si no la tienes)

Si aún no tienes la URL del backend de Railway:

1. Ve a **Railway Dashboard**: https://railway.app
2. Selecciona tu proyecto/servicio (backend)
3. Ve a la pestaña **"Settings"** o **"Networking"**
4. Busca **"Public Domain"** o **"Domains"**
5. Copia la URL (ejemplo: `tu-proyecto.up.railway.app`)
6. Vuelve a Vercel y actualiza la variable `REACT_APP_BACKEND_URL`

---

## 📋 Paso 5: Hacer Deploy

1. Revisa que toda la configuración esté correcta
2. Haz clic en el botón **"Deploy"** (grande y verde)
3. Espera 2-5 minutos mientras:
   - Vercel instala dependencias
   - Construye el proyecto
   - Despliega la aplicación

---

## 📋 Paso 6: Verificar el Deploy

1. Una vez terminado, verás una pantalla de éxito
2. Vercel te dará una URL temporal (ejemplo: `tu-proyecto.vercel.app`)
3. Haz clic en la URL o cópiala y ábrela en tu navegador
4. Deberías ver tu aplicación funcionando
5. Abre la consola del navegador (F12) para verificar que no haya errores

---

## 📋 Paso 7: Verificar que se Conecta al Backend

1. En la aplicación desplegada, intenta hacer alguna acción (login, registro, etc.)
2. Abre la consola del navegador (F12) → pestaña **"Network"**
3. Verifica que las peticiones se envíen a la URL del backend
4. Si ves errores de CORS, necesitarás configurar CORS en Railway (paso siguiente)

---

## 🔧 Paso 8: Configurar CORS en Railway (si hay errores)

Si ves errores de CORS en la consola del navegador:

1. Ve a **Railway Dashboard**
2. Tu servicio → **Variables**
3. Agrega o actualiza:
   ```
   CORS_ALLOW_ORIGINS = https://tu-proyecto.vercel.app
   ```
   (Reemplaza con la URL real de Vercel)

4. Railway hará un redeploy automático

---

## ✅ Checklist Final

Antes de continuar con el dominio personalizado, verifica:

- [ ] Frontend desplegado en Vercel
- [ ] URL temporal funcionando (ej: `tu-proyecto.vercel.app`)
- [ ] La aplicación carga correctamente
- [ ] No hay errores en la consola del navegador
- [ ] Variable `REACT_APP_BACKEND_URL` configurada correctamente
- [ ] (Opcional) CORS configurado en Railway

---

## 🎯 Próximo Paso

Una vez que el frontend esté funcionando con la URL temporal de Vercel, el siguiente paso es:

**Configurar el dominio personalizado `guiaa.vet` en Vercel**

---

## 🆘 Solución de Problemas

### Build falla
- Verifica que `Root Directory` sea exactamente `SV.003-main/frontend`
- Verifica que `Install Command` incluya `--legacy-peer-deps`
- Revisa los logs de build en Vercel para ver el error específico

### Error: "Module not found"
- Verifica que el Root Directory esté correcto
- Asegúrate de que `package.json` esté en `SV.003-main/frontend/`

### Error: "Failed to fetch" o CORS
- Verifica que `REACT_APP_BACKEND_URL` sea correcta
- Configura CORS en Railway (Paso 8)

### La aplicación carga pero no se conecta al backend
- Verifica la variable `REACT_APP_BACKEND_URL` en Vercel
- Verifica que el backend esté online en Railway
- Revisa la consola del navegador para errores específicos

---

**¿Listo?** Ve a https://vercel.com/new y sigue estos pasos. Si encuentras algún problema, avísame y te ayudo a solucionarlo.

