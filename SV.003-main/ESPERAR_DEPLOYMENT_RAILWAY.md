# ⏳ Esperar Deployment en Railway

## ✅ Cambios Realizados

He agregado un **handler OPTIONS explícito** para manejar las peticiones CORS preflight. Los cambios ya están en GitHub.

---

## 🔄 Paso 1: Verificar Deployment en Railway

### 1.1. Ir a Railway

1. Ve a **Railway Dashboard**: https://railway.app/dashboard
2. Selecciona tu proyecto/servicio del **backend**

### 1.2. Verificar Nuevo Deployment

1. Ve a **Deployments**
2. Deberías ver un nuevo deployment con el commit: **"Agregar handler OPTIONS explicito para CORS preflight"**
3. El estado debería cambiar de "Building" a "Active" (verde)

### 1.3. Si No Aparece Automáticamente

1. Haz clic en **"Redeploy"** o **"Deploy"**
2. Espera **1-2 minutos** para que termine

---

## ✅ Paso 2: Verificar Variable CORS_ALLOW_ORIGINS

Mientras esperas el deployment, verifica:

1. En Railway → **Variables**
2. Busca `CORS_ALLOW_ORIGINS`
3. Debe tener:
   ```
   https://guiaa.vet,https://www.guiaa.vet,http://localhost:3000
   ```
4. Si no existe, agrégalo

---

## ✅ Paso 3: Probar Después del Deployment

Después de que el deployment termine (estado "Active"):

1. Espera **30 segundos adicionales** para que el servidor se reinicie completamente
2. Visita `https://guiaa.vet`
3. Intenta hacer login
4. El error 405 en OPTIONS debería desaparecer

---

## 🔍 Verificación Rápida

En la consola (F12 → Console), ejecuta:

```javascript
fetch('https://api.guiaa.vet/api/auth/login', {
  method: 'OPTIONS',
  headers: {
    'Origin': window.location.origin,
    'Access-Control-Request-Method': 'POST'
  }
})
.then(r => {
  console.log('OPTIONS Status:', r.status);
  console.log('Allow Header:', r.headers.get('allow'));
  console.log('CORS OK:', r.status === 200 || r.status === 204);
})
.catch(err => console.error('Error:', err));
```

**Resultados esperados:**
- ✅ **Status 200 o 204**: OPTIONS funciona
- ✅ **Allow Header incluye OPTIONS**: Handler funcionando
- ❌ **Status 405**: Aún no se ha desplegado o hay otro problema

---

## 📋 Checklist

- [ ] Nuevo deployment iniciado en Railway
- [ ] Deployment terminó con estado "Active" (verde)
- [ ] Variable `CORS_ALLOW_ORIGINS` configurada en Railway
- [ ] Esperado 30 segundos adicionales después del deployment
- [ ] Prueba OPTIONS devuelve status 200/204
- [ ] Login funciona sin error 405

---

## 🆘 Si Aún No Funciona

Comparte:
1. **¿El deployment terminó correctamente?** (estado "Active")
2. **¿Qué resultado da la prueba OPTIONS?** (código de arriba)
3. **¿Qué muestran los logs del backend?** (últimas 20 líneas)

Con esa información podré ayudarte a resolver el problema específico.

