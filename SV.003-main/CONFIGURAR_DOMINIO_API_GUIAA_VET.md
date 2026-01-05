# 🌐 Configurar Dominio Personalizado: api.guiaa.vet

## Objetivo

Configurar `api.guiaa.vet` para que apunte al backend en Railway.

---

## 📋 Paso 1: Configurar en Railway

### 1.1. Ir a Railway

1. Ve a **Railway Dashboard**: https://railway.app/dashboard
2. Selecciona tu proyecto/servicio del **backend**

### 1.2. Agregar Dominio Personalizado

1. Ve a **Settings** → **Networking** (o **Domains**)
2. Busca la sección **"Custom Domains"** o **"Public Domain"**
3. Haz clic en **"Add Custom Domain"** o **"Generate Domain"**
4. Escribe: `api.guiaa.vet`
5. Haz clic en **"Add"** o **"Save"**

### 1.3. Obtener Registro DNS

Railway te mostrará un registro DNS que necesitas configurar. Normalmente será algo como:

- **Tipo**: `CNAME`
- **Name**: `api`
- **Target**: `xxx.railway.app` (un dominio que Railway genera)

**O puede ser:**

- **Tipo**: `A` o `CNAME`
- **Value**: Una IP o dominio específico

**⚠️ IMPORTANTE**: Copia exactamente lo que Railway te muestre.

---

## 📋 Paso 2: Configurar DNS en Cloudflare

### 2.1. Ir a Cloudflare

1. Ve a **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Selecciona el dominio **guiaa.vet**

### 2.2. Ir a DNS

1. En el menú lateral, haz clic en **"DNS"** → **"Records"**

### 2.3. Agregar Registro CNAME

1. Haz clic en **"Add record"**
2. Configura:
   - **Type**: `CNAME`
   - **Name**: `api` (solo `api`, sin `.guiaa.vet`)
   - **Target**: Pega el valor que Railway te dio (algo como `xxx.railway.app`)
   - **Proxy status**: Puede estar en **"Proxied"** (naranja) o **"DNS only"** (gris)
     - **Recomendación**: Usa **"DNS only"** (gris) para APIs
   - **TTL**: `Auto`
3. Haz clic en **"Save"**

---

## 📋 Paso 3: Verificar en Railway

### 3.1. Esperar Propagación DNS

1. Los cambios DNS pueden tardar **5-15 minutos** en propagarse
2. Railway verificará automáticamente cuando el dominio esté configurado

### 3.2. Verificar Estado

1. En Railway → **Settings** → **Networking**
2. Verifica que `api.guiaa.vet` aparezca como **"Active"** o **"Verified"**
3. Si aparece como **"Pending"**, espera unos minutos más

---

## 📋 Paso 4: Configurar CORS en Railway

### 4.1. Agregar Variable de Entorno

1. En Railway → Tu proyecto → **Variables**
2. Busca o agrega `CORS_ALLOW_ORIGINS`
3. Configura el valor:
   ```
   https://guiaa.vet,https://www.guiaa.vet,https://api.guiaa.vet,http://localhost:3000
   ```
4. **IMPORTANTE**: No debe tener espacios después de las comas

### 4.2. Redesplegar

1. Railway debería redesplegar automáticamente
2. Si no, ve a **Deployments** → **Redeploy**

---

## 📋 Paso 5: Configurar en Vercel (Frontend)

### 5.1. Actualizar Variable de Entorno

1. Ve a **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. Busca `REACT_APP_BACKEND_URL`
3. Cambia el valor a:
   ```
   https://api.guiaa.vet
   ```
4. Marca ✅ **Production**, ✅ **Preview**, ✅ **Development**
5. Guarda

### 5.2. Redesplegar Frontend

1. Ve a **Deployments** → **Redeploy**
2. Espera 1-2 minutos

---

## ✅ Verificación

### 1. Verificar que el Dominio Funcione

Abre en tu navegador:

```
https://api.guiaa.vet/docs
```

