# 🔧 Solución: Error 405 en Login

## Problema Identificado

El error **405 (Method Not Allowed)** ocurre porque el backend no está permitiendo peticiones desde `https://guiaa.vet` debido a la configuración de **CORS**.

---

## ✅ Solución: Configurar CORS en Railway

### Paso 1: Agregar Variable de Entorno en Railway

1. Ve a **Railway Dashboard**: https://railway.app
2. Selecciona tu proyecto/servicio del backend
3. Ve a **Variables** (o **Settings** → **Variables**)
4. Busca o agrega la variable:

**Variable:**
```
CORS_ALLOW_ORIGINS
```

**Valor:**
```
https://guiaa.vet,https://www.guiaa.vet,http://localhost:3000,http://127.0.0.1:3000
```

**Nota**: Incluye todas las variantes del dominio que uses.

---

### Paso 2: Verificar que el Backend Esté Corriendo

1. En Railway, ve a **Deployments**
2. Verifica que el último deployment esté **activo** (verde)
3. Si no está activo, haz clic en **Redeploy**

---

### Paso 3: Verificar la URL del Backend

1. En Railway, ve a **Settings** → **Networking**
2. Copia la **Public Domain** (debería ser algo como `xxx.railway.app`)
3. Verifica que en Vercel tengas configurada:
   - `REACT_APP_BACKEND_URL = https://api.guiaa.vet` (si tienes dominio personalizado)
   - O `REACT_APP_BACKEND_URL = https://xxx.railway.app` (si usas el dominio de Railway)

---

### Paso 4: Verificar Dominio Personalizado (Opcional)

Si estás usando `https://api.guiaa.vet`:

1. En Railway, ve a **Settings** → **Networking**
2. Verifica que el dominio personalizado esté configurado
3. Si no está configurado, agrégalo:
   - **Custom Domain**: `api.guiaa.vet`
   - Railway te dará un registro DNS para configurar

---

## 🔍 Verificación

### 1. Probar el Endpoint Directamente

Abre tu navegador y visita:
```
https://api.guiaa.vet/health
```

O si usas el dominio de Railway:
```
https://xxx.railway.app/health
```

Deberías ver una respuesta JSON con el estado del servidor.

---

### 2. Probar desde la Consola del Navegador

1. Abre `https://guiaa.vet`
2. Presiona **F12** → **Console**
3. Ejecuta este código:

```javascript
fetch('https://api.guiaa.vet/health', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

Si ves un error de CORS, confirma que falta la configuración.

---

### 3. Probar el Login

Después de configurar CORS y redesplegar:

1. Espera 1-2 minutos para que Railway redesplegue
2. Intenta hacer login nuevamente
3. El error 405 debería desaparecer

---

## 🐛 Si Aún No Funciona

### Verificar Logs de Railway

1. En Railway, ve a **Deployments** → Selecciona el deployment más reciente
2. Ve a **Logs**
3. Busca errores relacionados con:
   - CORS
   - El endpoint `/api/auth/login`
   - Errores de conexión a Supabase

---

### Verificar que el Endpoint Exista

El endpoint debería estar en `server_simple.py` línea 878:

```python
@app.post("/api/auth/login")
async def login_veterinarian(credentials: VeterinarianLogin):
    ...
```

---

## 📋 Checklist

- [ ] Variable `CORS_ALLOW_ORIGINS` configurada en Railway
- [ ] Valor incluye `https://guiaa.vet`
- [ ] Backend redesplegado después de agregar la variable
- [ ] URL del backend correcta en Vercel (`REACT_APP_BACKEND_URL`)
- [ ] Endpoint `/health` responde correctamente
- [ ] Login funciona sin error 405

---

## 🔗 Enlaces Útiles

- **Railway Dashboard**: https://railway.app/dashboard
- **Documentación CORS FastAPI**: https://fastapi.tiangolo.com/tutorial/cors/

