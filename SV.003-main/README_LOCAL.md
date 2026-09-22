# 🏥 Savant Vet - Modo Local Simplificado

Sistema veterinario inteligente funcionando 100% localmente sin dependencias de servicios externos.

## 📋 Requisitos Previos

- **Python 3.11+** - [Descargar](https://www.python.org/downloads/)
- **Node.js 16+** y npm - [Descargar](https://nodejs.org/)
- **MongoDB** (opcional) - Si no lo tienes, el sistema usará almacenamiento en memoria

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Windows)

```bash
# Desde la raíz del proyecto
start-local.bat
```

Este script:
- ✅ Verifica requisitos
- ✅ Instala dependencias
- ✅ Configura archivos .env
- ✅ Inicia backend y frontend automáticamente

### Opción 2: Manual

#### 1. Backend

```bash
# Navegar al directorio backend
cd backend

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements_simple.txt

# Crear archivo .env (si no existe)
copy .env.example .env

# Iniciar servidor
python server_simple.py
```

El backend estará disponible en:
- 🌐 API: http://localhost:8000
- 📖 Documentación: http://localhost:8000/docs

#### 2. Frontend

```bash
# Abrir una nueva terminal
cd frontend

# Instalar dependencias (solo la primera vez)
npm install --legacy-peer-deps

# Crear archivo .env (si no existe)
echo REACT_APP_BACKEND_URL=http://localhost:8000 > .env

# Iniciar aplicación
npm start
```

La aplicación se abrirá en: http://localhost:3000

## 📱 App Android (Capacitor)

Ver guía completa: [`frontend/ANDROID.md`](frontend/ANDROID.md)

```bash
cd frontend
npm run android:build
npm run cap:open
```

Requiere Android Studio. La app usa la API de producción `https://api.guiaa.vet`.

## 🎯 Funcionalidades Disponibles

### ✅ Funcionalidades Completas (Modo Local)

- **Autenticación**
  - ✅ Registro de veterinarios
  - ✅ Login con email y cédula profesional
  - ✅ Autenticación 2FA (código en consola del servidor)
  
- **Consultas Veterinarias**
  - ✅ Crear consultas por categoría de animal
  - ✅ Historial de consultas
  - ✅ Estadísticas (total y del mes)
  - ✅ Formularios específicos por especie
  
- **Membresías**
  - ✅ 3 planes (Básica, Profesional, Premium)
  - ✅ Sistema de pagos simulado
  - ✅ Gestión de consultas disponibles
  
- **Dashboard**
  - ✅ Estadísticas en tiempo real
  - ✅ Consultas recientes
  - ✅ Estado de membresía
  - ✅ Temas claro/oscuro
  - ✅ Notificaciones
  - ✅ Atajos de teclado (Ctrl+K para paleta de comandos)

### ⚠️ Funcionalidades Limitadas (Requieren APIs externas)

- **Análisis con IA**: Los análisis de consultas muestran un mensaje simulado
  - Para habilitar: Configura `EMERGENT_LLM_KEY` en `.env` y usa `server.py`
  
- **Interpretación de Imágenes Médicas**: Función disponible solo visualmente
  - Para habilitar: Requiere API con capacidades de visión
  
- **Clima en Dashboard**: No muestra datos reales
  - Para habilitar: Configura `REACT_APP_WEATHER_API_KEY` en `frontend/.env`
  
- **Pagos Reales**: Sistema simulado localmente
  - Para habilitar: Configura `STRIPE_API_KEY` en `backend/.env`

## 📂 Estructura del Proyecto

```
SV.003-main/
├── backend/
│   ├── .venv/                    # Entorno virtual Python
│   ├── server_simple.py          # Servidor simplificado (SIN emergent)
│   ├── server.py                 # Servidor completo (CON emergent)
│   ├── requirements_simple.txt   # Dependencias básicas
│   ├── requirements.txt          # Dependencias completas
│   ├── .env                      # Configuración (crear desde .env.example)
│   └── emergentintegrations/     # Integraciones externas (no usadas en modo simple)
│
├── frontend/
│   ├── src/
│   │   ├── App.js               # Componente principal
│   │   ├── App.css              # Estilos principales
│   │   ├── ThemeEnhancements.css # Temas y mejoras visuales
│   │   ├── Custom.css           # Estilos personalizados
│   │   └── components/          # Componentes React
│   ├── public/                  # Archivos estáticos
│   ├── package.json             # Dependencias Node
│   └── .env                     # Variables de entorno
│
├── start-local.bat              # Script de inicio automático (Windows)
├── README_LOCAL.md              # Este archivo
└── README.md                    # README original

```

## 🔧 Configuración

### Backend (.env)

```env
# Base de datos (opcional)
MONGO_URL=mongodb://localhost:27017
DB_NAME=vetmed_platform

# Sin MongoDB, el sistema usa memoria (los datos se pierden al reiniciar)
```

### Frontend (.env)

```env
# URL del backend
REACT_APP_BACKEND_URL=http://localhost:8000

# API de clima (opcional)
# REACT_APP_WEATHER_API_KEY=tu_clave_openweathermap
```

## 👨‍⚕️ Uso del Sistema

### 1. Registrar un Veterinario

1. Abre http://localhost:3000
2. Haz clic en "Regístrate"
3. Completa el formulario:
   - Nombre
   - Email
   - Teléfono
   - Cédula profesional
   - Especialidad
   - Años de experiencia
   - Institución
4. Haz clic en "Registrarse"

### 2. Iniciar Sesión

1. En la página principal, haz clic en "Iniciar Sesión"
2. Ingresa:
   - Email
   - Cédula profesional
3. Si tienes 2FA activado:
   - Revisa la consola del servidor backend
   - Ingresa el código de 6 dígitos

### 3. Crear una Consulta

1. En el Dashboard, haz clic en "Nueva Consulta" o presiona `N`
2. Selecciona la categoría del animal
3. Completa el formulario específico de la especie
4. Haz clic en "Enviar Consulta"
5. El análisis se genera automáticamente (simulado en modo local)

### 4. Gestionar Membresía

1. Ve a "Membresía" desde el menú o presiona `M`
2. Elige un plan:
   - **Básica**: 10 consultas/mes
   - **Profesional**: 50 consultas/mes
   - **Premium**: Consultas ilimitadas + análisis de imágenes
3. Selecciona ciclo de facturación (mensual/anual)
4. En modo local, el pago se simula automáticamente

### 5. Atajos de Teclado

- `Ctrl+K` o `Cmd+K`: Abrir paleta de comandos
- `N`: Nueva consulta
- `H`: Historial de consultas
- `M`: Membresía
- `I`: Imágenes médicas (solo Premium)
- `Esc`: Cerrar modales

## 🔍 Solución de Problemas

### Backend no inicia

```bash
# Verificar que Python está instalado
python --version

# Verificar que las dependencias están instaladas
cd backend
.venv\Scripts\activate
pip list

# Reinstalar dependencias
pip install -r requirements_simple.txt
```

### Frontend no inicia

```bash
# Verificar Node.js
node --version
npm --version

# Limpiar caché y reinstalar
cd frontend
rm -rf node_modules
rm package-lock.json
npm install --legacy-peer-deps
```

### Error "Cannot connect to backend"

1. Verifica que el backend esté corriendo en http://localhost:8000
2. Verifica el archivo `frontend/.env`:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8000
   ```
3. Reinicia el frontend después de cambiar `.env`

### Base de datos en memoria se borra

Si no tienes MongoDB instalado, los datos se guardan en memoria y se pierden al reiniciar el servidor.

**Solución**: Instala MongoDB localmente o usa MongoDB Atlas (gratis)

```env
# MongoDB Atlas (nube, gratis)
MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/

# MongoDB Local
MONGO_URL=mongodb://localhost:27017
```

## 🎨 Temas y Personalización

### Cambiar Tema

- Haz clic en el ícono de sol/luna en el header
- O presiona `Ctrl+K` y escribe "tema"

### Personalizar Estilos

Edita los archivos CSS en `frontend/src/`:
- `App.css` - Estilos principales
- `ThemeEnhancements.css` - Temas claro/oscuro
- `Custom.css` - Estilos personalizados

## 📊 Base de Datos

### Con MongoDB

Si tienes MongoDB instalado, los datos persisten entre reinicios:

```bash
# Iniciar MongoDB (Windows)
net start MongoDB

# Ver datos
mongo
use vetmed_platform
show collections
db.veterinarians.find()
```

### Sin MongoDB (Memoria)

El sistema funciona sin MongoDB usando almacenamiento en memoria:
- ✅ No requiere instalación adicional
- ⚠️ Los datos se pierden al reiniciar el servidor
- 💡 Ideal para desarrollo y pruebas

## 🚀 Migrar a Producción

Para usar el sistema con todas las funcionalidades:

1. **Configura MongoDB Atlas** (gratis): https://www.mongodb.com/cloud/atlas
2. **Obtén API keys**:
   - Emergent AI (para análisis): https://emergent.ai
   - Stripe (para pagos): https://stripe.com
   - OpenWeatherMap (clima): https://openweathermap.org
3. **Actualiza .env del backend**:
   ```env
   MONGO_URL=tu_mongodb_atlas_url
   EMERGENT_LLM_KEY=tu_clave
   STRIPE_API_KEY=tu_clave_stripe
   ```
4. **Usa el servidor completo**: `python server.py` (en lugar de `server_simple.py`)

## 📞 Soporte

- 📧 Email: soporte@savantvet.com
- 🐛 Reportar bugs: GitHub Issues
- 📖 Documentación API: http://localhost:8000/docs

## 📝 Licencia

© 2025 Savant Vet. Todos los derechos reservados.

---

**¡Disfruta de Savant Vet en modo local! 🎉**