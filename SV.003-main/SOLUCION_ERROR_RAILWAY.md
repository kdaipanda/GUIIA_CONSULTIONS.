# 🔧 Solución: Error "Railpack could not determine how to build the app"

## 🎯 El Problema

Railway no está detectando que tu proyecto es Python porque está buscando archivos en el directorio raíz del repositorio, no en `SV.003-main/backend`.

## ✅ Solución: Configurar Root Directory en Railway

### Paso 1: Ir a la Configuración del Servicio

1. En Railway, ve a tu proyecto
2. Haz clic en el servicio (el que está fallando)
3. Ve a la pestaña **"Settings"** (Configuración)

### Paso 2: Configurar Root Directory

1. Busca la sección **"Root Directory"** o **"Source"**
2. Cambia el valor a: `SV.003-main/backend`
   - ⚠️ IMPORTANTE: Debe ser exactamente `SV.003-main/backend` (con la barra `/`)
3. Guarda los cambios

### Paso 3: Volver a Hacer Deploy

1. Railway debería detectar automáticamente los cambios
2. O ve a **"Deployments"** y haz clic en **"Redeploy"** o **"Deploy"**

---

## 📝 Archivos Creados (Ya los agregué al proyecto)

He creado estos archivos en `backend/` para ayudar a Railway a detectar Python:

1. **`runtime.txt`** - Especifica la versión de Python (3.11.9)
2. **`nixpacks.toml`** - Configuración explícita para Nixpacks

Estos archivos ya están en el repositorio, pero necesitas hacer commit y push:

```bash
git add SV.003-main/backend/runtime.txt SV.003-main/backend/nixpacks.toml
git commit -m "Agregar archivos de configuración para Railway"
git push origin main
```

---

## 🔍 Verificación

Después de configurar el Root Directory, Railway debería:

1. ✅ Detectar Python automáticamente
2. ✅ Encontrar `requirements_simple.txt`
3. ✅ Instalar las dependencias
4. ✅ Ejecutar el servidor con uvicorn

---

## 📸 Ubicación en Railway Dashboard

```
Railway Dashboard
  └── Tu Proyecto
      └── Tu Servicio
          └── Settings (⚙️)
              └── Source / Root Directory
                  └── Cambiar a: SV.003-main/backend
```

---

## 🆘 Si Aún No Funciona

### Opción 1: Verificar que el Root Directory está bien

Asegúrate de que el valor sea exactamente:
```
SV.003-main/backend
```

NO debe ser:
- `backend` (sin el prefijo)
- `SV.003-main\backend` (con backslash)
- `/SV.003-main/backend` (con barra inicial)

### Opción 2: Verificar la Estructura

En Railway, verifica que los archivos se ven así después de configurar Root Directory:
- `requirements_simple.txt` ✓
- `server_simple.py` ✓
- `railway.json` ✓
- `Procfile` ✓

### Opción 3: Usar Build Command Manual

En Railway Settings → Deploy, puedes intentar:

**Build Command:**
```bash
pip install -r requirements_simple.txt
```

**Start Command:**
```bash
uvicorn server_simple:app --host 0.0.0.0 --port $PORT
```

---

## ✅ Checklist

- [ ] Root Directory configurado a `SV.003-main/backend`
- [ ] Cambios guardados en Railway
- [ ] Deploy iniciado (automático o manual)
- [ ] Logs muestran detección de Python
- [ ] Build exitoso

---

**El paso más importante es configurar el Root Directory correctamente en Railway.**

