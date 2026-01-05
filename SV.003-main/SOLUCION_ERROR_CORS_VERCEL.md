# 🔧 Solución: Error CORS con Vercel

## Problema Identificado

El error en la consola muestra:
```
Access to fetch at 'https://api.guiaa.vet/api/auth/login' from origin 'https://guiia-consultions-o9jcjwgl3-guiaas-projects-3095cfc3.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Causa**: El backend no está permitiendo peticiones desde los dominios de Vercel (tanto producción como previews).

---

## ✅ Solución: Configurar CORS en Railway

### Paso 1: Ir a Railway

1. Ve a **Railway Dashboard**: https://railway.app/dashboard
2. Selecciona tu proyecto/servicio del **backend**
3. Ve a **Variables** (o **Settings** → **Variables**)

### Paso 2: Configurar CORS_ALLOW_ORIGINS

Busca o agrega la variable:

**Nombre:**
```
CORS_ALLOW_ORIGINS
```

**Valor:**
```
https://guiaa.vet,https://www.guiaa.vet,https://*.vercel.app,http://localhost:3000,http://127.0.0.1:3000
```

**⚠️ IMPORTANTE**:
- No debe tener espacios después de las comas
- Incluye `https://*.vercel.app` para permitir todos los previews de Vercel
- Incluye `https://guiaa.vet` para producción

### Paso 3: Verificar Configuración en el Código

El código en `server_simple.py` ya tiene soporte para regex en CORS. Verifica que tenga:

```python
allow_origin_regex=r"https?://.*\.vercel\.app"
```

Esto debería estar ya configurado, pero verifica.

### Paso 4: Redesplegar Backend

1. Railway debería redesplegar automáticamente después de agregar la variable
2. Si no, ve a **Deployments** → **Redeploy**
3. Espera 1-2 minutos

---

## 🔍 Verificación

### 1. Probar desde la Consola

Después de redesplegar, en la consola del navegador (F12 → Console):

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
  console.log('CORS Headers:', {
    'access-control-allow-origin': r.headers.get('access-control-allow-origin')
  });
  return r.text();
})
.then(text => console.log('Response:', text))
.catch(err => console.error('Error:', err));
```

**Resultados esperados:**
- ✅ **Status 200 o 401**: CORS funciona (401 es normal con credenciales incorrectas)
- ✅ **CORS Headers muestra tu origen**: CORS configurado correctamente
- ❌ **CORS Error**: Aún falta configurar o el backend no se redesplegó

---

### 2. Probar el Login

1. Visita `https://guiaa.vet`
2. Intenta hacer login
3. El error de CORS debería desaparecer

---

## 🐛 Si el Error Persiste

### Verificar que la Variable Esté Correcta

En Railway, el valor debe ser **exactamente** (sin espacios):
```
https://guiaa.vet,https://www.guiaa.vet,https://*.vercel.app,http://localhost:3000
```

**NO debe tener:**
- Espacios después de las comas
- Comillas alrededor del valor
- Saltos de línea

---

### Verificar que el Backend se Redesplegó

1. En Railway → **Deployments**
2. Verifica que haya un deployment **reciente** (últimos 5 minutos)
3. Si no hay uno reciente, haz clic en **Redeploy**

---

### Verificar Logs del Backend

1. En Railway → **Deployments** → Selecciona el más reciente → **Logs**
2. Busca mensajes relacionados con CORS o el inicio del servidor
3. Verifica que no haya errores al iniciar

---

## 📋 Checklist

- [ ] Variable `CORS_ALLOW_ORIGINS` configurada en Railway
- [ ] Valor incluye `https://guiaa.vet`
- [ ] Valor incluye `https://*.vercel.app` (para previews)
- [ ] Valor incluye `http://localhost:3000` (para desarrollo)
- [ ] No hay espacios después de las comas
- [ ] Backend redesplegado después de configurar
- [ ] Prueba en consola muestra status 200/401 (no error CORS)
- [ ] Login funciona sin error CORS

---

## 🎯 Configuración Recomendada Final

Para máxima compatibilidad, usa este valor en `CORS_ALLOW_ORIGINS`:

```
https://guiaa.vet,https://www.guiaa.vet,https://*.vercel.app,http://localhost:3000,http://127.0.0.1:3000
```

Esto permite:
- ✅ Producción: `https://guiaa.vet`
- ✅ Previews de Vercel: `https://*.vercel.app` (cualquier subdominio)
- ✅ Desarrollo local: `localhost:3000`

---

## 🆘 Si Aún No Funciona

Comparte:
1. **Valor exacto** de `CORS_ALLOW_ORIGINS` en Railway
2. **Resultado de la prueba** en la consola (código de arriba)
3. **Logs del backend** en Railway (últimas 20 líneas)

Con esa información podré ayudarte a resolver el problema específico.

