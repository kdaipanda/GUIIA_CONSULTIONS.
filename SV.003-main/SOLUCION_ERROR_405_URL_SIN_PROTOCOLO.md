# 🔧 Solución: Error 405 - URL sin Protocolo

## Problema Identificado

La consola muestra:
```
Backend URL being used: guiiaconsultions-production.up.railway.app
```

**Falta el `https://`** al inicio, lo que puede causar que el navegador no haga la petición correctamente.

---

## ✅ Solución: Configurar URL Correcta en Vercel

### Paso 1: Verificar Variable en Vercel

1. Ve a **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. Busca la variable `REACT_APP_BACKEND_URL`
3. **Verifica que el valor sea:**
   ```
   https://api.guiaa.vet
   ```
   O si usas Railway directamente:
   ```
   https://guiiaconsultions-production.up.railway.app
   ```

**IMPORTANTE**: Debe empezar con `https://` (no solo el dominio)

---

### Paso 2: Si Usas Dominio Personalizado (api.guiaa.vet)

Si quieres usar `https://api.guiaa.vet`:

1. **En Railway**:
   - Ve a **Settings** → **Networking**
   - Verifica que el dominio personalizado `api.guiaa.vet` esté configurado
   - Si no está, agrégalo (Railway te dará un registro DNS)

2. **En Cloudflare** (o tu proveedor DNS):
   - Agrega un registro **CNAME**:
     - **Name**: `api`
     - **Target**: El dominio que Railway te dé (algo como `xxx.railway.app`)

3. **En Vercel**:
   - Configura `REACT_APP_BACKEND_URL = https://api.guiaa.vet`

---

### Paso 3: Si Usas Dominio de Railway Directamente

Si prefieres usar el dominio de Railway directamente:

1. **En Vercel**:
   - Configura `REACT_APP_BACKEND_URL = https://guiiaconsultions-production.up.railway.app`
   - **IMPORTANTE**: Debe incluir `https://` al inicio

2. **En Railway**:
   - Agrega a `CORS_ALLOW_ORIGINS`:
     ```
     https://guiaa.vet,https://www.guiaa.vet,https://guiiaconsultions-production.up.railway.app,http://localhost:3000
     ```

---

### Paso 4: Limpiar localStorage

El código puede estar usando una URL guardada en localStorage. Limpia la caché:

1. Abre `https://guiaa.vet`
2. Presiona **F12** → **Console**
3. Ejecuta:
   ```javascript
   localStorage.removeItem('backend_url');
   location.reload();
   ```

---

### Paso 5: Redesplegar Frontend

Después de configurar la variable correctamente:

1. **En Vercel** → **Deployments** → **Redeploy**
2. Espera 1-2 minutos

---

## 🔍 Verificación

Después de redesplegar:

1. Visita `https://guiaa.vet`
2. Presiona **F12** → **Console**
3. Verifica que el mensaje diga:
   ```
   Backend URL being used: https://api.guiaa.vet
   ```
   O:
   ```
   Backend URL being used: https://guiiaconsultions-production.up.railway.app
   ```

**Debe empezar con `https://`**

---

## 🐛 Si el Error 405 Persiste

Si después de corregir la URL sigue el error 405:

### 1. Verificar CORS en Railway

1. Ve a **Railway** → Tu proyecto → **Variables**
2. Verifica que exista `CORS_ALLOW_ORIGINS` con:
   ```
   https://guiaa.vet,https://www.guiaa.vet,http://localhost:3000
   ```
3. **Redesplega** el backend después de configurar

### 2. Probar el Endpoint Directamente

En la consola del navegador, ejecuta:

```javascript
fetch('https://api.guiaa.vet/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@test.com',
    cedula_profesional: '12345678'
  })
})
.then(r => {
  console.log('Status:', r.status);
  return r.text();
})
.then(text => console.log('Response:', text))
.catch(err => console.error('Error:', err));
```

**Resultados esperados:**
- ✅ **Status 401**: El endpoint funciona (401 es normal con credenciales incorrectas)
- ❌ **Status 405**: El método POST no está permitido (problema de CORS o configuración)
- ❌ **CORS Error**: El backend no permite el origen

### 3. Verificar Logs del Backend

1. En **Railway** → **Deployments** → Selecciona el más reciente → **Logs**
2. Intenta hacer login desde el frontend
3. Busca en los logs:
   - ¿Llega la petición?
   - ¿Hay errores de CORS?
   - ¿Hay errores de Supabase?

---

## 📋 Checklist

- [ ] Variable `REACT_APP_BACKEND_URL` configurada en Vercel
- [ ] URL incluye `https://` al inicio
- [ ] Variable `CORS_ALLOW_ORIGINS` configurada en Railway
- [ ] Backend redesplegado después de configurar CORS
- [ ] Frontend redesplegado después de configurar URL
- [ ] localStorage limpiado (si es necesario)
- [ ] Consola muestra URL correcta con `https://`
- [ ] Login funciona sin error 405

---

## 🆘 Si Nada Funciona

Comparte:
1. **La URL exacta** que aparece en la consola después de redesplegar
2. **El resultado** de probar el endpoint directamente (código de arriba)
3. **Los logs del backend** de Railway (últimas 20 líneas cuando intentas login)

Con esa información podré darte la solución exacta.

