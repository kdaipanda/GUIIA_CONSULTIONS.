# 🌐 Configurar guiaa.vet con Vercel y Railway

## 📋 Tu Configuración

- **Dominio principal**: `guiaa.vet`
- **Frontend**: `guiaa.vet` + `www.guiaa.vet` → Vercel
- **Backend**: `api.guiaa.vet` → Railway
- **Registrador**: Squarespace

---

## 🚀 Paso 1: Desplegar Frontend en Vercel

### 1.1 Crear Proyecto en Vercel

1. Ve a https://vercel.com/new
2. Importa tu repositorio: `kdaipanda/GUIIA_CONSULTIONS`
3. Configura:
   - **Root Directory**: `SV.003-main/frontend`
   - **Install Command**: `npm install --legacy-peer-deps`
   - **Build Command**: `npm run build` (por defecto)
   - **Output Directory**: `build` (por defecto)

### 1.2 Variables de Entorno en Vercel

Agrega estas variables (por ahora usa la URL temporal de Railway):

```
REACT_APP_BACKEND_URL = https://tu-proyecto.railway.app
```

(Primero necesitas la URL de Railway, luego la cambiarás a `https://api.guiaa.vet`)

### 1.3 Hacer Deploy Inicial

1. Click en "Deploy"
2. Espera a que termine (2-5 minutos)
3. Verifica que funcione con la URL temporal de Vercel

---

## 🌐 Paso 2: Configurar guiaa.vet en Vercel

### 2.1 Agregar Dominio en Vercel

1. En Vercel Dashboard → Tu proyecto → **Settings** → **Domains**
2. Agrega: `guiaa.vet`
3. Agrega también: `www.guiaa.vet`
4. Vercel te mostrará las instrucciones de DNS

Vercel te dará algo como:
- **Para guiaa.vet**: Registro A → `76.76.21.21`
- **Para www.guiaa.vet**: CNAME → `cname.vercel-dns.com`

### 2.2 Configurar DNS en Squarespace

**IMPORTANTE**: Si `guiaa.vet` está conectado a un sitio de Squarespace, necesitas desconectarlo primero.

#### En Squarespace:

1. Ve a https://www.squarespace.com/account/settings
2. Clic en **Domains**
3. Selecciona `guiaa.vet`
4. Si está conectado a un sitio:
   - Ve al sitio → Settings → Domains
   - Desconecta el dominio del sitio
5. Ve a **DNS Settings** o **Advanced DNS**

#### Agregar Registros:

**Para guiaa.vet (dominio principal):**
- Tipo: **A Record**
- Host: `@` (o dejar en blanco)
- Points to: `76.76.21.21` (IP de Vercel - verifica en Vercel)
- TTL: `3600` o por defecto

**Para www.guiaa.vet:**
- Tipo: **CNAME**
- Host: `www`
- Points to: `cname.vercel-dns.com` (o lo que Vercel te indique)
- TTL: `3600` o por defecto

### 2.3 Verificar en Vercel

1. Espera 5-30 minutos (propagación DNS)
2. Vercel verificará automáticamente el dominio
3. SSL se generará automáticamente

---

## 🚂 Paso 3: Configurar api.guiaa.vet en Railway

### 3.1 Agregar Dominio en Railway

1. Ve a Railway Dashboard → Tu servicio (backend)
2. Settings → **Networking** o **Domains**
3. Click en **"Add Custom Domain"** o **"Generate Domain"**
4. Ingresa: `api.guiaa.vet`
5. Railway te dará un **CNAME target** (ejemplo: `xxxxx.railway.app`)

### 3.2 Agregar CNAME en Squarespace

1. Ve a Squarespace → Domains → `guiaa.vet` → DNS Settings
2. Agrega:

**Para api.guiaa.vet:**
- Tipo: **CNAME**
- Host: `api`
- Points to: `xxxxx.railway.app` (el CNAME que Railway te dio)
- TTL: `3600` o por defecto

### 3.3 Actualizar CORS en Railway

Una vez que tengas el dominio configurado, agrega en Railway → Variables:

