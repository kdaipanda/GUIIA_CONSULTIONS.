# 🌐 Configurar DNS Completo para guiaa.vet

## 📋 Situación Actual

Veo que tienes:
- ✅ Un registro **A** para `guiaa.vet` → `76.76.21.21` (Proxied)
- ✅ Un registro **CNAME** para `www` → `cname.vercel-dns.com` (DNS only)
- ⚠️ El dominio está "pending" (necesita verificación)

---

## 🎯 Objetivo

Configurar los DNS para que:
- `guiaa.vet` → Apunte al frontend en Vercel
- `www.guiaa.vet` → Apunte al frontend en Vercel
- `api.guiaa.vet` → Apunte al backend en Railway

---

## ✅ Paso 1: Verificar Dominio en Vercel

### 1.1. Agregar Dominio en Vercel

1. Ve a **Vercel Dashboard** → Tu proyecto → **Settings** → **Domains**
2. Haz clic en **"Add Domain"**
3. Escribe: `guiaa.vet`
4. Haz clic en **"Add"**
5. Vercel te mostrará el registro DNS que necesitas

**Normalmente será:**
- **Type**: `CNAME`
- **Name**: `@` (o `guiaa.vet`)
- **Target**: `cname.vercel-dns.com` (o similar)

**Copia el Target exacto que Vercel te muestre.**

---

## ✅ Paso 2: Configurar DNS en Cloudflare

### 2.1. Modificar el Registro A Actual

El registro A actual (`76.76.21.21`) probablemente apunta a Squarespace u otro servicio. Necesitas cambiarlo:

1. En Cloudflare → **DNS** → **Records**
2. Busca el registro **A** para `guiaa.vet` → `76.76.21.21`
3. Haz clic en **"Edit"** (el icono de lápiz)
4. Tienes dos opciones:

**Opción A: Cambiar a CNAME (Recomendado)**
- Cambia **Type** de `A` a `CNAME`
- **Name**: `@` (o deja `guiaa.vet`)
- **Target**: Pega el Target que Vercel te dio (ej: `cname.vercel-dns.com`)
- **Proxy status**: `Proxied` (naranja) - recomendado para frontend
- **TTL**: `Auto`
- Haz clic en **"Save"**

**Opción B: Mantener A pero cambiar IP**
- Si Vercel te dio una IP (menos común), cambia el **Content** a esa IP
- **Name**: `@`
- **Content**: La IP que Vercel te dio
- **Proxy status**: `Proxied` (naranja)
- **TTL**: `Auto`
- Haz clic en **"Save"`

---

### 2.2. Verificar Registro www

Ya tienes un registro CNAME para `www` → `cname.vercel-dns.com`. Verifica que:

1. **Name**: `www` (correcto ✅)
2. **Target**: `cname.vercel-dns.com` (debe coincidir con el que Vercel te dio)
3. **Proxy status**: Puede estar en `Proxied` (naranja) o `DNS only` (gris)
   - **Recomendación**: `Proxied` (naranja) para mejor rendimiento
4. Si el Target no coincide con el de Vercel, edítalo

---

### 2.3. Verificar Registro api (Backend)

Para el backend en Railway, necesitas un registro CNAME para `api`:

1. Busca si ya existe un registro para `api`
2. Si **NO existe**:
   - Haz clic en **"+ Add record"**
   - **Type**: `CNAME`
   - **Name**: `api`
   - **Target**: `guiiaconsultions-production.up.railway.app` (o el dominio que Railway te dio)
   - **Proxy status**: `DNS only` (gris) - importante para APIs
   - **TTL**: `Auto`
   - Haz clic en **"Save"**

3. Si **YA existe**:
   - Verifica que el Target apunte al dominio de Railway
   - Si no, edítalo

---

## ✅ Paso 3: Verificar Dominio en Cloudflare

### 3.1. Completar Verificación

Veo que hay un banner que dice "guiaa.vet is pending". Necesitas:

1. Ve a **Overview** en Cloudflare (menú lateral)
2. Sigue las instrucciones para verificar la propiedad del dominio
3. Esto puede requerir agregar un registro TXT o verificar el email

---

## 📋 Resumen de Configuración Final

Después de configurar, deberías tener:

| Type | Name | Target/Content | Proxy | Propósito |
|------|------|----------------|-------|-----------|
| `CNAME` | `@` | `cname.vercel-dns.com` | Proxied | Frontend (guiaa.vet) |
| `CNAME` | `www` | `cname.vercel-dns.com` | Proxied | Frontend (www.guiaa.vet) |
| `CNAME` | `api` | `guiiaconsultions-production.up.railway.app` | DNS only | Backend (api.guiaa.vet) |

---

## ✅ Paso 4: Verificar en Vercel

### 4.1. Esperar Propagación

1. Espera **5-15 minutos** para que los cambios DNS se propaguen
2. En Vercel → **Settings** → **Domains**
3. Verifica que `guiaa.vet` aparezca como **"Valid"** o **"Active"**
4. Si aparece como **"Pending"**, espera más tiempo

---

## ✅ Paso 5: Verificar Funcionamiento

### 5.1. Probar Dominios

Después de 5-15 minutos:

1. **Frontend**: Visita `https://guiaa.vet`
   - Deberías ver tu aplicación
   
2. **Frontend www**: Visita `https://www.guiaa.vet`
   - Debería redirigir o mostrar la misma aplicación

3. **Backend**: Visita `https://api.guiaa.vet/docs`
   - Deberías ver la documentación de la API

---

## 🐛 Solución de Problemas

### Problema 1: Dominio Sigue "Pending" en Vercel

**Solución**:
1. Verifica que el registro DNS esté correcto en Cloudflare
2. Verifica que el **Target** coincida exactamente con el que Vercel te dio
3. Espera más tiempo (hasta 24 horas en casos raros)
4. Verifica que el dominio esté verificado en Cloudflare (Overview)

---

### Problema 2: El Dominio No Carga

**Solución**:
1. Verifica que el registro esté guardado en Cloudflare
2. Usa una herramienta de verificación DNS:
   - https://dnschecker.org
   - Busca `guiaa.vet` tipo `CNAME`
   - Debe mostrar `cname.vercel-dns.com`
3. Espera más tiempo para la propagación

---

### Problema 3: Error SSL

**Solución**:
1. Vercel genera certificados SSL automáticamente
2. Espera 5-10 minutos después de que el dominio esté "Valid"
3. Verifica que el dominio esté en estado "Valid" en Vercel

---

## 📋 Checklist Final

- [ ] Dominio `guiaa.vet` agregado en Vercel
- [ ] Target de Vercel copiado (ej: `cname.vercel-dns.com`)
- [ ] Registro A modificado a CNAME en Cloudflare (o IP actualizada)
- [ ] Target del CNAME coincide con el de Vercel
- [ ] Proxy status en `Proxied` (naranja) para frontend
- [ ] Registro `www` verificado/corregido
- [ ] Registro `api` configurado para Railway
- [ ] Dominio verificado en Cloudflare (Overview)
- [ ] Esperado 5-15 minutos para propagación
- [ ] Vercel muestra dominio como "Valid"
- [ ] `https://guiaa.vet` carga correctamente
- [ ] `https://api.guiaa.vet` carga correctamente

---

## 🆘 Si Necesitas Ayuda

Comparte:
1. **¿Qué Target te mostró Vercel?** (en Settings → Domains → guiaa.vet)
2. **¿Ya modificaste el registro A en Cloudflare?**
3. **¿El dominio sigue "pending" en Vercel?**

Con esa información podré ayudarte a completar la configuración.

