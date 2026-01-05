# 🌐 Configurar guiaa.vet en Vercel - Paso a Paso

## ✅ Estado Actual

- ✅ Backend online en Railway
- ✅ Frontend desplegado en Vercel (URL temporal funcionando)
- ✅ Build exitoso

---

## 🎯 Próximo Paso: Configurar Dominio Personalizado

Ahora vamos a conectar tu dominio `guiaa.vet` con Vercel.

---

## 📋 Paso 1: Agregar Dominio en Vercel

1. Ve a **Vercel Dashboard**: https://vercel.com
2. Selecciona tu proyecto (el frontend que acabas de desplegar)
3. Ve a la pestaña **"Settings"** (⚙️)
4. En el menú lateral, busca y haz clic en **"Domains"**
5. En el campo de texto, agrega: **`guiaa.vet`**
6. Haz clic en **"Add"** o **"Add Domain"**
7. También agrega: **`www.guiaa.vet`**
8. Haz clic en **"Add"** otra vez

---

## 📋 Paso 2: Obtener Instrucciones DNS de Vercel

Después de agregar los dominios, Vercel te mostrará las instrucciones de DNS.

Verás algo como:

### Para guiaa.vet (dominio principal):
- **Tipo**: `A Record` o `A`
- **Nombre/Host**: `@` o dejar en blanco
- **Valor/Points to**: `76.76.21.21` (IP de Vercel)
- **TTL**: `3600` o por defecto

### Para www.guiaa.vet:
- **Tipo**: `CNAME`
- **Nombre/Host**: `www`
- **Valor/Points to**: `cname.vercel-dns.com` (o lo que Vercel te indique)
- **TTL**: `3600` o por defecto

**⚠️ IMPORTANTE**: Anota estos valores, los necesitarás para Squarespace.

---

## 📋 Paso 3: Configurar DNS en Squarespace

### 3.1 Acceder a DNS en Squarespace

1. Ve a **Squarespace**: https://www.squarespace.com/account/settings
2. Inicia sesión si es necesario
3. Haz clic en **"Domains"**
4. Busca y selecciona: **`guiaa.vet`**

### 3.2 Verificar Estado del Dominio

**IMPORTANTE**: Si `guiaa.vet` está conectado a un sitio de Squarespace:

1. Ve al sitio de Squarespace
2. **Settings** → **Domains**
3. **Desconecta** el dominio del sitio
4. Luego continúa con la configuración DNS

Si NO está conectado a un sitio, continúa directamente.

### 3.3 Configurar DNS Settings

1. En la página del dominio `guiaa.vet`, busca **"DNS Settings"** o **"Advanced DNS"**
2. Haz clic para abrir la configuración DNS

### 3.4 Agregar Registro A para guiaa.vet

1. Busca el botón **"Add Record"** o **"+"**
2. Configura:
   - **Tipo**: `A Record` o `A`
   - **Host/Name**: `@` (o déjalo en blanco si no acepta @)
   - **Points to/Value**: `76.76.21.21` (la IP que Vercel te dio)
   - **TTL**: `3600` o por defecto
3. Guarda el registro

### 3.5 Agregar CNAME para www.guiaa.vet

1. Haz clic en **"Add Record"** otra vez
2. Configura:
   - **Tipo**: `CNAME`
   - **Host/Name**: `www`
   - **Points to/Value**: `cname.vercel-dns.com` (el valor que Vercel te dio)
   - **TTL**: `3600` o por defecto
3. Guarda el registro

---

## ⚠️ Si No Puedes Editar DNS en Squarespace

Si Squarespace no te permite editar DNS (porque el dominio está conectado a un sitio):

### Opción A: Desconectar del Sitio (Recomendado)

1. Ve a tu sitio de Squarespace
2. **Settings** → **Domains**
3. Haz clic en `guiaa.vet`
4. Selecciona **"Remove"** o **"Disconnect"**
5. Confirma
6. Vuelve a DNS Settings y ahora deberías poder editarlo

### Opción B: Usar Cloudflare DNS (Más Poderoso)

Si Squarespace limita las opciones DNS:

1. Crea cuenta gratuita en **Cloudflare**: https://cloudflare.com
2. Agrega el dominio `guiaa.vet`
3. Cloudflare te dará 2 nameservers (ejemplo: `ns1.cloudflare.com`)
4. En Squarespace: Cambia los nameservers a los de Cloudflare
5. Configura DNS en Cloudflare (más fácil y potente)

---

## ✅ Paso 4: Verificar en Vercel

1. Vuelve a Vercel Dashboard → Tu proyecto → Settings → Domains
2. Verás el estado de los dominios:
   - **Valid Configuration** = ✅ Configuración válida
   - **Validating** = ⏳ Esperando verificación (puede tardar 5-30 minutos)
   - **Error** = ❌ Revisa los valores DNS

3. **Espera 5-30 minutos** para que:
   - Los DNS se propaguen
   - Vercel verifique el dominio
   - SSL se genere automáticamente

---

## 🔍 Paso 5: Verificar que Funciona

Después de esperar 5-30 minutos:

1. Abre tu navegador
2. Ve a: **https://guiaa.vet**
3. Deberías ver tu aplicación funcionando
4. También prueba: **https://www.guiaa.vet**

### Verificar DNS (Opcional)

En PowerShell (Windows):

```powershell
nslookup guiaa.vet
nslookup www.guiaa.vet
```

Deberías ver que apuntan a Vercel.

---

## 🎯 Próximo Paso (Después de guiaa.vet)

Una vez que `guiaa.vet` funcione, el siguiente paso es:

**Configurar `api.guiaa.vet` en Railway para el backend**

---

## 📋 Resumen de Registros DNS

Al final, deberías tener estos registros en Squarespace:

```
Tipo    | Host | Points to                    | Para
--------|------|------------------------------|------------------
A       | @    | 76.76.21.21                  | guiaa.vet
CNAME   | www  | cname.vercel-dns.com         | www.guiaa.vet
```

(Los valores exactos los obtienes de Vercel)

---

## 🆘 Solución de Problemas

### "Domain not verified" en Vercel
- Espera más tiempo (hasta 30 minutos)
- Verifica que los registros DNS estén correctos
- Revisa que no haya errores de escritura

### No puedes editar DNS en Squarespace
- Asegúrate de que el dominio NO esté conectado a un sitio
- Considera usar Cloudflare DNS (más fácil)

### DNS no se propaga
- Puede tardar hasta 48 horas (normalmente 5-30 minutos)
- Verifica los valores con `nslookup`

---

**¿Listo para configurar el dominio?** Sigue los pasos y si encuentras algún problema, avísame.

