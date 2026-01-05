# 🔧 Solución: Error "Failed to fetch"

## Problema Identificado

El error cambió de **405** a **"Failed to fetch"**, lo que significa:
- ✅ La aplicación está intentando hacer la petición
- ❌ La petición no llega al backend o es bloqueada

---

## 🔍 Diagnóstico Rápido

### Paso 1: Verificar que el Backend Esté Accesible

Abre en tu navegador:

```
https://api.guiaa.vet/docs
```

O si usas Railway directamente:

```
https://guiiaconsultions-production.up.railway.app/docs
```

**Resultados:**
- ✅ **Si carga**: El backend está funcionando, el problema es CORS o la URL
- ❌ **Si NO carga**: El backend no está accesible o el dominio no está configurado

---

### Paso 2: Probar el Endpoint desde la Consola

1. Abre `https://guiaa.vet`
2. Presiona **F12** → **Console**
3. Ejecuta este código:

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
.catch(err => {
  console.error('Error completo:', err);
  console.error('Mensaje:', err.message);
});
```

**Comparte el resultado:**
- ¿Qué error aparece?
- ¿Es un error de CORS?
- ¿Es un error de red?

---

## ✅ Soluciones por Problema

### Problema 1: Backend No Accesible

**Síntoma**: No puedes acceder a `https://api.guiaa.vet/docs`

**Soluciones**:

#### Opción A: Usar Dominio de Railway Directamente

1. **En Vercel** → **Settings** → **Environment Variables**
2. Cambia `REACT_APP_BACKEND_URL` a:
   ```
   https://guiiaconsultions-production.up.railway.app
   ```
3. **Redesplega** el frontend

#### Opción B: Configurar Dominio Personalizado

1. **En Railway** → **Settings** → **Networking**
2. Agrega dominio personalizado: `api.guiaa.vet`
3. Railway te dará un registro DNS
4. **En Cloudflare** (o tu DNS):
   - Agrega registro **CNAME**:
     - **Name**: `api`
     - **Target**: El dominio que Railway te dé
5. Espera 5-10 minutos para que el DNS se propague

---

### Problema 2: Error de CORS

**Síntoma**: En la consola ves `"Access to fetch... has been blocked by CORS policy"`

**Solución**:

1. **En Railway** → Tu proyecto → **Variables**
2. Verifica que exista `CORS_ALLOW_ORIGINS` con:
   ```
   https://guiaa.vet,https://www.guiaa.vet,http://localhost:3000
   ```
3. **IMPORTANTE**: No debe tener espacios después de las comas
4. **Redesplega** el backend después de configurar

---

### Problema 3: Backend No Está Corriendo

**Síntoma**: El backend no responde a ninguna petición

**Solución**:

1. **En Railway** → **Deployments**
2. Verifica que el último deployment esté en estado **"Active"** (verde)
3. Si no está activo, haz clic en **Redeploy**
4. Revisa los **Logs** para ver si hay errores

---

### Problema 4: URL Incorrecta

**Síntoma**: La URL en la consola no tiene `https://` o está mal formada

**Solución**:

1. **En Vercel** → **Settings** → **Environment Variables**
2. Verifica que `REACT_APP_BACKEND_URL` sea:
   - `https://api.guiaa.vet` (con `https://`)
   - O `https://guiiaconsultions-production.up.railway.app` (con `https://`)
3. **Redesplega** el frontend

---

## 🎯 Solución Rápida Recomendada

### Si el Backend NO Está Accesible:

1. **Usa el dominio de Railway directamente** (más rápido):

   **En Vercel:**
   - `REACT_APP_BACKEND_URL = https://guiiaconsultions-production.up.railway.app`

   **En Railway:**
   - `CORS_ALLOW_ORIGINS = https://guiaa.vet,https://www.guiaa.vet,https://guiiaconsultions-production.up.railway.app,http://localhost:3000`

2. **Redesplega ambos** (frontend y backend)

3. **Limpia localStorage**:
   ```javascript
   localStorage.removeItem('backend_url');
   location.reload();
   ```

---

## 🔍 Verificación Paso a Paso

1. **Backend accesible**: ¿Carga `https://api.guiaa.vet/docs` o el dominio de Railway?
2. **URL correcta**: ¿La consola muestra la URL con `https://`?
3. **CORS configurado**: ¿Existe `CORS_ALLOW_ORIGINS` en Railway?
4. **Backend corriendo**: ¿El deployment en Railway está activo?
5. **Frontend redesplegado**: ¿Redesplegaste después de cambiar variables?

---

## 🆘 Si Nada Funciona

Comparte:

1. **¿Carga** `https://api.guiaa.vet/docs` o el dominio de Railway?
2. **Resultado** de la prueba en la consola (código de arriba)
3. **Estado del deployment** en Railway (¿está activo?)
4. **Logs del backend** en Railway (últimas 20 líneas)

Con esa información podré darte la solución exacta.

