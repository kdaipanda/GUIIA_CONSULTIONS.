# 🔍 Verificar Configuración DNS en Cloudflare - Guía Paso a Paso

## 📋 Registros DNS que DEBES tener en Cloudflare

Para que tu aplicación funcione correctamente, necesitas estos 3 registros:

| Tipo | Name | Target/Content | Proxy | Para |
|------|------|----------------|-------|------|
| `CNAME` o `A` | `@` | Valor de Vercel | Proxied (naranja) | `guiaa.vet` |
| `CNAME` | `www` | Valor de Vercel | Proxied (naranja) | `www.guiaa.vet` |
| `CNAME` | `api` | Dominio de Railway | DNS only (gris) | `api.guiaa.vet` |

---

## ✅ Paso 1: Acceder a Cloudflare DNS

1. Ve a **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Inicia sesión con tu cuenta
3. Selecciona el dominio **`guiaa.vet`**
4. En el menú lateral izquierdo, haz clic en **"DNS"** o **"DNS Records"**

---

## ✅ Paso 2: Verificar Registro para `guiaa.vet` (dominio principal)

### Lo que debes buscar:

1. Busca un registro con **Name** = `@` o `guiaa.vet`
2. Verifica el **Type**: Puede ser `A` o `CNAME`
3. Verifica el **Target/Content**: Debe apuntar a Vercel

### Valores correctos:

**Si es tipo CNAME:**
- **Name**: `@` o `guiaa.vet`
- **Type**: `CNAME`
- **Target**: `cname.vercel-dns.com` (o el valor que Vercel te dio)
- **Proxy**: 🔵 **Proxied** (nube naranja) ✅

**Si es tipo A:**
- **Name**: `@` o `guiaa.vet`
- **Type**: `A`
- **Content**: `76.76.21.21` (o la IP que Vercel te dio)
- **Proxy**: 🔵 **Proxied** (nube naranja) ✅

### ⚠️ Si NO existe o está mal:

1. Haz clic en **"Add record"**
2. Si Vercel te dio un **CNAME**:
   - **Type**: `CNAME`
   - **Name**: `@`
   - **Target**: Pega el valor de Vercel (ej: `cname.vercel-dns.com`)
   - **Proxy**: Activa (nube naranja)
   - **TTL**: `Auto`
3. Si Vercel te dio una **IP**:
   - **Type**: `A`
   - **Name**: `@`
   - **IPv4 address**: Pega la IP de Vercel
   - **Proxy**: Activa (nube naranja)
   - **TTL**: `Auto`
4. Haz clic en **"Save"**

---

## ✅ Paso 3: Verificar Registro para `www.guiaa.vet`

### Lo que debes buscar:

1. Busca un registro con **Name** = `www`
2. Verifica el **Type**: Debe ser `CNAME`
3. Verifica el **Target**: Debe ser el mismo que el de Vercel

### Valores correctos:

- **Name**: `www`
- **Type**: `CNAME`
- **Target**: `cname.vercel-dns.com` (o el valor que Vercel te dio)
- **Proxy**: 🔵 **Proxied** (nube naranja) ✅
- **TTL**: `Auto`

### ⚠️ Si NO existe o está mal:

1. Haz clic en **"Add record"**
2. **Type**: `CNAME`
3. **Name**: `www`
4. **Target**: Pega el valor de Vercel (debe ser el mismo que para `@`)
5. **Proxy**: Activa (nube naranja)
6. **TTL**: `Auto`
7. Haz clic en **"Save"**

---

## ✅ Paso 4: Verificar Registro para `api.guiaa.vet` (Backend)

### Lo que debes buscar:

1. Busca un registro con **Name** = `api`
2. Verifica el **Type**: Debe ser `CNAME`
3. Verifica el **Target**: Debe apuntar a Railway

### Valores correctos:

- **Name**: `api`
- **Type**: `CNAME`
- **Target**: `xxxxx.railway.app` (el dominio que Railway te dio)
- **Proxy**: ⚪ **DNS only** (nube gris) ✅ **IMPORTANTE**
- **TTL**: `Auto`

### ⚠️ Si NO existe:

1. Primero obtén el dominio de Railway:
   - Ve a **Railway Dashboard**: https://railway.app
   - Selecciona tu servicio (backend)
   - **Settings** → **Networking** o **Domains**
   - Busca `api.guiaa.vet` o agrégalo
   - Railway te dará un dominio tipo `xxxxx.railway.app`
   - **Copia ese dominio**

2. En Cloudflare:
   - Haz clic en **"Add record"**
   - **Type**: `CNAME`
   - **Name**: `api`
   - **Target**: Pega el dominio de Railway
   - **Proxy**: ⚪ **DNS only** (nube gris) - **MUY IMPORTANTE**
   - **TTL**: `Auto`
   - Haz clic en **"Save"**

### ⚠️ Si existe pero Proxy está ON (naranja):

1. Haz clic en el registro `api`
2. Haz clic en **"Edit"**
3. Haz clic en la **nube naranja** para desactivarla (debe quedar gris)
4. Haz clic en **"Save"**

---

## ✅ Paso 5: Limpiar Registros Innecesarios

### Registros que puedes ELIMINAR:

- ❌ Cualquier registro que apunte a Squarespace
- ❌ Registros duplicados (si tienes varios para el mismo nombre)
- ❌ Registros de prueba o temporales

### Registros que DEBES MANTENER:

- ✅ Los 3 registros principales (`@`, `www`, `api`)
- ✅ Registros MX (si usas email)
- ✅ Cualquier otro registro que uses activamente

