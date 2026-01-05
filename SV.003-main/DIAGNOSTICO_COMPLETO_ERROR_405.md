# 🔍 Diagnóstico Completo: Error 405 Persistente

## Pasos de Diagnóstico

### Paso 1: Verificar que el Backend Esté Accesible

Abre tu navegador y visita directamente:

```
https://api.guiaa.vet/health
```

**O si usas el dominio de Railway:**

```
https://tu-proyecto.railway.app/health
```

**Resultados esperados:**

✅ **Si funciona**: Verás un JSON con el estado del servidor
❌ **Si no funciona**: 
- Error de conexión → El backend no está accesible
- Error 404 → El endpoint `/health` no existe
- Error 405 → Problema de CORS o método HTTP

---

### Paso 2: Verificar la URL que Usa el Frontend

1. Abre `https://guiaa.vet`
2. Presiona **F12** → **Console**
3. Busca el mensaje: `"Backend URL being used:"`
4. Verifica que sea: `https://api.guiaa.vet`

Si no es esa URL, hay un problema con la configuración.

---

### Paso 3: Probar el Endpoint Directamente desde la Consola

En la consola del navegador (F12 → Console), ejecuta:

```javascript
// Probar el endpoint de login
fetch('https://api.guiaa.vet/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'carlos.hernandez@vetmed.com',
    cedula_profesional: '87654321'
  })
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Status Text:', r.statusText);
  return r.text();
})
.then(text => {
  console.log('Response:', text);
})
.catch(err => {
  console.error('Error:', err);
});
```

**Resultados esperados:**

✅ **Status 200 o 401**: El endpoint funciona (401 es normal si las credenciales son incorrectas)
❌ **Status 405**: El método POST no está permitido
❌ **CORS Error**: El backend no permite el origen `https://guiaa.vet`

---

### Paso 4: Verificar CORS en Railway

1. Ve a **Railway Dashboard** → Tu proyecto → **Variables**
2. Verifica que exista:

```
CORS_ALLOW_ORIGINS = https://guiaa.vet,https://www.guiaa.vet,http://localhost:3000
```

3. **IMPORTANTE**: No debe tener espacios después de las comas
4. Si no existe, agrégalo y **redesplega**

---

### Paso 5: Verificar Logs del Backend en Railway

1. Ve a **Railway Dashboard** → Tu proyecto → **Deployments**
2. Haz clic en el deployment más reciente
3. Ve a **Logs**
4. Intenta hacer login desde el frontend
5. Busca en los logs:
   - ¿Llega la petición al backend?
   - ¿Hay errores de CORS?
   - ¿Hay errores de Supabase?

---

### Paso 6: Verificar que el Endpoint Exista

El endpoint debe estar en `server_simple.py` línea 878:

```python
@app.post("/api/auth/login")
async def login_veterinarian(credentials: VeterinarianLogin):
    ...
```

Verifica que:
- ✅ El decorador sea `@app.post` (no `@app.get`)
- ✅ La ruta sea exactamente `/api/auth/login`
- ✅ El método acepte `VeterinarianLogin` (email y cedula_profesional)

---

## 🔧 Soluciones por Problema

### Problema 1: Backend No Accesible

**Síntoma**: No puedes acceder a `https://api.guiaa.vet/health`

**Soluciones**:
1. Verifica que el backend esté corriendo en Railway
2. Verifica que el dominio personalizado esté configurado en Railway
3. Verifica los registros DNS en Cloudflare

---

### Problema 2: Error CORS

**Síntoma**: En la consola ves `"Access to fetch... has been blocked by CORS policy"`

**Solución**:
1. Agrega `CORS_ALLOW_ORIGINS` en Railway con el valor correcto
2. **Redesplega** el backend después de agregar la variable
3. Verifica que no haya espacios extra en la variable

---

### Problema 3: Error 405 Específico

**Síntoma**: El endpoint responde con 405 pero el backend está accesible

**Posibles causas**:
1. El método HTTP no coincide (debe ser POST)
2. El endpoint está mal configurado
3. Hay un middleware que bloquea la petición

**Solución**:
1. Verifica que el endpoint use `@app.post` (no `@app.get`)
2. Verifica que CORS permita el método POST
3. Revisa los logs del backend para ver qué está pasando

---

### Problema 4: URL Incorrecta

**Síntoma**: El frontend está usando una URL incorrecta

**Solución**:
1. Verifica la variable `REACT_APP_BACKEND_URL` en Vercel
2. Debe ser exactamente: `https://api.guiaa.vet`
3. Redesplega el frontend después de cambiar la variable

---

## 🎯 Checklist Final

- [ ] Backend accesible en `https://api.guiaa.vet/health`
- [ ] Frontend usa la URL correcta (`https://api.guiaa.vet`)
- [ ] Variable `CORS_ALLOW_ORIGINS` configurada en Railway
- [ ] Backend redesplegado después de configurar CORS
- [ ] Endpoint `/api/auth/login` existe y usa `@app.post`
- [ ] Logs del backend muestran que recibe la petición
- [ ] No hay errores de CORS en la consola del navegador

---

## 🆘 Si Nada Funciona

1. **Comparte los logs del backend** de Railway (últimas 50 líneas)
2. **Comparte los errores de la consola** del navegador (F12 → Console)
3. **Comparte el resultado** de probar el endpoint directamente (Paso 3)

Con esa información podré darte una solución específica.

