# 🔍 Solución: Página en Blanco en guiaa.vet

## Problema Identificado

La página está en blanco porque **faltan las variables de entorno de Supabase** en Vercel. El frontend necesita estas variables para inicializar el cliente de Supabase.

---

## ✅ Solución: Configurar Variables de Entorno en Vercel

### Paso 1: Obtener las Credenciales de Supabase

1. Ve a tu proyecto en **Supabase Dashboard**: https://supabase.com
2. Ve a **Settings** → **API**
3. Copia estos valores:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon/public key** → `REACT_APP_SUPABASE_ANON_KEY`

---

### Paso 2: Configurar Variables en Vercel

1. Ve a **Vercel Dashboard**: https://vercel.com
2. Selecciona tu proyecto **GUIIA_CONSULTIONS** (o el nombre que tenga)
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables:

#### Variables Requeridas:

| Variable | Valor | Entornos |
|----------|-------|----------|
| `REACT_APP_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | Production, Preview, Development |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGc...` (tu anon key) | Production, Preview, Development |
| `REACT_APP_BACKEND_URL` | `https://api.guiaa.vet` | Production, Preview, Development |

**Nota**: Selecciona **todos los entornos** (Production, Preview, Development) para cada variable.

---

### Paso 3: Redesplegar la Aplicación

Después de agregar las variables:

1. Ve a **Deployments** en Vercel
2. Haz clic en los **3 puntos** (⋯) del deployment más reciente
3. Selecciona **Redeploy**
4. O simplemente haz un **nuevo commit** y push (Vercel redeplegará automáticamente)

---

## 🔍 Verificación

### 1. Verificar en la Consola del Navegador

1. Abre `guiaa.vet` en tu navegador
2. Presiona **F12** para abrir las DevTools
3. Ve a la pestaña **Console**
4. Busca errores como:
   - `Supabase env vars missing`
   - `Cannot read property 'auth' of undefined`
   - Cualquier error relacionado con Supabase

### 2. Verificar el Build en Vercel

1. Ve a **Deployments** en Vercel
2. Haz clic en el deployment más reciente
3. Revisa los **Build Logs**
4. Verifica que no haya errores durante el build

### 3. Verificar Variables de Entorno

En Vercel, después de configurar las variables, verifica que:
- ✅ Están marcadas para **Production**
- ✅ Están marcadas para **Preview**
- ✅ Están marcadas para **Development** (opcional)

---

## 🐛 Otros Problemas Comunes

### Problema 1: Error de CORS

**Síntoma**: Errores de CORS en la consola del navegador

**Solución**: Verifica que en Supabase:
1. Ve a **Settings** → **API**
2. En **CORS**, agrega: `https://guiaa.vet`

---

### Problema 2: Build Falla en Vercel

**Síntoma**: El deployment falla durante el build

**Solución**: 
1. Verifica que `package.json` tenga el script `build`
2. Verifica que `vercel.json` esté configurado correctamente
3. Revisa los **Build Logs** en Vercel para ver el error específico

---

### Problema 3: JavaScript Deshabilitado

**Síntoma**: Página completamente en blanco, sin errores en consola

**Solución**: 
- Verifica que JavaScript esté habilitado en tu navegador
- El `index.html` tiene: `<noscript>You need to enable JavaScript to run this app.</noscript>`

---

## 📋 Checklist de Verificación

- [ ] Variables de entorno configuradas en Vercel
- [ ] `REACT_APP_SUPABASE_URL` configurada
- [ ] `REACT_APP_SUPABASE_ANON_KEY` configurada
- [ ] `REACT_APP_BACKEND_URL` configurada (ya está en `vercel.json`, pero verifica)
- [ ] Aplicación redeplegada después de agregar variables
- [ ] Sin errores en la consola del navegador
- [ ] Build exitoso en Vercel
- [ ] CORS configurado en Supabase

---

## 🚀 Después de Configurar

Una vez que configures las variables y redeplegues:

1. Espera 1-2 minutos para que el deployment termine
2. Visita `https://guiaa.vet`
3. Deberías ver la página de landing o login
4. Si aún está en blanco, abre la consola (F12) y comparte los errores

---

## 📞 Si Aún No Funciona

Si después de seguir estos pasos la página sigue en blanco:

1. **Abre la consola del navegador** (F12 → Console)
2. **Copia todos los errores** que veas
3. **Comparte los errores** para diagnosticar el problema específico

Los errores más comunes son:
- Variables de entorno faltantes
- Errores de CORS
- Errores de JavaScript (sintaxis, imports, etc.)
- Problemas con el build de Vercel

---

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Documentación Vercel Env Vars**: https://vercel.com/docs/concepts/projects/environment-variables