---

## ✅ Paso 6: Obtener Valores de Vercel (si no los tienes)

Si no sabes qué valores usar para Vercel:

1. Ve a **Vercel Dashboard**: https://vercel.com
2. Selecciona tu proyecto (frontend)
3. **Settings** → **Domains**
4. Verifica que `guiaa.vet` y `www.guiaa.vet` estén agregados
5. Si NO están agregados:
   - Haz clic en **"Add Domain"**
   - Agrega: `guiaa.vet`
   - Agrega también: `www.guiaa.vet`
6. Vercel te mostrará los valores DNS que necesitas
7. **Copia esos valores** y úsalos en Cloudflare

---

## ✅ Paso 7: Verificar en Vercel

Después de configurar los DNS en Cloudflare:

1. Ve a **Vercel Dashboard** → Tu proyecto → **Settings** → **Domains**
2. Verifica el estado de `guiaa.vet` y `www.guiaa.vet`:
   - ✅ **Valid Configuration** = DNS correcto
   - ⏳ **Validating** = Esperando verificación (5-30 minutos)
   - ❌ **Error** = Revisa los valores DNS

3. Espera **5-30 minutos** para:
   - Propagación DNS
   - Verificación de Vercel
   - Generación automática de SSL

---

## ✅ Paso 8: Verificar en Railway

1. Ve a **Railway Dashboard** → Tu servicio → **Settings** → **Networking** o **Domains**
2. Verifica que `api.guiaa.vet` aparezca como configurado
3. Railway verificará automáticamente el DNS

---

## ✅ Paso 9: Probar que Funciona

Después de 5-30 minutos, prueba en tu navegador:

1. **Frontend principal**: 
   - Visita: `https://guiaa.vet`
   - ✅ Debería mostrar tu aplicación

2. **Frontend www**: 
   - Visita: `https://www.guiaa.vet`
   - ✅ Debería mostrar tu aplicación (o redirigir a `guiaa.vet`)

3. **Backend API**: 
   - Visita: `https://api.guiaa.vet/docs`
   - ✅ Debería mostrar la documentación de la API

---

## 🔍 Verificación con Comandos (Opcional)

Puedes verificar los DNS desde PowerShell:

```powershell
# Verificar dominio principal
nslookup guiaa.vet

# Verificar www
nslookup www.guiaa.vet

# Verificar api
nslookup api.guiaa.vet
```

O usa herramientas online:
- https://dnschecker.org
- https://www.whatsmydns.net

---

## ⚠️ Puntos Críticos a Verificar

### 1. Proxy Status

- **Frontend (`@` y `www`)**: 🔵 **Proxied** (nube naranja) ✅
- **Backend (`api`)**: ⚪ **DNS only** (nube gris) ✅

### 2. Valores Correctos

- Los valores de `@` y `www` deben ser **exactamente iguales** (ambos apuntan a Vercel)
- El valor de `api` debe apuntar al dominio de Railway

### 3. Sin Duplicados

- No debe haber múltiples registros para el mismo nombre
- Si hay duplicados, elimina los incorrectos

---

## 🆘 Problemas Comunes

### Problema: "Domain not verified" en Vercel

**Solución:**
1. Verifica que los valores DNS en Cloudflare sean correctos
2. Verifica que Proxy esté ON (naranja) para `@` y `www`
3. Espera más tiempo (hasta 30 minutos)
4. Verifica que no haya errores de escritura

### Problema: El dominio no carga

**Solución:**
1. Verifica que los registros estén guardados en Cloudflare
2. Usa https://dnschecker.org para verificar propagación
3. Espera más tiempo (puede tardar hasta 48 horas, normalmente 5-30 min)
4. Verifica que Proxy esté correctamente configurado

### Problema: Error SSL

**Solución:**
1. Vercel genera SSL automáticamente
2. Espera 5-10 minutos después de que el dominio esté "Valid"
3. Verifica que el dominio esté en estado "Valid" en Vercel

### Problema: API no funciona

**Solución:**
1. Verifica que el registro `api` exista en Cloudflare
2. **MUY IMPORTANTE**: Verifica que Proxy esté OFF (gris) para `api`
3. Verifica que el Target apunte al dominio correcto de Railway
4. Verifica CORS en Railway (debe incluir `https://guiaa.vet`)

---

## ✅ Checklist Final

Antes de terminar, verifica que tengas:

- [ ] Registro para `@` o `guiaa.vet` configurado (CNAME o A)
- [ ] Target/Content apunta a Vercel
- [ ] Proxy ON (naranja) para `@` y `www`
- [ ] Registro para `www` configurado (CNAME)
- [ ] Target de `www` coincide con el de `@`
- [ ] Registro para `api` configurado (CNAME)
- [ ] Target de `api` apunta a Railway
- [ ] Proxy OFF (gris) para `api`
- [ ] Sin registros duplicados
- [ ] Dominio verificado en Vercel (estado "Valid")
- [ ] Dominio verificado en Railway
- [ ] `https://guiaa.vet` carga correctamente
- [ ] `https://www.guiaa.vet` carga correctamente
- [ ] `https://api.guiaa.vet/docs` carga correctamente

---

## 📞 ¿Necesitas Ayuda?

Si encuentras algún problema, comparte:

1. **¿Qué registros ves en Cloudflare?** (tipo, nombre, target, proxy)
2. **¿Qué estado muestra Vercel?** (Valid, Validating, Error)
3. **¿Qué error específico recibes?** (si hay alguno)

Con esa información podré ayudarte a resolver el problema específico.



