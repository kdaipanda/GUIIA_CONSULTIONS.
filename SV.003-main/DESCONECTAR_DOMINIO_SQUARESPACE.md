# 🔧 Desconectar Dominio de Squarespace para Usar con Vercel

## 📋 Situación Actual

Tu dominio `guiaa.vet` está **conectado a un sitio de Squarespace**. El registro `_domainconnect` lo confirma.

Para poder configurar DNS personalizados (para Vercel), necesitas **desconectar el dominio del sitio** primero.

---

## ⚠️ Importante

**Desconectar el dominio NO lo elimina**, solo lo desconecta del sitio. El dominio seguirá siendo tuyo y podrás:
- ✅ Configurar DNS personalizados
- ✅ Conectarlo a Vercel
- ✅ Volver a conectarlo al sitio más tarde si quieres

---

## 📋 Paso 1: Ir al Sitio de Squarespace

1. En Squarespace, ve a la sección **"Websites"** o **"Sites"**
2. Busca el sitio que tiene conectado `guiaa.vet`
3. Haz clic en el sitio para abrirlo

---

## 📋 Paso 2: Desconectar el Dominio

1. En el sitio, ve a **Settings** (⚙️)
2. Busca la sección **"Domains"** o **"Connected Domains"**
3. Deberías ver `guiaa.vet` listado como dominio conectado
4. Haz clic en `guiaa.vet` o busca un botón **"Remove"**, **"Disconnect"**, o **"Unlink"**
5. Confirma la acción cuando te lo pida

**Nota**: Squarespace puede preguntarte si estás seguro. Esto es normal.

---

## 📋 Paso 3: Verificar que se Desconectó

1. Vuelve a **Domains** en tu cuenta de Squarespace
2. Selecciona `guiaa.vet`
3. Ve a **DNS Settings**
4. Ahora deberías poder ver más opciones para editar DNS
5. El registro `_domainconnect` puede desaparecer o quedar inactivo

---

## 📋 Paso 4: Configurar DNS para Vercel

Una vez desconectado, podrás:

1. En **DNS Settings**, haz clic en **"ADD PRESET"** o busca **"Add Record"**
2. Agrega los registros DNS que Vercel te proporcionó:
   - **Registro A** para `guiaa.vet`
   - **CNAME** para `www.guiaa.vet`

---

## 🔍 Si No Puedes Desconectar el Dominio

Si no encuentras la opción para desconectar:

### Opción A: Buscar en Otra Ubicación

1. En el sitio de Squarespace, busca:
   - **Settings** → **Domains**
   - **Settings** → **Connected Domains**
   - O en el menú principal del sitio

### Opción B: Usar Cloudflare DNS (Alternativa)

Si Squarespace no te permite desconectar o editar DNS:

1. **Cambia los nameservers a Cloudflare** (no necesitas desconectar)
2. Configura DNS en Cloudflare (más fácil)
3. Esto funciona incluso si el dominio está conectado al sitio

**Ventajas de Cloudflare:**
- ✅ No necesitas desconectar el dominio
- ✅ Más fácil de configurar
- ✅ Mejor rendimiento
- ✅ Gratis

---

## 📝 Pasos para Cloudflare (Si Prefieres Esta Opción)

1. Crea cuenta en **Cloudflare** (gratis): https://cloudflare.com
2. Agrega el dominio `guiaa.vet`
3. Cloudflare te dará 2 nameservers (ejemplo: `ns1.cloudflare.com`)
4. En Squarespace → DNS Settings → Cambia nameservers
5. Configura DNS en Cloudflare (muy fácil, interfaz más clara)

---

## ✅ Qué Hacer Ahora

**Opción 1: Desconectar del Sitio (Recomendado si no usas el sitio)**
1. Ve al sitio de Squarespace
2. Settings → Domains
3. Desconecta `guiaa.vet`
4. Configura DNS en Squarespace

**Opción 2: Usar Cloudflare (Recomendado si quieres más control)**
1. Crea cuenta en Cloudflare
2. Agrega el dominio
3. Cambia nameservers en Squarespace
4. Configura DNS en Cloudflare

---

## 🆘 Si el Sitio de Squarespace Está en Uso

Si el sitio de Squarespace está activo y lo estás usando:

- **Opción A**: Usa un subdominio diferente para el sitio (ej: `www.guiaa.vet` para el sitio, `guiaa.vet` para Vercel)
- **Opción B**: Usa Cloudflare DNS (puedes tener ambos funcionando)
- **Opción C**: Desconecta temporalmente, configura Vercel, y luego decide qué hacer con el sitio

---

**¿Quieres intentar desconectar el dominio del sitio, o prefieres usar Cloudflare DNS?** 

Cloudflare es más fácil y no requiere desconectar el dominio.

