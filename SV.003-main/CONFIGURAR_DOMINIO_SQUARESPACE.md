# 🌐 Configurar Dominio de Squarespace con Vercel y Railway

## 📋 Información Necesaria

Para configurar correctamente, necesitamos saber:
1. **¿Cuál es tu dominio?** (ejemplo: `tudominio.com`)
2. **¿Cómo quieres organizarlo?**
   - Frontend: `tudominio.com` y `www.tudominio.com`
   - Backend: `api.tudominio.com`

---

## 🎯 Configuración Recomendada

```
Frontend: tudominio.com + www.tudominio.com  → Vercel
Backend:  api.tudominio.com                  → Railway
```

---

## 📝 Paso 1: Configurar Dominio en Vercel (Frontend)

### 1.1 Obtener Instrucciones de Vercel

1. Ve a https://vercel.com
2. Selecciona tu proyecto (o créalo primero)
3. Ve a **Settings** → **Domains**
4. Agrega tu dominio: `tudominio.com`
5. Agrega también: `www.tudominio.com`
6. Vercel te mostrará las instrucciones de DNS

Vercel te dará algo como:
- **Tipo A**: `76.76.21.21` (para `tudominio.com`)
- **Tipo CNAME**: `cname.vercel-dns.com` (para `www.tudominio.com`)

### 1.2 Configurar DNS en Squarespace

**IMPORTANTE**: Squarespace tiene dos formas de manejar dominios:
- Si el dominio está **conectado a un sitio de Squarespace**: Necesitas desvincularlo primero
- Si el dominio está **solo registrado en Squarespace** (sin sitio): Puedes configurar DNS directamente

#### Opción A: Dominio sin sitio de Squarespace

1. Ve a https://www.squarespace.com/account/settings
2. Clic en **Domains**
3. Selecciona tu dominio
4. Ve a **DNS Settings** o **Advanced DNS**
5. Agrega estos registros:

**Para el dominio principal (tudominio.com):**
- Tipo: **A Record** o **A**
- Host: `@` o dejar en blanco
- Points to: `76.76.21.21` (IP de Vercel)
- TTL: `3600` o por defecto

**Para www (www.tudominio.com):**
- Tipo: **CNAME**
- Host: `www`
- Points to: `cname.vercel-dns.com` (o lo que Vercel te indique)
- TTL: `3600` o por defecto

#### Opción B: Dominio conectado a un sitio de Squarespace

Si tu dominio está conectado a un sitio de Squarespace, tienes dos opciones:

**Opción B1: Desconectar el dominio (recomendado)**
1. Ve a tu sitio de Squarespace
2. Settings → Domains
3. Desconecta el dominio del sitio
4. Luego sigue los pasos de la Opción A

**Opción B2: Usar dominios externos (avanzado)**
- Contacta con soporte de Squarespace para configurar DNS externos
- O transfiere el dominio a otro registrador (Namecheap, Google Domains, etc.)

---

## 📝 Paso 2: Configurar Subdominio en Railway (Backend)

### 2.1 Obtener CNAME de Railway

1. Ve a Railway Dashboard
2. Selecciona tu servicio (backend)
3. Ve a **Settings** → **Domains** o **Networking**
4. Clic en **"Add Custom Domain"** o **"Generate Domain"**
5. Ingresa: `api.tudominio.com`
6. Railway te dará un **CNAME target** (ejemplo: `xxxxx.railway.app`)

### 2.2 Agregar CNAME en Squarespace

1. Ve a Squarespace → Domains → Tu dominio → DNS Settings
2. Agrega este registro:

**Para api (api.tudominio.com):**
- Tipo: **CNAME**
- Host: `api`
- Points to: `xxxxx.railway.app` (el CNAME que Railway te dio)
- TTL: `3600` o por defecto

---

## ⚠️ Consideraciones Importantes para Squarespace

### 1. Limitaciones de Squarespace DNS

