# 🔑 Cómo Obtener Credenciales de Supabase

## 🎯 Objetivo

Obtener el **Project URL** y el **anon public key** de Supabase para configurarlos en Vercel.

---

## 📋 Paso 1: Acceder a Supabase Dashboard

### 1.1. Iniciar Sesión

1. Ve a **Supabase Dashboard**: https://supabase.com/dashboard
2. Inicia sesión con tu cuenta (email y contraseña)
3. Si no tienes cuenta, haz clic en **"Sign Up"** para crear una

---

## 📋 Paso 2: Seleccionar tu Proyecto

### 2.1. Ver Lista de Proyectos

1. Después de iniciar sesión, verás una lista de tus proyectos
2. Si tienes varios proyectos, busca el que corresponda a **GUIAA** o **Savant Vet**
3. Haz clic en el proyecto para abrirlo

### 2.2. Si No Tienes Proyecto

Si no tienes ningún proyecto:

1. Haz clic en **"New Project"** o **"Create Project"**
2. Completa el formulario:
   - **Name**: `GUIAA` o `Savant Vet`
   - **Database Password**: Crea una contraseña segura (guárdala)
   - **Region**: Elige la más cercana a ti
3. Haz clic en **"Create new project"**
4. Espera 1-2 minutos mientras se crea el proyecto

---

## 📋 Paso 3: Obtener las Credenciales

### 3.1. Ir a Settings → API

1. En el menú lateral izquierdo, busca **"Settings"** (⚙️)
2. Haz clic en **"Settings"**
3. En el submenú que aparece, haz clic en **"API"**

### 3.2. Encontrar las Credenciales

En la página de API verás varias secciones. Necesitas estas dos:

#### **Project URL**

Busca la sección **"Project URL"** o **"Project URL"**:

```
Project URL
https://xxxxx.supabase.co
```

**Acción**: Copia el valor completo (ej: `https://abcdefghijklmnop.supabase.co`)

---

#### **anon public key**

Busca la sección **"Project API keys"** o **"API Keys"**:

Verás dos claves:
- **anon public** (o **anon key**) - Esta es la que necesitas
- **service_role** (secret) - Esta es para el backend, no la uses en el frontend

**Acción**: 
1. Busca la clave **"anon public"** (no la "service_role")
2. Haz clic en el icono de **"Copy"** (📋) o selecciona y copia el texto
3. Es una cadena muy larga que empieza con `eyJhbGc...`

**Ejemplo de cómo se ve:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

---

## 📋 Paso 4: Verificar las Credenciales

### 4.1. Verificar Project URL

- ✅ Debe empezar con `https://`
- ✅ Debe terminar con `.supabase.co`
- ✅ Ejemplo válido: `https://abcdefghijklmnop.supabase.co`

### 4.2. Verificar anon public key

- ✅ Debe ser muy larga (cientos de caracteres)
- ✅ Debe empezar con `eyJhbGc...`
- ✅ Tiene varios puntos (.) separando secciones
- ✅ NO debe ser la "service_role" key

---

## 📋 Paso 5: Usar las Credenciales en Vercel

Ahora que tienes las credenciales:

### 5.1. Configurar en Vercel

1. Ve a **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. Agrega:

**Variable 1:**
- **Name**: `REACT_APP_SUPABASE_URL`
- **Value**: Pega el **Project URL** que copiaste
- **Environments**: Marca ✅ Production, ✅ Preview, ✅ Development

**Variable 2:**
- **Name**: `REACT_APP_SUPABASE_ANON_KEY`
- **Value**: Pega el **anon public key** que copiaste
- **Environments**: Marca ✅ Production, ✅ Preview, ✅ Development

### 5.2. Redesplegar

1. Ve a **Deployments** → **Redeploy**
2. Espera 1-2 minutos

---

## 🐛 Problemas Comunes

### Problema 1: No Veo la Sección API

**Solución**:
1. Asegúrate de estar en **Settings** (no en otro menú)
2. Busca **"API"** en el submenú de Settings
3. Si no aparece, verifica que tengas permisos de administrador en el proyecto

---

### Problema 2: No Sé Cuál es el Proyecto Correcto

**Solución**:
1. Revisa el nombre del proyecto en la lista
2. Si no estás seguro, puedes crear uno nuevo
3. O verifica en el código del backend qué URL de Supabase está configurada

---

### Problema 3: Copié la Clave Incorrecta

**Solución**:
- ✅ **anon public** → Para el frontend (Vercel)
- ❌ **service_role** → Solo para el backend (Railway), nunca en el frontend

Si copiaste la service_role por error, vuelve a copiar la **anon public**.

---

## 📋 Checklist

- [ ] Inicié sesión en Supabase Dashboard
- [ ] Seleccioné el proyecto correcto
- [ ] Fui a Settings → API
- [ ] Copié el **Project URL** completo
- [ ] Copié el **anon public key** (no la service_role)
- [ ] Verifiqué que el Project URL empiece con `https://`
- [ ] Verifiqué que el anon key sea muy largo y empiece con `eyJhbGc...`
- [ ] Configuré las variables en Vercel
- [ ] Redesplegué el frontend

---

## 🔗 Enlaces Útiles

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Documentación Supabase API Keys**: https://supabase.com/docs/guides/api/api-keys

---

## 🆘 Si Necesitas Ayuda

Comparte:
1. **¿Puedes acceder a Supabase Dashboard?**
2. **¿Ves la sección Settings → API?**
3. **¿Qué valores ves en Project URL y anon public key?**

Con esa información podré ayudarte a obtener las credenciales correctas.

