# 🔍 Verificar Deployment en Railway

## 🔴 Problema Actual

El error 405 en OPTIONS indica que el backend no está permitiendo el método OPTIONS. Esto puede ser porque:

1. El backend no se ha redesplegado con el código actualizado
2. Railway no está usando el código más reciente
3. Hay un problema con la configuración de Railway

---

## ✅ Paso 1: Verificar Deployment en Railway

### 1.1. Ir a Railway

1. Ve a **Railway Dashboard**: https://railway.app/dashboard
2. Selecciona tu proyecto/servicio del **backend**

### 1.2. Verificar Último Deployment

1. Ve a **Deployments**
2. Verifica el deployment más reciente:
   - ✅ **¿Tiene el commit "Agregar soporte CORS para dominios de Vercel"?**
   - ✅ **¿Está en estado "Active" o "Success"?**
   - ✅ **¿Cuándo fue el último deployment?**

### 1.3. Si No Tiene el Commit Más Reciente

1. Haz clic en **"Redeploy"** o **"Deploy"**
2. Espera 1-2 minutos
3. Verifica que el nuevo deployment tenga el commit más reciente

---

## ✅ Paso 2: Verificar Variables de Entorno

### 2.1. Verificar CORS_ALLOW_ORIGINS

1. En Railway → **Variables**
2. Busca `CORS_ALLOW_ORIGINS`
3. Verifica que el valor sea:
   ```
   https://guiaa.vet,https://www.guiaa.vet,http://localhost:3000
   ```
4. Si no existe o está mal, agrégalo/modifícalo
5. **Redesplega** después de cambiar

---

## ✅ Paso 3: Verificar Logs del Backend

### 3.1. Ver Logs

1. En Railway → **Deployments** → Selecciona el más reciente
2. Ve a **Logs**
3. Busca mensajes al inicio que muestren:
   - Que el servidor inició correctamente
   - Que CORS está configurado
   - Si hay errores al iniciar

### 3.2. Buscar Errores

Si hay errores en los logs:
- Compártelos para diagnosticar
- Los errores comunes son:
  - Variables de entorno faltantes
  - Errores de sintaxis en el código
  - Problemas de conexión a Supabase

---

## ✅ Paso 4: Probar el Backend Directamente

### 4.1. Probar Endpoint de Documentación

Abre en tu navegador:

```
https://api.guiaa.vet/docs
```

**Resultados:**
- ✅ **Si carga**: El backend está funcionando
- ❌ **Si NO carga**: El backend no está accesible o hay un error

---

### 4.2. Probar POST Directamente (Sin Preflight)

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
- ❌ **Status 405**: El método POST no está permitido (problema de configuración)
- ❌ **CORS Error**: Aún falta configurar CORS

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

### Verificar Root Directory en Railway

1. En Railway → **Settings** → **Service**
2. Verifica que el **Root Directory** sea: `SV.003-main/backend`
3. Si no es ese, cámbialo y redesplega

---

## 📋 Checklist

- [ ] Último deployment en Railway tiene el commit más reciente
- [ ] Deployment está en estado "Active" o "Success"
- [ ] Variable `CORS_ALLOW_ORIGINS` configurada en Railway
- [ ] Backend redesplegado después de configurar variables
- [ ] `https://api.guiaa.vet/docs` carga correctamente
- [ ] Prueba POST devuelve status 200/401 (no 405)
- [ ] Headers de CORS aparecen en la respuesta

---

## 🆘 Si Necesitas Ayuda

Comparte:
1. **¿El último deployment tiene el commit más reciente?**
2. **¿Qué muestran los logs del backend?** (últimas 20 líneas)
3. **¿Qué resultado da la prueba POST?** (código de arriba)
4. **¿El Root Directory en Railway es correcto?**

Con esa información podré darte la solución exacta.

