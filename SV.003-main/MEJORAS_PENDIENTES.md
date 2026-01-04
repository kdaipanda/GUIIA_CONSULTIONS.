# Mejoras Pendientes de SV.00 para Aplicar a SV.003

## ✅ Mejoras Identificadas en SV.00

### 1. **Sistema de Autenticación 2FA**
- Login con verificación de dos factores
- Estado `pending_2fa` y manejo de `challengeNonce`
- Endpoint: `/api/auth/verify-2fa`
- Formulario de verificación con código de 6 dígitos
- Función `handleVerify2FA()` y `resetToLogin()`

**Archivos afectados:**
- `LoginPage` component

**Código relevante:**
```javascript
const [pending2FA, setPending2FA] = useState(false);
const [challengeNonce, setChallengeNonce] = useState(null);
const [twoFactorCode, setTwoFactorCode] = useState('');
const [verifying2FA, setVerifying2FA] = useState(false);

// Check if 2FA is required
if (vetData.status === 'pending_2fa' && vetData.nonce) {
  setChallengeNonce(vetData.nonce);
  setPending2FA(true);
  setLoading(false);
  return;
}
```

---

### 2. **Dashboard Mejorado con Múltiples Funcionalidades**

#### 2.1 Widget de Clima
- Integración con OpenWeatherMap API
- Coordenadas configurables (CDMX por defecto)
- Estado de carga y error
- Visualización en tarjeta de estadísticas

**Constante necesaria:**
```javascript
const WEATHER_COORDS = {
  lat: 19.4326,
  lon: -99.1332,
  label: 'Ciudad de México'
};
```

**Función:**
```javascript
const loadWeatherData = async () => {
  setWeatherLoading(true);
  try {
    const apiKey = '8149f4e566a3c8e71872e864ad6604ae';
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${WEATHER_COORDS.lat}&lon=${WEATHER_COORDS.lon}&appid=${apiKey}&units=metric&lang=es`
    );
    if (response.ok) {
      const data = await response.json();
      setWeatherData(data);
    }
  } catch (error) {
    console.error('Error loading weather:', error);
  } finally {
    setWeatherLoading(false);
  }
};
```

#### 2.2 Sistema de Notificaciones
- Panel deslizante de notificaciones
- Badge con contador de notificaciones no leídas
- Click outside para cerrar
- Estados: read/unread, tipos: reminder, info, resource, membership
- Timestamps formateados

**Estados necesarios:**
```javascript
const [notifications, setNotifications] = useState([]);
const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false);
const notificationPanelRef = useRef(null);
const notificationToggleRef = useRef(null);
```

#### 2.3 Modo Oscuro / Claro (Theme Switcher)
- Toggle entre tema claro y oscuro
- Persistencia en localStorage
- Detección de preferencia del sistema
- Atributo `data-theme` en documentElement

**Estados y funciones:**
```javascript
const [theme, setTheme] = useState('light');

// Init from storage or system preference
useEffect(() => {
  const stored = localStorage.getItem('sv_theme');
  const prefersDark = window.matchMedia && 
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = stored || (prefersDark ? 'dark' : 'light');
  setTheme(initial);
  document.documentElement.setAttribute('data-theme', initial);
}, []);

const toggleTheme = () => {
  setTheme(t => t === 'dark' ? 'light' : 'dark');
};
```

#### 2.4 Atajos de Teclado
- `N` - Nueva consulta
- `H` - Historial
- `I` - Imágenes médicas (Premium)
- `M` - Membresía
- No activar cuando se está escribiendo en inputs

**Implementación:**
```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
      document.activeElement?.tagName
    );
    if (isTyping) return;
    
    const key = e.key.toLowerCase();
    if (key === 'n') setView('new-consultation');
    else if (key === 'h') setView('consultation-history');
    else if (key === 'i' && veterinarian.membership_type?.toLowerCase() === 'premium') {
      setView('medical-images');
    }
    else if (key === 'm') setView('membership');
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [setView, veterinarian]);
```

#### 2.5 Hints de Atajos de Teclado
- Mostrar hints en el dashboard
- Usar elemento `<kbd>` para las teclas
- Condicional para funciones premium

---

### 3. **Sistema de Toasts/Notificaciones Temporales**
- Notificaciones toast para feedback del usuario
- Auto-dismiss después de 3-5 segundos
- Tipos: success, error, info, warning
- Stack de múltiples toasts

**Estados:**
```javascript
const [toasts, setToasts] = useState([]);

const showToast = (message, type = 'info') => {
  const id = Date.now();
  setToasts(prev => [...prev, { id, message, type }]);
  setTimeout(() => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, 3000);
};
```

---

### 4. **Command Palette (Ctrl/Cmd+K)**
- Búsqueda rápida de comandos
- Navegación con teclado (flechas arriba/abajo)
- Filtrado dinámico
- Cierre con Escape

**Estados:**
```javascript
const [isCmdkOpen, setCmdkOpen] = useState(false);
const [cmdkQuery, setCmdkQuery] = useState('');
const [cmdkActiveIndex, setCmdkActiveIndex] = useState(0);
```

---

### 5. **Mejoras en Registro**
- Checkbox de aceptación de términos y condiciones
- Validación de aceptación antes de submit
- Estado `acceptedTerms`

**Código:**
```javascript
const [acceptedTerms, setAcceptedTerms] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!acceptedTerms) {
    setError('Debes aceptar los términos y la política de privacidad para registrarte.');
    return;
  }
  // ... resto del código
};
```

---

### 6. **Login con Diseño Oscuro**
- Clases CSS especiales: `login-dark`, `login-dark-container`
- Avatar con icono
- Campos con mejor accesibilidad (labels con sr-only)
- Mejor UX visual

---

### 7. **Modal de Privacidad en Dashboard**
- Mostrar al primer uso
- Persistencia en localStorage: `sv_privacy_accepted`
- Botón de aceptar

**Código:**
```javascript
const [showPrivacyModal, setShowPrivacyModal] = useState(false);

