# 🌐 Asignar Dominio www.guiaa.vet en Vercel - Paso a Paso

## 🎯 Objetivo

Asignar el dominio `www.guiaa.vet` a tu proyecto en Vercel para reemplazar el dominio de preview.

---

## 📋 Paso 1: Ir a Settings del Proyecto en Vercel

1. Ve a **Vercel Dashboard**: https://vercel.com/dashboard
2. Selecciona tu proyecto **guiia-consultions** (o el nombre que tenga)
3. En el menú lateral izquierdo, haz clic en **"Settings"**
4. En el submenú de Settings, haz clic en **"Domains"**

---

## 📋 Paso 2: Agregar Dominio www.guiaa.vet

1. En la página **"Domains"**, verás una sección que dice algo como:
   - **"Custom Domains"** o **"Domains"**
   - O un botón **"Add Domain"** o **"Add"**

2. Haz clic en **"Add Domain"** o **"Add"**

3. Se abrirá un campo de texto o un modal

4. Escribe exactamente: `www.guiaa.vet`

5. Haz clic en **"Add"** o **"Continue"**

---

## 📋 Paso 3: Obtener Configuración DNS

Después de agregar el dominio, Vercel te mostrará:

### Opción A: Si te muestra un registro CNAME (más común)

Verás algo como:

```
Type: CNAME
Name: www
Target: cname.vercel-dns.com
```

**⚠️ IMPORTANTE**: Copia exactamente el **Target** que Vercel te muestre.

### Opción B: Si te muestra un registro A

Verás algo como:

```
Type: A
Name: www
Value: 76.76.21.21
```

**⚠️ IMPORTANTE**: Copia exactamente el **Value** (IP) que Vercel te muestre.

---

## 📋 Paso 4: Configurar DNS en Cloudflare

### 4.1. Ir a Cloudflare

1. Ve a **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Selecciona el dominio **guiaa.vet**
3. En el menú lateral, haz clic en **"DNS"** → **"Records"**

### 4.2. Buscar o Crear Registro para www

1. Busca si ya existe un registro CNAME para `www`
2. Si existe:
   - Haz clic en el ícono de **editar** (lápiz) ✏️
3. Si no existe:
   - Haz clic en **"Add record"**

### 4.3. Configurar el Registro

**Si Vercel te dio un CNAME:**

1. Configura:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Target**: Pega el Target que Vercel te dio (ej: `cname.vercel-dns.com`)
   - **Proxy status**: **"Proxied"** (naranja) ⚠️ IMPORTANTE: Debe estar en Proxied
   - **TTL**: `Auto`
2. Haz clic en **"Save"**

**Si Vercel te dio un registro A:**

1. Configura:
   - **Type**: `A`
   - **Name**: `www`
   - **IPv4 address**: Pega la IP que Vercel te dio
   - **Proxy status**: **"Proxied"** (naranja)
   - **TTL**: `Auto`
2. Haz clic en **"Save"**

---

## ✅ Paso 5: Verificar en Vercel

1. Vuelve a Vercel → **Settings** → **Domains**
2. Busca `www.guiaa.vet` en la lista
3. Verás uno de estos estados:
   - **"Valid"** ✅ → ¡Listo! El dominio está configurado
   - **"Pending"** ⏳ → Espera 5-15 minutos
   - **"Invalid"** ❌ → Revisa el DNS en Cloudflare

---

## ✅ Paso 6: Probar el Dominio

Después de 5-15 minutos:

1. Visita `https://www.guiaa.vet` en tu navegador
2. Deberías ver tu aplicación funcionando
3. El título de la pestaña debería ser: **"GUIAA - Diagnósticos Profesionales para Veterinarios"**

---

## 🐛 Solución de Problemas

### Problema 1: Vercel muestra "Invalid"

**Causas comunes**:
- El Target en Cloudflare no coincide con el de Vercel
- El registro no está guardado en Cloudflare
- El Proxy status no está en "Proxied"

**Solución**:
1. Verifica que el Target en Cloudflare sea **exactamente** el mismo que Vercel te dio
2. Verifica que el registro esté guardado (debe aparecer en la lista)
3. Asegúrate de que el Proxy status esté en **"Proxied"** (naranja)

---

### Problema 2: El dominio no carga después de 15 minutos

**Solución**:
1. Verifica el DNS con una herramienta:
   - https://dnschecker.org
   - Busca `www.guiaa.vet` tipo `CNAME`
   - Debe mostrar el Target de Vercel
2. Espera más tiempo (hasta 24 horas en casos raros)
3. Verifica que el dominio esté como "Valid" en Vercel

---

## 📋 Checklist

- [ ] Dominio `www.guiaa.vet` agregado en Vercel → Settings → Domains
- [ ] Target de Vercel copiado (CNAME o A)
- [ ] Registro DNS configurado en Cloudflare para `www`
- [ ] Target del DNS coincide exactamente con el de Vercel
- [ ] Proxy status en **"Proxied"** (naranja) en Cloudflare
- [ ] Registro guardado en Cloudflare
- [ ] Esperado 5-15 minutos para propagación
- [ ] Vercel muestra dominio como "Valid"
- [ ] `https://www.guiaa.vet` carga correctamente

---

## 🔗 Enlaces Directos

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Domains (directo)**: https://vercel.com/dashboard → Tu proyecto → Settings → Domains
- **Cloudflare DNS**: https://dash.cloudflare.com → guiaa.vet → DNS → Records
- **Verificador DNS**: https://dnschecker.org

---

## ⏱️ Tiempo Estimado

- Agregar dominio en Vercel: **2 minutos**
- Configurar DNS en Cloudflare: **2 minutos**
- Propagación DNS: **5-15 minutos**
- **Total**: ~20 minutos

---

## 🆘 Si Necesitas Ayuda

Comparte:
1. **¿Qué Target te mostró Vercel?** (CNAME o A)
2. **¿Ya configuraste el registro en Cloudflare?**
3. **¿Qué estado muestra Vercel?** (Valid, Pending, Invalid)

Con esa información podré ayudarte a completar la configuración.

