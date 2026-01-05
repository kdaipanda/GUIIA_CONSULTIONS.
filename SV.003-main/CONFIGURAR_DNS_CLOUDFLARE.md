# 🌐 Configurar DNS en Cloudflare para guiaa.vet

## ✅ Estado Actual

- ✅ Tienes cuenta en Cloudflare
- ✅ Dominio `guiaa.vet` agregado en Cloudflare
- ✅ Nameservers cambiados en Squarespace
- ✅ Backend online en Railway
- ✅ Frontend desplegado en Vercel

---

## 📋 Paso 1: Obtener Valores DNS de Vercel

Primero necesitas los valores DNS de Vercel:

1. Ve a **Vercel Dashboard**: https://vercel.com
2. Selecciona tu proyecto (frontend)
3. **Settings** → **Domains**
4. Deberías ver `guiaa.vet` y `www.guiaa.vet` listados
5. Si NO los has agregado aún:
   - Haz clic en **"Add Domain"**
   - Agrega: `guiaa.vet`
   - Agrega también: `www.guiaa.vet`
6. Vercel te mostrará las instrucciones DNS

### Valores que Vercel te dará:

**Para guiaa.vet:**
- Tipo: **A**
- Nombre: `@` o `guiaa.vet`
- Valor: `76.76.21.21` (IP de Vercel - puede variar)

**Para www.guiaa.vet:**
- Tipo: **CNAME**
- Nombre: `www`
- Valor: `cname.vercel-dns.com` (o similar)

⚠️ **Anota estos valores**, los necesitarás para Cloudflare.

---

## 📋 Paso 2: Configurar DNS en Cloudflare

### 2.1 Acceder a DNS en Cloudflare

1. Ve a **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Selecciona el dominio `guiaa.vet`
3. En el menú lateral, haz clic en **"DNS"** o **"DNS Records"**

### 2.2 Limpiar Registros Existentes (Opcional)

Cloudflare puede tener algunos registros por defecto. Puedes:
- Dejarlos si no interfieren
- O eliminarlos si prefieres empezar limpio

**Registros que puedes mantener:**
- `@` tipo A (si apunta a algo que usas)
- MX records (si usas email)

**Registros que puedes eliminar:**
- Cualquier registro que apunte a Squarespace
- El registro `_domainconnect` si existe

### 2.3 Agregar Registro A para guiaa.vet

1. Haz clic en **"Add record"** o **"A"**
2. Configura:
   - **Type**: `A`
   - **Name**: `@` (o `guiaa.vet`)
   - **IPv4 address**: `76.76.21.21` (la IP que Vercel te dio)
   - **Proxy status**: ⚠️ **Desactivado** (nube gris, no naranja)
     - Esto es importante para Vercel
   - **TTL**: `Auto` o `3600`
3. Haz clic en **"Save"**

### 2.4 Agregar CNAME para www.guiaa.vet

1. Haz clic en **"Add record"** otra vez
2. Selecciona **Type**: `CNAME`
3. Configura:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Target**: `cname.vercel-dns.com` (el valor que Vercel te dio)
   - **Proxy status**: ⚠️ **Desactivado** (nube gris)
   - **TTL**: `Auto` o `3600`
4. Haz clic en **"Save"**

---

## 📋 Paso 3: Configurar api.guiaa.vet para Railway

### 3.1 Obtener CNAME de Railway

1. Ve a **Railway Dashboard**: https://railway.app
2. Selecciona tu servicio (backend)
3. **Settings** → **Networking** o **Domains**
4. Haz clic en **"Add Custom Domain"** o **"Generate Domain"**
5. Ingresa: `api.guiaa.vet`
6. Railway te dará un **CNAME target** (ejemplo: `xxxxx.railway.app`)
7. ⚠️ **Anota este valor**

### 3.2 Agregar CNAME en Cloudflare

1. En Cloudflare → DNS Records
2. Haz clic en **"Add record"**
3. Selecciona **Type**: `CNAME`
4. Configura:
   - **Type**: `CNAME`
   - **Name**: `api`
   - **Target**: `xxxxx.railway.app` (el CNAME que Railway te dio)
   - **Proxy status**: ⚠️ **Desactivado** (nube gris)
   - **TTL**: `Auto` o `3600`
5. Haz clic en **"Save"**

---

## 📋 Paso 4: Resumen de Registros DNS

