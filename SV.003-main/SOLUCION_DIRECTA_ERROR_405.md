# 🚀 Solución Directa: Error 405

## Diagnóstico Rápido

El error 405 significa que el backend **no está recibiendo la petición correctamente** o **está rechazando el método POST**.

---

## ✅ Solución Inmediata

### Opción 1: Verificar que CORS Esté Configurado (MÁS PROBABLE)

1. **Ve a Railway Dashboard** → Tu proyecto → **Variables**
2. **Busca o agrega** esta variable:

```
CORS_ALLOW_ORIGINS
```

**Valor exacto (sin espacios extra):**
```
https://guiaa.vet,https://www.guiaa.vet,http://localhost:3000,http://127.0.0.1:3000
```

3. **IMPORTANTE**: Después de agregar/modificar, Railway debe **redesplegar automáticamente**
4. Si no redesplega, ve a **Deployments** → **Redeploy**

---

### Opción 2: Verificar que el Backend Esté Corriendo

1. **Abre en tu navegador:**
   ```
   https://api.guiaa.vet/docs
   ```
   
   O si usas el dominio de Railway:
   ```
   https://tu-proyecto.railway.app/docs
   ```

2. **Si NO carga**:
   - El backend no está accesible
   - Verifica que esté corriendo en Railway
   - Verifica que el dominio personalizado esté configurado

3. **Si carga**:
   - El backend está funcionando
   - El problema es CORS o la configuración del endpoint

---

### Opción 3: Probar el Endpoint Directamente

**Abre la consola del navegador** (F12 → Console) y ejecuta:

```javascript
fetch('https://api.guiaa.vet/api/auth/login', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://guiaa.vet',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
  }
})
.then(r => {
  console.log('OPTIONS Status:', r.status);
  console.log('CORS Headers:', {
    'access-control-allow-origin': r.headers.get('access-control-allow-origin'),
    'access-control-allow-methods': r.headers.get('access-control-allow-methods')
  });
})
.catch(err => console.error('Error:', err));
```

**Resultados:**
- ✅ **Status 200/204**: CORS está configurado correctamente
- ❌ **Status 405**: El método OPTIONS no está permitido (problema de CORS)
- ❌ **Error de red**: El backend no está accesible

---

## 🔧 Si CORS Ya Está Configurado

Si ya configuraste `CORS_ALLOW_ORIGINS` y sigue el error:

### 1. Verifica el Valor Exacto

En Railway, el valor debe ser **exactamente** (sin espacios):
```
https://guiaa.vet,https://www.guiaa.vet,http://localhost:3000,http://127.0.0.1:3000
```

**NO debe tener:**
- Espacios después de las comas
- Comillas alrededor del valor
- Saltos de línea

### 2. Verifica que el Backend se Redesplegó

1. Ve a **Railway** → **Deployments**
2. Verifica que haya un deployment **reciente** (últimos 5 minutos)
3. Si no hay uno reciente, haz clic en **Redeploy**

### 3. Verifica los Logs

1. En Railway → **Deployments** → Selecciona el más reciente → **Logs**
2. Intenta hacer login desde el frontend
3. Busca en los logs:
   - ¿Aparece la petición?
   - ¿Hay errores de CORS?
   - ¿Hay errores de Supabase?

---

## 🆘 Solución Alternativa: Usar el Dominio de Railway Directamente

Si `api.guiaa.vet` no funciona, puedes usar el dominio de Railway temporalmente:

1. **En Railway** → **Settings** → **Networking**
2. Copia el **Public Domain** (algo como `xxx.railway.app`)

3. **En Vercel** → Tu proyecto → **Settings** → **Environment Variables**
4. Cambia `REACT_APP_BACKEND_URL` a:
   ```
   https://xxx.railway.app
   ```
   (reemplaza `xxx.railway.app` con tu dominio real)

5. **Redesplega** el frontend en Vercel

6. **En Railway**, agrega también el dominio de Railway a CORS:
   ```
   CORS_ALLOW_ORIGINS = https://guiaa.vet,https://www.guiaa.vet,https://xxx.railway.app,http://localhost:3000
   ```

---

## 📋 Checklist Final

- [ ] Variable `CORS_ALLOW_ORIGINS` existe en Railway
- [ ] Valor es correcto (sin espacios extra)
- [ ] Backend redesplegado después de configurar CORS
- [ ] Backend accesible en `https://api.guiaa.vet/docs` (o dominio de Railway)
- [ ] Frontend usa la URL correcta (verificar en consola: `Backend URL being used:`)
- [ ] Prueba OPTIONS devuelve status 200/204

---

## 🎯 Próximos Pasos

1. **Ejecuta la prueba OPTIONS** (Opción 3 arriba)
2. **Comparte el resultado**:
   - ¿Qué status code obtuviste?
   - ¿Qué headers de CORS aparecen?
   - ¿Hay algún error en la consola?

Con esa información podré darte la solución exacta.