useEffect(() => {
  const privacyAccepted = localStorage.getItem('sv_privacy_accepted');
  setShowPrivacyModal(!privacyAccepted);
}, []);
```

---

### 8. **Estadísticas con Tendencias**
- Mostrar tendencia (↑ ↓) en las tarjetas de estadísticas
- Porcentaje de cambio
- Series de datos históricos

**Estructura:**
```javascript
const [stats, setStats] = useState({
  consultations: {
    value: 0,
    trend: 0,  // percentage
    icon: '📊',
    variant: 'blue'
  },
  thisMonth: {
    value: 0,
    trend: 0,
    icon: '📅',
    variant: 'green'
  },
  pending: {
    value: 0,
    trend: 0,
    icon: '⏱️',
    variant: 'amber'
  }
});
```

---

### 9. **Fallback de Desarrollo Offline**
- En LoginPage: si falla el fetch (NetworkError)
- Crear usuario offline temporal
- Solo para desarrollo, no para producción

**Código:**
```javascript
if (/Failed to fetch|NetworkError|TypeError/i.test(msg)) {
  const offlineVet = {
    id: 'offline-dev',
    nombre: formData.email?.split('@')[0] || 'Veterinario (Offline)',
    email: formData.email || 'dev@offline.local',
  };
  login({ veterinarian: offlineVet, token: 'dev-offline-token' });
  setView('dashboard');
}
```

---

### 10. **Better Error Handling**
- Validación de Content-Type en respuestas
- Manejo de errores de proxy
- Mensajes de error más descriptivos

**Código:**
```javascript
const contentType = response.headers.get('content-type') || '';
if (!response.ok) {
  let message = 'Error en el registro';
  try {
    if (contentType.includes('application/json')) {
      const errJson = await response.json();
      message = errJson.detail || JSON.stringify(errJson);
    } else {
      const errText = await response.text();
      message = errText.toLowerCase().includes('proxy') 
        ? 'Error de proxy: backend inaccesible' 
        : errText.slice(0, 200);
    }
  } catch {
    message = 'Error en el registro (respuesta inválida)';
  }
  throw new Error(message);
}
```

---

## 🚫 NO Aplicar (Corrupto/Problemático)

1. **Formularios de especies personalizados** - SV.00 los tiene deshabilitados
2. **Animaciones GSAP/Lenis** - Pueden causar conflictos
3. **Componentes externos** (CategoryCard, CanineFelineStep1) - No existen en SV.003
4. **NewConsultation completo de SV.00** - Está marcado como deshabilitado (12,300 líneas removidas)

---

## 📋 Plan de Implementación Sugerido

### Fase 1: Autenticación y Seguridad
- [ ] Implementar 2FA en LoginPage
- [ ] Mejorar manejo de errores en auth

### Fase 2: Dashboard Core
- [ ] Agregar sistema de notificaciones
- [ ] Implementar theme switcher
- [ ] Agregar widget de clima

### Fase 3: UX Improvements
- [ ] Atajos de teclado
- [ ] Sistema de toasts
- [ ] Command Palette (Ctrl+K)
- [ ] Hints de atajos

### Fase 4: Polish
- [ ] Modal de privacidad
- [ ] Estadísticas con tendencias
- [ ] Mejoras visuales en login
- [ ] Checkbox de términos en registro

---

## 🎨 CSS Adicional Necesario

Crear archivos CSS adicionales o agregar estilos para:
- `.login-dark`, `.login-dark-container`
- `.notification-panel`, `.notification-badge`
- `.theme-toggle`
- `.toast-container`, `.toast`
- `.command-palette`, `.cmdk-container`
- `.keyboard-hint`, `kbd` styles
- `[data-theme="dark"]` variables

---

## 🔑 Variables de Entorno Nuevas

```env
# OpenWeatherMap API Key (para clima)
REACT_APP_WEATHER_API_KEY=8149f4e566a3c8e71872e864ad6604ae
```

---

## 📝 Notas Importantes

1. **SV.00 tiene código deshabilitado**: Líneas 1788-14036 están comentadas/removidas
2. **AUTH_API_BASE no está definida**: Se usa pero no se declara, revisar configuración
3. **Mantener la estructura de SV.003**: Los formularios de especies funcionan bien
4. **Testing necesario**: Cada mejora debe probarse individualmente
5. **Versión de React**: Verificar compatibilidad de hooks y refs

---

## ✨ Beneficios de Aplicar Estas Mejoras

1. **Mejor seguridad** con 2FA
2. **Mejor UX** con notificaciones, toasts y atajos de teclado
3. **Mejor accesibilidad** con modo oscuro
4. **Mejor feedback** con información de clima y estadísticas
5. **Desarrollo más rápido** con Command Palette y atajos
6. **Mejor onboarding** con modal de privacidad y hints

---

## 🔄 Estado Actual

- **SV.003**: Base funcional con formularios de especies completos
- **SV.00**: Mejoras de UX pero formularios deshabilitados/corruptos
- **Objetivo**: Combinar lo mejor de ambos

---

**Fecha de análisis**: 2024
**Analista**: AI Assistant
**Prioridad**: Alta para Fase 1-2, Media para Fase 3-4