Al final, deberías tener estos registros en Cloudflare:

```
Type  | Name | Content/Target              | Proxy | Para
------|------|-----------------------------|-------|------------------
A     | @    | 76.76.21.21                 | OFF   | guiaa.vet
CNAME | www  | cname.vercel-dns.com        | OFF   | www.guiaa.vet
CNAME | api  | xxxxx.railway.app           | OFF   | api.guiaa.vet
```

**⚠️ IMPORTANTE**: Todos deben tener Proxy **DESACTIVADO** (nube gris, no naranja).

---

## ⚠️ Importante: Proxy Status (CDN de Cloudflare)

En Cloudflare, cada registro DNS tiene un botón de **"Proxy"** (nube):

- 🔵 **Nube Naranja (Proxy ON)**: Activa CDN de Cloudflare (puede causar problemas con Vercel/Railway)
- ⚪ **Nube Gris (Proxy OFF)**: DNS directo (necesario para Vercel y Railway)

**Para Vercel y Railway, SIEMPRE usa Proxy OFF** (nube gris).

---

## ✅ Paso 5: Verificar en Vercel

1. Vuelve a **Vercel Dashboard** → Tu proyecto → Settings → Domains
2. Verás el estado de `guiaa.vet` y `www.guiaa.vet`:
   - **Valid Configuration** = ✅ DNS correcto
   - **Validating** = ⏳ Esperando verificación (5-30 minutos)
   - **Error** = ❌ Revisa los valores

3. Espera **5-30 minutos** para:
   - Propagación DNS
   - Verificación de Vercel
   - Generación automática de SSL

---

## ✅ Paso 6: Verificar en Railway

1. En **Railway** → Tu servicio → Settings → Domains
2. Verifica que `api.guiaa.vet` aparezca como configurado
3. Railway verificará automáticamente el DNS

---

## 🔍 Paso 7: Verificar que Funciona

Después de 5-30 minutos:

1. Abre tu navegador
2. Prueba:
   - `https://guiaa.vet` → Debería mostrar tu frontend
   - `https://www.guiaa.vet` → Debería mostrar tu frontend
   - `https://api.guiaa.vet/docs` → Debería mostrar la documentación del backend

### Verificar DNS (Opcional)

En PowerShell:

```powershell
nslookup guiaa.vet
nslookup www.guiaa.vet
nslookup api.guiaa.vet
```

---

## 🔧 Paso 8: Actualizar Variables de Entorno

### En Vercel:

Una vez que `api.guiaa.vet` funcione, actualiza la variable:

1. Vercel → Tu proyecto → Settings → Environment Variables
2. Actualiza `REACT_APP_BACKEND_URL`:
   ```
   REACT_APP_BACKEND_URL = https://api.guiaa.vet
   ```
3. Haz un nuevo deploy (Vercel lo hace automáticamente o haz clic en Redeploy)

### En Railway:

Agrega o actualiza CORS:

1. Railway → Tu servicio → Variables
2. Agrega/Actualiza:
   ```
   CORS_ALLOW_ORIGINS = https://guiaa.vet,https://www.guiaa.vet
   ```
3. Railway hará redeploy automático

---

## 🆘 Solución de Problemas

### "Domain not verified" en Vercel
- Espera más tiempo (hasta 30 minutos)
- Verifica que Proxy esté OFF en Cloudflare
- Verifica que los valores DNS sean correctos

### Proxy está ON (nube naranja)
- Haz clic en la nube naranja para desactivarla
- Cambiará a nube gris (Proxy OFF)
- Espera unos minutos a que se propague

### DNS no se propaga
- Puede tardar hasta 48 horas (normalmente 5-30 minutos)
- Verifica los valores con `nslookup`
- Asegúrate de que Proxy esté OFF

---

## ✅ Checklist Final

- [ ] Registro A agregado para `guiaa.vet` (Proxy OFF)
- [ ] CNAME agregado para `www` (Proxy OFF)
- [ ] CNAME agregado para `api` (Proxy OFF)
- [ ] Dominio verificado en Vercel (esperar 5-30 min)
- [ ] Dominio verificado en Railway
- [ ] Variables de entorno actualizadas
- [ ] URLs funcionando correctamente

---

**¿Listo para configurar?** Empieza agregando los dominios en Vercel (si aún no lo has hecho) para obtener los valores DNS, y luego configúralos en Cloudflare.