```
CORS_ALLOW_ORIGINS = https://guiaa.vet,https://www.guiaa.vet
```

### 3.4 Actualizar Variable en Vercel

Después de que `api.guiaa.vet` esté funcionando, actualiza en Vercel → Environment Variables:

```
REACT_APP_BACKEND_URL = https://api.guiaa.vet
```

Y haz un nuevo deploy.

---

## 📋 Resumen de Registros DNS en Squarespace

Una vez configurado todo, deberías tener estos registros en Squarespace:

```
Tipo    | Host | Points to                    | Para
--------|------|------------------------------|------------------
A       | @    | 76.76.21.21                  | guiaa.vet
CNAME   | www  | cname.vercel-dns.com         | www.guiaa.vet
CNAME   | api  | xxxxx.railway.app            | api.guiaa.vet
```

**Nota**: Los valores exactos los obtienes de Vercel y Railway.

---

## ⚠️ Consideraciones para Squarespace

### Si no puedes editar DNS en Squarespace:

**Opción 1: Desconectar del sitio**
- Si `guiaa.vet` está conectado a un sitio de Squarespace, desconéctalo primero
- Settings → Domains → Desconectar del sitio

**Opción 2: Cambiar a Cloudflare DNS (Recomendado)**
1. Crea cuenta gratuita en Cloudflare
2. Agrega el dominio `guiaa.vet`
3. Cloudflare te dará 2 nameservers
4. En Squarespace: Cambia los nameservers a los de Cloudflare
5. Configura DNS en Cloudflare (más fácil y potente)

---

## ✅ Checklist

### Frontend (Vercel):
- [ ] Proyecto creado en Vercel
- [ ] Deploy exitoso con URL temporal
- [ ] Dominio `guiaa.vet` agregado en Vercel
- [ ] Dominio `www.guiaa.vet` agregado en Vercel
- [ ] Registro A configurado en Squarespace para `@`
- [ ] Registro CNAME configurado para `www`
- [ ] Dominio verificado en Vercel
- [ ] SSL activado (automático)

### Backend (Railway):
- [ ] URL del backend anotada (temporal)
- [ ] Dominio `api.guiaa.vet` agregado en Railway
- [ ] CNAME de Railway obtenido
- [ ] Registro CNAME configurado en Squarespace para `api`
- [ ] CORS configurado en Railway
- [ ] Variable `REACT_APP_BACKEND_URL` actualizada en Vercel

---

## 🔍 Verificación

Después de configurar (espera 5-30 minutos para propagación DNS):

```bash
# Verificar DNS (en PowerShell)
nslookup guiaa.vet
nslookup www.guiaa.vet
nslookup api.guiaa.vet
```

**URLs que deberían funcionar:**
- ✅ `https://guiaa.vet` → Frontend
- ✅ `https://www.guiaa.vet` → Frontend
- ✅ `https://api.guiaa.vet/docs` → Backend API Docs

---

## 🆘 Solución de Problemas

### "Domain not verified" en Vercel
- Espera 5-30 minutos (propagación DNS)
- Verifica que los registros estén correctos en Squarespace
- Revisa que no haya errores de escritura

### No puedes editar DNS en Squarespace
- Asegúrate de que el dominio NO esté conectado a un sitio
- Considera cambiar nameservers a Cloudflare (más fácil)

### "CNAME conflict"
- Verifica que no haya otros registros conflictivos
- Si el dominio está en uso, desconéctalo primero

---

## 📝 Orden Recomendado de Pasos

1. ✅ **Backend ya está online en Railway** (hecho)
2. 🔄 **Desplegar frontend en Vercel** (próximo paso)
3. 🔄 **Configurar dominio en Vercel**
4. 🔄 **Configurar DNS en Squarespace**
5. 🔄 **Configurar api.guiaa.vet en Railway**
6. 🔄 **Actualizar variables de entorno**

---

**¿Listo para empezar?** Primero necesitamos desplegar el frontend en Vercel. ¿Tienes la URL del backend de Railway para agregarla como variable de entorno?

