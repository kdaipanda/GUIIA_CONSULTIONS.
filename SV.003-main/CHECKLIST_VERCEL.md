# ✅ Checklist para Desplegar en Vercel

## 📋 Información Necesaria ANTES de Desplegar

### 1. Variables de Entorno Requeridas

Necesitas estas variables para que el frontend funcione correctamente:

#### ✅ Variables Obligatorias:
- [ ] `REACT_APP_BACKEND_URL` - URL del backend en producción
  - Ejemplo: `https://api.guiaa.vet` o `https://tu-backend.railway.app`
  - **¿Dónde obtener?**: La URL de tu backend desplegado (Railway, Render, etc.)

- [ ] `REACT_APP_SUPABASE_URL` - URL de tu proyecto Supabase
  - Formato: `https://xxxxxxxxxxxxx.supabase.co`
  - **¿Dónde obtener?**: Supabase Dashboard → Settings → API → Project URL

- [ ] `REACT_APP_SUPABASE_ANON_KEY` - Clave pública de Supabase
  - Formato: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - **¿Dónde obtener?**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

#### ⚠️ Variables Opcionales (si usas funcionalidades adicionales):
- `REACT_APP_WEATHER_API_KEY` - Si quieres el widget de clima
- `REACT_APP_META_PIXEL_ID` - ID del Meta Pixel para campañas de Facebook/Instagram Ads
  - **¿Dónde obtener?**: Meta Events Manager → Data Sources → tu Pixel → Settings
  - **Backend (Railway)**: configura también `META_PIXEL_ID` (mismo valor) y `META_CAPI_ACCESS_TOKEN` para Conversions API
- `REACT_APP_GOOGLE_ADS_ID` - ID de conversión de Google Ads (`AW-XXXXXXXXX`)
  - **¿Dónde obtener?**: Google Ads → Objetivos → Conversiones → etiqueta global del sitio
  - **Etiquetas opcionales**: `REACT_APP_GOOGLE_ADS_REGISTRATION_LABEL`, `REACT_APP_GOOGLE_ADS_CHECKOUT_LABEL`, `REACT_APP_GOOGLE_ADS_PURCHASE_LABEL`
  - **Guía de campaña**: ver `GOOGLE_ADS_LAUNCH_PLAN.md`

---

## 🚀 Pasos para Desplegar en Vercel

### Paso 1: Conectar Repositorio
1. [ ] Ve a https://vercel.com/new
2. [ ] Haz clic en "Import Git Repository"
3. [ ] Selecciona el repositorio: `GUIIA_CONSULTIONS`
4. [ ] Autoriza a Vercel si es necesario

### Paso 2: Configurar el Proyecto
Configura estos valores en Vercel:

- [ ] **Framework Preset**: `Create React App` (o déjalo en auto-detect)
- [ ] **Root Directory**: `SV.003-main/frontend`
  - ⚠️ IMPORTANTE: Debe apuntar a la carpeta `frontend`
- [ ] **Build Command**: `npm run build` (o dejar por defecto)
- [ ] **Output Directory**: `build` (o dejar por defecto)
- [ ] **Install Command**: `npm install --legacy-peer-deps`
  - ⚠️ Esto es importante por las dependencias del proyecto

### Paso 3: Agregar Variables de Entorno
En la sección "Environment Variables" agrega:

```
REACT_APP_BACKEND_URL = [tu URL del backend]
REACT_APP_SUPABASE_URL = [tu URL de Supabase]
REACT_APP_SUPABASE_ANON_KEY = [tu anon key de Supabase]
```

**Nota**: Puedes agregarlas para Production, Preview y Development

### Paso 4: Desplegar
1. [ ] Haz clic en "Deploy"
2. [ ] Espera a que termine el build (puede tardar 2-5 minutos)
3. [ ] Verifica que el deploy sea exitoso

### Paso 5: Verificar
1. [ ] Abre la URL que Vercel te proporciona (ej: `tu-proyecto.vercel.app`)
2. [ ] Verifica que la aplicación cargue correctamente
3. [ ] Revisa la consola del navegador para errores
4. [ ] Prueba funcionalidades básicas (login, registro)

---

## 🔧 Configuración Actual

Tu proyecto ya tiene:
- ✅ `vercel.json` configurado
- ✅ Scripts de build en `package.json`
- ✅ Código listo para producción

**Configuración actual de vercel.json:**
- Nombre del proyecto: `guiaa-vet`
- Build command: Automático (usa `@vercel/static-build`)
- Output directory: `build`
- Variable de entorno hardcodeada: `REACT_APP_BACKEND_URL=https://api.guiaa.vet`

⚠️ **Nota**: La variable `REACT_APP_BACKEND_URL` en `vercel.json` se sobrescribirá con las variables de entorno que configures en el dashboard de Vercel.

---

## ❓ ¿Qué te Falta?

Revisa qué información necesitas obtener:

### 1. Backend URL
- [ ] ¿Ya tienes el backend desplegado?
  - Si NO: Necesitas desplegar el backend primero (Railway, Render, etc.)
  - Si SÍ: ¿Cuál es la URL? (ej: `https://tu-backend.railway.app`)

### 2. Supabase
- [ ] ¿Ya tienes proyecto en Supabase?
  - Si NO: Crea uno en https://supabase.com
  - Si SÍ: Obtén la URL y las keys del dashboard

### 3. Dominio Personalizado (Opcional)
- [ ] ¿Quieres usar un dominio personalizado?
  - Si SÍ: Configúralo en Vercel → Settings → Domains
  - Si NO: Usarás la URL de Vercel (ej: `tu-proyecto.vercel.app`)

---

## 📝 Comandos Útiles

### Deploy desde CLI (alternativa):
```bash
cd SV.003-main/frontend
npm install -g vercel
vercel login
vercel --prod
```

### Ver logs:
```bash
vercel logs
```

---

## 🆘 Problemas Comunes

### Build falla
- Verifica que `Root Directory` sea `SV.003-main/frontend`
- Verifica que `Install Command` incluya `--legacy-peer-deps`

### Variables de entorno no funcionan
- Asegúrate de que empiecen con `REACT_APP_`
- Vuelve a hacer deploy después de agregar variables
- Las variables se inyectan en tiempo de build

### Error de CORS
- Verifica que `REACT_APP_BACKEND_URL` apunte al backend correcto
- Asegúrate de que el backend permita el origen de Vercel

---

## ✅ Checklist Final

Antes de desplegar, asegúrate de tener:
- [ ] Repositorio en GitHub (✅ Ya lo tienes)
- [ ] Cuenta de Vercel (✅ Ya la tienes)
- [ ] URL del backend desplegado
- [ ] Credenciales de Supabase (URL y anon key)
- [ ] Configuración correcta en Vercel (Root Directory, Build Command)
- [ ] Variables de entorno configuradas en Vercel

---

**¿Necesitas ayuda con alguno de estos pasos?** Dime qué información específica te falta y te ayudo a obtenerla.

