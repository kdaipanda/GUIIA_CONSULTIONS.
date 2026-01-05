# 🔧 Solución: Error 405 en OPTIONS (CORS Preflight)

## 🔴 Problema Actual

El error muestra:
```
OPTIONS https://api.guiaa.vet/api/auth/login 405 (Method Not Allowed)
Status: 405
CORS OK: null
```

**Causa**: El backend no está permitiendo el método `OPTIONS`, que es necesario para las peticiones CORS preflight.

---

## ✅ Solución: Verificar Configuración CORS

### Paso 1: Verificar que CORS Permita OPTIONS

El código ya debería tener `allow_methods=["*"]` que permite todos los métodos, incluyendo OPTIONS. Pero necesitamos verificar que:

1. El backend se haya redesplegado con el código actualizado
2. La variable `CORS_ALLOW_ORIGINS` esté configurada en Railway

---

### Paso 2: Verificar Variable en Railway

1. Ve a **Railway Dashboard** → Tu proyecto → **Variables**
2. Verifica que exista `CORS_ALLOW_ORIGINS` con:
   ```
   https://guiaa.vet,https://www.guiaa.vet,http://localhost:3000
   ```
3. Si no existe, agrégalo

---

### Paso 3: Verificar Deployment en Railway

1. En Railway → **Deployments**
2. Verifica que el último deployment tenga el commit más reciente
3. Si no lo tiene, haz clic en **"Redeploy"**
4. Espera 1-2 minutos

---

### Paso 4: Verificar Logs del Backend

1. En Railway → **Deployments** → Selecciona el más reciente → **Logs**
2. Busca mensajes al inicio que muestren:
   - Que el servidor inició correctamente
   - Que CORS está configurado
   - Si hay errores al iniciar

---

## 🔍 Verificación Alternativa

### Probar el Endpoint Directamente

En la consola del navegador, ejecuta:

```javascript
// Probar POST directamente (sin preflight)
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
  console.log('POST Status:', r.status);
  console.log('CORS Headers:', {
    'access-control-allow-origin': r.headers.get('access-control-allow-origin'),
    'access-control-allow-methods': r.headers.get('access-control-allow-methods')
  });
  return r.text();
})
.then(text => console.log('Response:', text))
.catch(err => console.error('Error:', err));
```

**Resultados esperados:**
- ✅ **Status 200 o 401**: El endpoint funciona (401 es normal con credenciales incorrectas)
- ✅ **CORS Headers muestran tu origen**: CORS configurado correctamente
- ❌ **CORS Error**: Aún falta configurar CORS
- ❌ **Status 405**: El método POST no está permitido (problema diferente)

---

## 🐛 Si el Error 405 Persiste

### Verificar que el Código Esté Correcto

El código en `server_simple.py` debería tener:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins,
    allow_origin_regex=r"https?://.*\.(trycloudflare\.com|vercel\.app)",
    allow_credentials=True,
    allow_methods=["*"],  # Esto permite OPTIONS
    allow_headers=["*"],
)
```

Si `allow_methods=["*"]` está configurado, debería permitir OPTIONS automáticamente.

---

### Solución Alternativa: Agregar Endpoint OPTIONS Manualmente

Si el middleware no funciona, podemos agregar un endpoint OPTIONS manualmente. Pero primero, verifica que el código esté desplegado correctamente.

---

## 📋 Checklist

- [ ] Variable `CORS_ALLOW_ORIGINS` configurada en Railway
- [ ] Backend redesplegado con el código más reciente
- [ ] Código tiene `allow_methods=["*"]`
- [ ] Logs del backend muestran que inició correctamente
- [ ] Prueba POST devuelve status 200/401 (no 405)
- [ ] Headers de CORS aparecen en la respuesta

---

## 🆘 Si Nada Funciona

Comparte:
1. **¿Qué muestran los logs del backend en Railway?** (últimas 20 líneas)
2. **¿El último deployment tiene el commit más reciente?**
3. **¿Qué resultado da la prueba POST?** (código de arriba)

Con esa información podré darte la solución exacta.

