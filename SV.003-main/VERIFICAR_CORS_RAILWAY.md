# 🔍 Verificar y Solucionar CORS en Railway

## Problema Actual

El error de CORS persiste después de actualizar el código. Necesitamos verificar:

1. ✅ Que el código se haya desplegado en Railway
2. ✅ Que la variable `CORS_ALLOW_ORIGINS` esté configurada
3. ✅ Que el backend se haya redesplegado

---

## ✅ Paso 1: Verificar Deployment en Railway

### 1.1. Ir a Railway

1. Ve a **Railway Dashboard**: https://railway.app/dashboard
2. Selecciona tu proyecto/servicio del **backend**

### 1.2. Verificar Último Deployment

1. Ve a **Deployments**
2. Verifica el deployment más reciente:
   - ✅ **¿Tiene el commit más reciente?** (debe decir algo sobre "CORS para dominios de Vercel")
   - ✅ **¿Está en estado "Active" o "Success"?**
   - ❌ Si no tiene el commit más reciente, Railway no está conectado a GitHub o no auto-despliega

### 1.3. Si No Se Desplegó Automáticamente

1. Haz clic en **"Redeploy"** o **"Deploy"**
2. Espera 1-2 minutos

---

## ✅ Paso 2: Verificar Variable CORS_ALLOW_ORIGINS

### 2.1. Ir a Variables

1. En Railway → Tu proyecto → **Variables** (o **Settings** → **Variables**)

### 2.2. Verificar Variable

Busca la variable `CORS_ALLOW_ORIGINS`

**Si NO existe:**
1. Haz clic en **"Add Variable"** o **"New Variable"**
2. **Name**: `CORS_ALLOW_ORIGINS`
3. **Value**: 
   ```
   https://guiaa.vet,https://www.guiaa.vet,http://localhost:3000
   ```
4. Guarda

**Si existe:**
1. Verifica que el valor sea:
   ```
   https://guiaa.vet,https://www.guiaa.vet,http://localhost:3000
   ```
2. **IMPORTANTE**: No debe tener espacios después de las comas
3. Si está mal, edítalo y guarda

### 2.3. Redesplegar Después de Cambiar

Después de agregar/modificar la variable:
1. Railway debería redesplegar automáticamente
2. Si no, ve a **Deployments** → **Redeploy**

---

## ✅ Paso 3: Verificar Logs del Backend

### 3.1. Ver Logs

1. En Railway → **Deployments** → Selecciona el más reciente
2. Ve a **Logs**
3. Busca mensajes al inicio que muestren:
   - Que el servidor inició correctamente
   - Que CORS está configurado

### 3.2. Buscar Errores

Si hay errores en los logs:
- Compártelos para diagnosticar
- Los errores comunes son:
  - Variables de entorno faltantes
  - Errores de sintaxis en el código
  - Problemas de conexión a Supabase

---

## ✅ Paso 4: Probar CORS Directamente

### 4.1. Probar OPTIONS (Preflight)

En la consola del navegador (F12 → Console), ejecuta:

```javascript
fetch('https://api.guiaa.vet/api/auth/login', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://guiia-consultions-o9jcjwgl3-guiaas-projects-3095cfc3.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
  }
})
.then(r => {
  console.log('OPTIONS Status:', r.status);
  console.log('CORS Headers:', {
    'access-control-allow-origin': r.headers.get('access-control-allow-origin'),
    'access-control-allow-methods': r.headers.get('access-control-allow-methods'),
    'access-control-allow-credentials': r.headers.get('access-control-allow-credentials')
  });
})
.catch(err => console.error('Error:', err));
```

**Resultados esperados:**
- ✅ **Status 200/204**: OPTIONS funciona
- ✅ **CORS Headers muestra tu origen o `*`**: CORS configurado
- ❌ **Status 405**: OPTIONS no permitido (problema de configuración)
- ❌ **CORS Error**: Aún falta configurar

---

## 🐛 Solución Alternativa: Verificar Código en Railway

### Si Railway No Está Conectado a GitHub

1. En Railway → **Settings** → **Source**
2. Verifica que esté conectado a tu repositorio de GitHub
3. Si no está conectado, conéctalo

### Si Railway Está Conectado pero No Auto-Despliega

1. Verifica que el branch sea `main` o `master`
2. Haz un commit pequeño para forzar un nuevo deployment
3. O haz clic en **"Redeploy"** manualmente

---

## 📋 Checklist de Verificación

- [ ] Último deployment en Railway tiene el commit más reciente
- [ ] Deployment está en estado "Active" o "Success"
- [ ] Variable `CORS_ALLOW_ORIGINS` existe en Railway
- [ ] Valor de `CORS_ALLOW_ORIGINS` es correcto (sin espacios)
- [ ] Backend redesplegado después de configurar variables
- [ ] Prueba OPTIONS devuelve status 200/204
- [ ] Headers de CORS aparecen en la respuesta

---

## 🆘 Si Aún No Funciona

Comparte:

1. **Estado del último deployment** en Railway:
   - ¿Tiene el commit más reciente?
   - ¿Está en estado "Active"?

2. **Variable CORS_ALLOW_ORIGINS**:
   - ¿Existe en Railway?
   - ¿Cuál es el valor exacto?

3. **Resultado de la prueba OPTIONS** (código de arriba):
   - ¿Qué status code obtuviste?
   - ¿Qué headers de CORS aparecen?

4. **Logs del backend** en Railway:
   - ¿Hay errores al iniciar?
   - ¿Qué mensajes aparecen al inicio?

Con esa información podré darte la solución exacta.

