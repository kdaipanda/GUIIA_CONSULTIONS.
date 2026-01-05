# 🔍 Cómo Encontrar el Valor DNS que Railway Te Dio

## 📍 Dónde Buscar el Valor

### Opción 1: En la Configuración de Dominios

1. Ve a **Railway Dashboard**: https://railway.app/dashboard
2. Selecciona tu proyecto/servicio del **backend**
3. Ve a **Settings** → **Networking** (o busca **"Domains"** o **"Custom Domains"**)
4. Busca la sección donde agregaste o intentaste agregar `api.guiaa.vet`

**El valor que necesitas puede aparecer como:**
- **CNAME Target**: `xxx.railway.app`
- **Value**: Una IP o dominio
- **Target**: Un dominio que Railway genera

---

### Opción 2: Si Ya Agregaste el Dominio

Si ya agregaste `api.guiaa.vet` en Railway:

1. Ve a **Settings** → **Networking**
2. Busca `api.guiaa.vet` en la lista de dominios
3. Haz clic en él o busca un botón de **"View"** o **"Details"**
4. Railway te mostrará el registro DNS que necesitas configurar

**Normalmente verás algo como:**
```
Type: CNAME
Name: api
Target: xxx-production.up.railway.app
```

El **Target** es el valor que necesitas.

---

### Opción 3: Si No Has Agregado el Dominio Aún

Si aún no has agregado el dominio:

1. Ve a **Settings** → **Networking**
2. Haz clic en **"Add Custom Domain"** o **"Generate Domain"**
3. Escribe: `api.guiaa.vet`
4. Haz clic en **"Add"** o **"Save"**
5. Railway te mostrará inmediatamente el registro DNS que necesitas

**El valor aparecerá como:**
- Un dominio que termina en `.railway.app` (ej: `xxx-production.up.railway.app`)
- O una IP si Railway usa registro A

---

### Opción 4: En el Public Domain de Railway

Si Railway ya tiene un dominio público generado:

1. Ve a **Settings** → **Networking**
2. Busca **"Public Domain"** o **"Generated Domain"**
3. Railway normalmente genera algo como: `xxx-production.up.railway.app`
4. **Este es el valor que necesitas** para el registro CNAME

---

## 🎯 Valor Típico de Railway

Railway normalmente genera dominios con este formato:

```
tu-proyecto-production.up.railway.app
```

O:

```
tu-servicio-production.up.railway.app
```

**Ejemplos comunes:**
- `guiiaconsultions-production.up.railway.app`
- `backend-production.up.railway.app`
- `api-production.up.railway.app`

---

## 📋 Cómo Usar el Valor

Una vez que tengas el valor de Railway:

### En Cloudflare:

1. Ve a **Cloudflare Dashboard** → Tu dominio `guiaa.vet` → **DNS** → **Records**
2. Haz clic en **"Add record"**
3. Configura:
   - **Type**: `CNAME`
   - **Name**: `api` (solo `api`, sin `.guiaa.vet`)
   - **Target**: Pega el valor que Railway te dio (ej: `xxx-production.up.railway.app`)
   - **Proxy status**: **"DNS only"** (gris) - recomendado para APIs
4. Guarda

---

## 🔍 Si No Encuentras el Valor

### Verifica el Nombre del Servicio

1. En Railway, ve a tu proyecto
2. Verifica el **nombre del servicio** del backend
3. El dominio de Railway suele ser: `nombre-del-servicio-production.up.railway.app`

### Revisa los Logs

1. En Railway → **Deployments** → Selecciona el más reciente
2. Revisa los logs al inicio del deployment
3. A veces Railway muestra el dominio público ahí

### Genera un Nuevo Dominio

1. En Railway → **Settings** → **Networking**
2. Si no hay un dominio público, Railway puede generar uno automáticamente
3. O haz clic en **"Generate Domain"** para crear uno nuevo

---

## ✅ Verificación

Después de configurar el CNAME en Cloudflare:

1. Espera 5-15 minutos
2. En Railway, verifica que `api.guiaa.vet` aparezca como **"Active"** o **"Verified"**
3. Prueba en el navegador: `https://api.guiaa.vet/docs`

---

## 🆘 Si Necesitas Ayuda

Comparte:
1. **¿Qué ves en Railway** → Settings → Networking?
2. **¿Hay algún dominio público** ya generado?
3. **¿Qué aparece** cuando intentas agregar `api.guiaa.vet`?

Con esa información podré ayudarte a encontrar el valor exacto.