**Resultados:**
- ✅ **Si carga**: El dominio está configurado correctamente
- ❌ **Si NO carga**: Espera 5-10 minutos más o verifica los pasos anteriores

### 2. Verificar desde la Consola

1. Abre `https://guiaa.vet`
2. Presiona **F12** → **Console**
3. Verifica que diga:
   ```
   Backend URL being used: https://api.guiaa.vet
   ```

### 3. Probar el Login

1. Intenta hacer login
2. El error "Failed to fetch" debería desaparecer
3. Si aparece error 401, es normal (credenciales incorrectas), significa que el endpoint funciona

---

## 🐛 Solución de Problemas

### Problema 1: Railway No Verifica el Dominio

**Síntoma**: El dominio aparece como "Pending" en Railway

**Soluciones**:
1. Verifica que el registro DNS esté correcto en Cloudflare
2. Verifica que el **Name** en Cloudflare sea solo `api` (no `api.guiaa.vet`)
3. Espera 10-15 minutos para la propagación DNS
4. Verifica que el **Proxy status** en Cloudflare no esté bloqueando

---

### Problema 2: Error SSL/Certificado

**Síntoma**: El navegador muestra error de certificado SSL

**Solución**:
1. Railway genera certificados SSL automáticamente
2. Espera 5-10 minutos después de configurar el dominio
3. Si persiste, verifica que el dominio esté en estado "Active" en Railway

---

### Problema 3: El Dominio No Resuelve

**Síntoma**: `api.guiaa.vet` no carga nada

**Soluciones**:
1. Verifica el registro DNS en Cloudflare:
   - **Name**: `api`
   - **Target**: El dominio que Railway te dio
2. Usa una herramienta de verificación DNS:
   - https://dnschecker.org
   - Busca `api.guiaa.vet` tipo `CNAME`
   - Debe mostrar el dominio de Railway
3. Si no resuelve, espera más tiempo (hasta 24 horas en casos raros)

---

### Problema 4: Error de CORS Persiste

**Síntoma**: Después de configurar el dominio, sigue el error de CORS

**Solución**:
1. Verifica que `CORS_ALLOW_ORIGINS` en Railway incluya:
   ```
   https://guiaa.vet,https://www.guiaa.vet,https://api.guiaa.vet
   ```
2. **Redesplega** el backend después de cambiar CORS
3. Limpia la caché del navegador (Ctrl + Shift + R)

---

## 📋 Checklist Final

- [ ] Dominio `api.guiaa.vet` agregado en Railway
- [ ] Registro CNAME configurado en Cloudflare
- [ ] Railway muestra el dominio como "Active" o "Verified"
- [ ] Variable `CORS_ALLOW_ORIGINS` configurada en Railway
- [ ] Variable `REACT_APP_BACKEND_URL` configurada en Vercel con `https://api.guiaa.vet`
- [ ] Backend redesplegado en Railway
- [ ] Frontend redesplegado en Vercel
- [ ] `https://api.guiaa.vet/docs` carga correctamente
- [ ] Login funciona sin errores

---

## 🔗 Enlaces Útiles

- **Railway Dashboard**: https://railway.app/dashboard
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Verificador DNS**: https://dnschecker.org
- **Documentación Railway Domains**: https://docs.railway.app/deploy/custom-domains

---

## ⏱️ Tiempo Estimado

- Configuración en Railway: **2 minutos**
- Configuración en Cloudflare: **2 minutos**
- Propagación DNS: **5-15 minutos** (puede tardar hasta 24 horas)
- **Total**: ~20 minutos

---

## 🆘 Si Necesitas Ayuda

Comparte:
1. **Estado del dominio en Railway** (¿Active, Pending, Error?)
2. **Registro DNS en Cloudflare** (¿Cómo lo configuraste?)
3. **Resultado de verificar** `https://api.guiaa.vet/docs`

Con esa información podré ayudarte a resolver cualquier problema.

