# 🔍 Diagnóstico: Frontend en Blanco (guiaa.vet)

## Problema

El frontend en `https://guiaa.vet` muestra una página completamente en blanco.

---

## 🔍 Paso 1: Verificar Errores en la Consola

### 1.1. Abrir DevTools

1. Visita `https://guiaa.vet`
2. Presiona **F12** (o clic derecho → "Inspeccionar")
3. Ve a la pestaña **"Console"**

### 1.2. Buscar Errores

Busca errores en rojo. Los más comunes son:

#### Error 1: Variables de Supabase Faltantes
```
Supabase env vars missing: REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY
Uncaught Error: supabaseUrl is required.
```

**Solución**: Configurar variables en Vercel (ver Paso 2)

#### Error 2: Error de JavaScript
```
Uncaught SyntaxError: ...
Uncaught ReferenceError: ...
```

**Solución**: Problema en el código o build de Vercel

#### Error 3: Error de Red
```
Failed to load resource: ...
```

**Solución**: Problema de conexión o CORS

---

## ✅ Paso 2: Verificar Variables de Entorno en Vercel

### 2.1. Ir a Vercel

1. Ve a **Vercel Dashboard**: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**

### 2.2. Verificar Variables Requeridas

Debes tener **exactamente estas 3 variables**:

| Variable | Valor Esperado | Entornos |
|----------|----------------|----------|
| `REACT_APP_SUPABASE_URL` | `https://xxxxx.supabase.co` | ✅ Production, ✅ Preview, ✅ Development |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGc...` (muy largo) | ✅ Production, ✅ Preview, ✅ Development |
| `REACT_APP_BACKEND_URL` | `https://api.guiaa.vet` | ✅ Production, ✅ Preview, ✅ Development |

### 2.3. Si Faltan Variables

#### Obtener Credenciales de Supabase:

1. Ve a **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → Para `REACT_APP_SUPABASE_URL`
   - **anon public key** → Para `REACT_APP_SUPABASE_ANON_KEY`

#### Agregar en Vercel:

1. Haz clic en **"Add New"**
2. Agrega cada variable con los valores correctos
3. **IMPORTANTE**: Marca ✅ **Production**, ✅ **Preview**, ✅ **Development** para cada una
4. Guarda

---

## ✅ Paso 3: Redesplegar Frontend

Después de agregar/modificar variables:

1. Ve a **Deployments** en Vercel
2. Haz clic en los **3 puntos** (⋯) del deployment más reciente
3. Selecciona **"Redeploy"**
4. Espera 1-2 minutos para que termine

---

## ✅ Paso 4: Limpiar Caché del Navegador

Después de redesplegar:

1. Visita `https://guiaa.vet`
2. Presiona **Ctrl + Shift + R** (o **Cmd + Shift + R** en Mac)
   - Esto recarga la página sin usar caché
3. O presiona **F12** → **Console** → Ejecuta:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

---

## 🔍 Paso 5: Verificar el Build en Vercel

### 5.1. Revisar Logs del Build

1. En Vercel → **Deployments**
2. Haz clic en el deployment más reciente
3. Ve a **"Build Logs"**
4. Verifica que el build haya sido exitoso:
   - ✅ Debe decir **"Compiled successfully"**
   - ❌ Si hay errores, compártelos

### 5.2. Verificar que el Build Use las Variables

El build debe mostrar que las variables están disponibles. Si ves errores sobre variables faltantes, significa que no están configuradas correctamente.

---

## 🐛 Solución de Problemas Específicos

### Problema 1: Variables No Se Aplican

**Síntoma**: Agregaste las variables pero el frontend sigue en blanco

**Soluciones**:
1. Verifica que las variables estén marcadas para **Production**
2. **Redesplega** el frontend después de agregar variables
3. Verifica que los nombres sean **exactamente**:
   - `REACT_APP_SUPABASE_URL` (con `REACT_APP_` al inicio)
   - `REACT_APP_SUPABASE_ANON_KEY`
   - `REACT_APP_BACKEND_URL`

---

### Problema 2: Build Falla

**Síntoma**: El deployment falla durante el build

**Soluciones**:
1. Revisa los **Build Logs** en Vercel
2. Busca el error específico
3. Los errores comunes son:
   - Dependencias faltantes
   - Errores de sintaxis en el código
   - Variables de entorno mal formateadas

---

### Problema 3: JavaScript Deshabilitado

**Síntoma**: Página completamente en blanco, sin errores en consola

**Solución**:
1. Verifica que JavaScript esté habilitado en tu navegador
2. El `index.html` tiene: `<noscript>You need to enable JavaScript to run this app.</noscript>`

---

## 📋 Checklist de Diagnóstico

- [ ] Consola del navegador abierta (F12 → Console)
- [ ] Errores identificados en la consola
- [ ] Variables de entorno verificadas en Vercel
- [ ] `REACT_APP_SUPABASE_URL` configurada
- [ ] `REACT_APP_SUPABASE_ANON_KEY` configurada
- [ ] `REACT_APP_BACKEND_URL` configurada
- [ ] Todas las variables marcadas para Production, Preview y Development
- [ ] Frontend redesplegado después de configurar variables
- [ ] Caché del navegador limpiada
- [ ] Build en Vercel exitoso

---

## 🆘 Si Necesitas Ayuda

Comparte:

1. **Errores de la consola** (F12 → Console):
   - Copia todos los errores en rojo
   - Especialmente busca errores de Supabase

2. **Estado del build en Vercel**:
   - ¿El último deployment fue exitoso?
   - ¿Hay errores en los Build Logs?

3. **Variables configuradas en Vercel**:
   - ¿Tienes las 3 variables configuradas?
   - ¿Están marcadas para Production?

Con esa información podré darte la solución exacta.

