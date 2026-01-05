# 🌐 Configurar Dominio guiaa.vet en Vercel

## Objetivo

Configurar el dominio `guiaa.vet` para que apunte al frontend desplegado en Vercel.

---

## 📋 Paso 1: Configurar Dominio en Vercel

### 1.1. Ir a Settings del Proyecto

1. En Vercel, ve a tu proyecto **guiia-consultions**
2. Haz clic en **Settings** (en el menú lateral izquierdo)
3. Ve a **Domains** (o busca "Domains" en el menú)

### 1.2. Agregar Dominio Personalizado

1. En la sección **"Domains"**, verás una lista de dominios
2. Haz clic en **"Add"** o **"Add Domain"**
3. Escribe: `guiaa.vet`
4. Haz clic en **"Add"** o **"Save"**

### 1.3. Obtener Registro DNS

Vercel te mostrará los registros DNS que necesitas configurar. Normalmente será:

**Opción A: Registro A (si Vercel usa IPs)**
- **Type**: `A`
- **Name**: `@` (o dejar vacío, o `guiaa.vet`)
- **Value**: Una IP que Vercel te dará (ej: `76.76.21.21`)

**Opción B: Registro CNAME (más común)**
- **Type**: `CNAME`
- **Name**: `@` (o `guiaa.vet`)
- **Target**: Algo como `cname.vercel-dns.com` o similar

**⚠️ IMPORTANTE**: Copia exactamente lo que Vercel te muestre.

---

## 📋 Paso 2: Configurar DNS en Cloudflare

### 2.1. Ir a Cloudflare

1. Ve a **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Selecciona el dominio **guiaa.vet**

### 2.2. Ir a DNS

1. En el menú lateral, haz clic en **"DNS"** → **"Records"**

### 2.3. Configurar Registro

**Si Vercel te dio un registro A:**

1. Haz clic en **"Add record"**
2. Configura:
   - **Type**: `A`
   - **Name**: `@` (o deja vacío para el dominio raíz)
   - **IPv4 address**: Pega la IP que Vercel te dio
   - **Proxy status**: **"Proxied"** (naranja) - recomendado para frontend
   - **TTL**: `Auto`
3. Guarda

**Si Vercel te dio un registro CNAME:**

1. Haz clic en **"Add record"**
2. Configura:
   - **Type**: `CNAME`
   - **Name**: `@` (o deja vacío para el dominio raíz)
   - **Target**: Pega el valor que Vercel te dio
   - **Proxy status**: **"Proxied"** (naranja) - recomendado para frontend
   - **TTL**: `Auto`
3. Guarda

**⚠️ NOTA**: En Cloudflare, si usas `@` para el dominio raíz, a veces necesitas usar el nombre completo `guiaa.vet` o dejar el campo Name vacío. Prueba ambas opciones si una no funciona.

---

## 📋 Paso 3: Verificar en Vercel

### 3.1. Esperar Propagación DNS

1. Los cambios DNS pueden tardar **5-15 minutos** en propagarse
2. Vercel verificará automáticamente cuando el dominio esté configurado

### 3.2. Verificar Estado

1. En Vercel → **Settings** → **Domains**
2. Verifica que `guiaa.vet` aparezca como **"Valid"** o **"Active"**
3. Si aparece como **"Pending"** o **"Invalid"**, espera unos minutos más

---

## 📋 Paso 4: Configurar Subdominio www (Opcional)

Si también quieres que `www.guiaa.vet` funcione:

### 4.1. En Vercel

1. Agrega otro dominio: `www.guiaa.vet`
2. Vercel te dará otro registro DNS

### 4.2. En Cloudflare

1. Agrega un registro **CNAME**:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Target**: El valor que Vercel te dio para www
   - **Proxy status**: **"Proxied"** (naranja)
2. Guarda

---

## ✅ Verificación

### 1. Verificar que el Dominio Funcione

Después de 5-15 minutos:

1. Visita `https://guiaa.vet` en tu navegador
2. Deberías ver tu aplicación funcionando
3. Si aún no carga, espera más tiempo (hasta 24 horas en casos raros)

### 2. Verificar SSL

Vercel genera certificados SSL automáticamente. Después de configurar el dominio:

1. Espera 5-10 minutos
2. Visita `https://guiaa.vet`
3. Deberías ver el candado verde (SSL activo)

---

## 🐛 Solución de Problemas

### Problema 1: Vercel No Verifica el Dominio

**Síntoma**: El dominio aparece como "Pending" o "Invalid" en Vercel

**Soluciones**:
1. Verifica que el registro DNS esté correcto en Cloudflare
2. Verifica que el **Name** en Cloudflare sea correcto (`@` o vacío para dominio raíz)
3. Espera 10-15 minutos para la propagación DNS
4. Verifica que el **Proxy status** en Cloudflare no esté bloqueando

---

### Problema 2: Error SSL/Certificado

**Síntoma**: El navegador muestra error de certificado SSL

**Solución**:
1. Vercel genera certificados SSL automáticamente
2. Espera 5-10 minutos después de configurar el dominio
3. Si persiste, verifica que el dominio esté en estado "Valid" en Vercel

---

### Problema 3: El Dominio No Resuelve

**Síntoma**: `guiaa.vet` no carga nada

**Soluciones**:
1. Verifica el registro DNS en Cloudflare:
   - **Name**: `@` o vacío
   - **Target**: El valor que Vercel te dio
2. Usa una herramienta de verificación DNS:
   - https://dnschecker.org
   - Busca `guiaa.vet` tipo `A` o `CNAME`
   - Debe mostrar el valor de Vercel
3. Si no resuelve, espera más tiempo (hasta 24 horas en casos raros)

---

## 📋 Checklist Final

- [ ] Dominio `guiaa.vet` agregado en Vercel
- [ ] Registro DNS configurado en Cloudflare
- [ ] Vercel muestra el dominio como "Valid" o "Active"
- [ ] `https://guiaa.vet` carga correctamente
- [ ] SSL funciona (candado verde)
- [ ] La aplicación se muestra correctamente

---

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Verificador DNS**: https://dnschecker.org
- **Documentación Vercel Domains**: https://vercel.com/docs/concepts/projects/domains

---

## ⏱️ Tiempo Estimado

- Configuración en Vercel: **2 minutos**
- Configuración en Cloudflare: **2 minutos**
- Propagación DNS: **5-15 minutos** (puede tardar hasta 24 horas)
- Generación SSL: **5-10 minutos**
- **Total**: ~20 minutos

---

## 🆘 Si Necesitas Ayuda

Comparte:
1. **Estado del dominio en Vercel** (¿Valid, Pending, Invalid?)
2. **Registro DNS en Cloudflare** (¿Cómo lo configuraste?)
3. **Resultado de verificar** `https://guiaa.vet`

Con esa información podré ayudarte a resolver cualquier problema.