Squarespace tiene algunas limitaciones:
- ✅ Soporta registros A, AAAA, CNAME, MX, TXT
- ⚠️ Algunos registros avanzados pueden no estar disponibles
- ⚠️ Si el dominio está conectado a un sitio, puede haber conflictos

### 2. Si no puedes configurar DNS en Squarespace

Si Squarespace no te permite configurar DNS personalizados, considera:

**Opción 1: Transferir el dominio**
- Transfiere el dominio a otro registrador (Namecheap, Google Domains, Cloudflare)
- Estos servicios ofrecen más control sobre DNS

**Opción 2: Usar Cloudflare DNS (recomendado)**
1. Crea cuenta gratuita en Cloudflare
2. Agrega tu dominio
3. Cambia los nameservers en Squarespace a los de Cloudflare
4. Configura DNS en Cloudflare (más fácil y potente)

### 3. Cambiar Nameservers a Cloudflare (Recomendado)

Si Squarespace limita las opciones DNS, usar Cloudflare es la mejor opción:

1. **Crear cuenta en Cloudflare** (gratis): https://cloudflare.com
2. **Agregar dominio en Cloudflare**
3. **Cloudflare te dará 2 nameservers** (ejemplo: `ns1.cloudflare.com`, `ns2.cloudflare.com`)
4. **En Squarespace**: Ve a DNS Settings → Cambia nameservers a los de Cloudflare
5. **Configura DNS en Cloudflare** (más fácil y con más opciones)

---

## ✅ Checklist de Configuración

### Para Vercel (Frontend):
- [ ] Dominio agregado en Vercel Dashboard
- [ ] Registro A configurado en Squarespace para `@` (tudominio.com)
- [ ] Registro CNAME configurado para `www` (www.tudominio.com)
- [ ] Dominio verificado en Vercel (puede tardar unos minutos)

### Para Railway (Backend):
- [ ] Dominio personalizado agregado en Railway
- [ ] CNAME de Railway obtenido
- [ ] Registro CNAME configurado en Squarespace para `api`
- [ ] SSL automático activado (Railway lo hace automáticamente)

---

## 🔧 Verificación

Después de configurar, verifica:

1. **DNS propagado** (puede tardar 5 minutos a 48 horas):
   ```bash
   # En terminal (Windows PowerShell)
   nslookup tudominio.com
   nslookup www.tudominio.com
   nslookup api.tudominio.com
   ```

2. **Frontend accesible**:
   - `https://tudominio.com` ✅
   - `https://www.tudominio.com` ✅

3. **Backend accesible**:
   - `https://api.tudominio.com/docs` ✅

---

## 🆘 Solución de Problemas

### "Domain not verified" en Vercel
- Espera 5-30 minutos (propagación DNS)
- Verifica que los registros DNS estén correctos
- Revisa que no haya errores de escritura

### "SSL certificate error"
- Vercel y Railway generan SSL automáticamente
- Espera 5-15 minutos después de configurar DNS
- Verifica que el dominio esté correctamente configurado

### "CNAME conflict" en Squarespace
- Si el dominio está conectado a un sitio, desconéctalo primero
- O cambia a Cloudflare DNS (más fácil)

### No puedes editar DNS en Squarespace
- Considera transferir el dominio a Cloudflare, Namecheap o Google Domains
- O cambiar nameservers a Cloudflare (gratis y recomendado)

---

## 📞 Recursos

- Vercel DNS Docs: https://vercel.com/docs/concepts/projects/domains
- Railway Custom Domains: https://docs.railway.app/deploy/exposing-your-app#custom-domains
- Squarespace DNS Help: https://support.squarespace.com/hc/en-us/articles/205812668
- Cloudflare DNS (recomendado): https://www.cloudflare.com/dns/

---

**¿Necesitas ayuda con algún paso específico?** Dime qué dominio tienes y cómo quieres organizarlo, y te ayudo paso a paso.

