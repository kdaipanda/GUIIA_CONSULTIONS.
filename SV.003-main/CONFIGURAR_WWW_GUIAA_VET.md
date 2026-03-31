# 🌐 Configurar www.guiaa.vet en Vercel

## 🎯 Objetivo

Configurar el dominio `www.guiaa.vet` para que apunte al frontend desplegado en Vercel, reemplazando el dominio de preview de Vercel.

---

## 📋 Paso 1: Configurar Dominio en Vercel

### 1.1. Ir a Settings del Proyecto

1. Ve a **Vercel Dashboard**: https://vercel.com/dashboard
2. Selecciona tu proyecto **guiia-consultions**
3. Ve a **Settings** → **Domains**

### 1.2. Agregar Dominio www.guiaa.vet

1. En la sección **"Domains"**, haz clic en **"Add"** o **"Add Domain"**
2. Escribe: `www.guiaa.vet`
3. Haz clic en **"Add"**

### 1.3. Obtener Registro DNS

Vercel te mostrará el registro DNS que necesitas configurar. Normalmente será:

**Tipo**: `CNAME`
**Name**: `www`
**Target**: `cname.vercel-dns.com` (o similar)

**⚠️ IMPORTANTE**: Copia exactamente el Target que Vercel te muestre.

---

## 📋 Paso 2: Configurar DNS en Cloudflare

### 2.1. Ir a Cloudflare

1. Ve a **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Selecciona el dominio **guiaa.vet**
3. Ve a **DNS** → **Records**

### 2.2. Verificar/Modificar Registro www Existente

Ya deberías tener un registro CNAME para `www`. Verifica que:

1. Busca el registro CNAME para `www`
2. Si existe, edítalo:
   - **Name**: `www`
   - **Target**: Pega el Target que Vercel te dio (ej: `cname.vercel-dns.com`)
   - **Proxy status**: `Proxied` (naranja) - recomendado para frontend
   - **TTL**: `Auto`
3. Si no existe, créalo:
   - Haz clic en **"Add record"**
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Target**: Pega el Target que Vercel te dio
   - **Proxy status**: `Proxied` (naranja)
   - **TTL**: `Auto`
   - Guarda

---

## 📋 Paso 3: Configurar Dominio Raíz (guiaa.vet) - Opcional pero Recomendado

Si también quieres que `guiaa.vet` (sin www) funcione:

### 3.1. En Vercel

1. Agrega otro dominio: `guiaa.vet` (sin www)
2. Vercel te dará otro registro DNS

### 3.2. En Cloudflare

1. Busca el registro para el dominio raíz (`@` o `guiaa.vet`)
2. Si es un registro A, cámbialo a CNAME:
   - **Type**: `CNAME`
   - **Name**: `@` (o deja vacío)
   - **Target**: El Target que Vercel te dio para `guiaa.vet`
   - **Proxy status**: `Proxied` (naranja)
3. Guarda

---

## ✅ Paso 4: Verificar en Vercel

### 4.1. Esperar Propagación DNS

1. Espera **5-15 minutos** para que los cambios DNS se propaguen
2. En Vercel → **Settings** → **Domains**
3. Verifica que `www.guiaa.vet` aparezca como **"Valid"** o **"Active"**
4. Si aparece como **"Pending"**, espera más tiempo

---

## ✅ Paso 5: Verificar Funcionamiento

### 5.1. Probar Dominios

Después de 5-15 minutos:

1. **Frontend www**: Visita `https://www.guiaa.vet`
   - Deberías ver tu aplicación
   
2. **Frontend raíz**: Visita `https://guiaa.vet` (si lo configuraste)
   - Debería redirigir o mostrar la misma aplicación

3. **Verificar título**: El título de la pestaña debería ser "GUIAA - Diagnósticos Profesionales para Veterinarios"

---

## 📋 Resumen de Configuración DNS

Después de configurar, deberías tener en Cloudflare:

| Type | Name | Target | Proxy | Para |
|------|------|--------|-------|------|
| `CNAME` | `@` | `cname.vercel-dns.com` | Proxied | Frontend (guiaa.vet) |
| `CNAME` | `www` | `cname.vercel-dns.com` | Proxied | Frontend (www.guiaa.vet) |
| `CNAME` | `api` | `guiiaconsultions-production.up.railway.app` | DNS only | Backend (api.guiaa.vet) |

**Nota**: El Target exacto puede variar según lo que Vercel te muestre.

---

## 🐛 Solución de Problemas

### Problema 1: Vercel No Verifica el Dominio

**Solución**:
1. Verifica que el registro DNS esté correcto en Cloudflare
2. Verifica que el **Target** coincida exactamente con el que Vercel te dio
3. Espera 10-15 minutos para la propagación DNS

---

### Problema 2: El Dominio No Carga

**Solución**:
1. Verifica que el registro esté guardado en Cloudflare
2. Usa una herramienta de verificación DNS:
   - https://dnschecker.org
   - Busca `www.guiaa.vet` tipo `CNAME`
   - Debe mostrar el Target de Vercel
3. Espera más tiempo para la propagación

---

## 📋 Checklist

- [ ] Dominio `www.guiaa.vet` agregado en Vercel
- [ ] Target de Vercel copiado para www
- [ ] Registro CNAME para `www` configurado en Cloudflare
- [ ] Target del CNAME coincide con el de Vercel
- [ ] Proxy status en `Proxied` (naranja) para frontend
- [ ] Dominio raíz `guiaa.vet` configurado (opcional)
- [ ] Esperado 5-15 minutos para propagación
- [ ] Vercel muestra dominio como "Valid"
- [ ] `https://www.guiaa.vet` carga correctamente
- [ ] Título de la pestaña muestra "GUIAA - Diagnósticos Profesionales para Veterinarios"

---

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Verificador DNS**: https://dnschecker.org

---

## ⏱️ Tiempo Estimado

- Configuración en Vercel: **2 minutos**
- Configuración en Cloudflare: **2 minutos**
- Propagación DNS: **5-15 minutos**
- **Total**: ~20 minutos

---

## 🆘 Si Necesitas Ayuda

Comparte:
1. **¿Qué Target te mostró Vercel para www.guiaa.vet?**
2. **¿Ya configuraste el registro CNAME en Cloudflare?**
3. **¿El dominio aparece como "Valid" en Vercel?**

Con esa información podré ayudarte a completar la configuración.








