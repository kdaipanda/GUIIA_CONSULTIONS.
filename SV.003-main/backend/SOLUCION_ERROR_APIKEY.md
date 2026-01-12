# Solución: Error "API Key no configurada" en Railway

## Pasos para Verificar y Solucionar

### 1. Verificar que la variable esté en Railway

1. Ve a https://railway.app
2. Selecciona tu proyecto
3. Selecciona el servicio (backend)
4. Ve a la pestaña **"Variables"**
5. Busca `ANTHROPIC_API_KEY` en la lista

### 2. Si NO está en la lista:

1. Haz clic en **"+ New Variable"**
2. Nombre: `ANTHROPIC_API_KEY` (EXACTO, sin espacios)
3. Valor: Tu clave completa que empieza con `sk-ant-api...`
4. Haz clic en **"Add"**
5. El servicio se reiniciará automáticamente

### 3. Si SÍ está en la lista pero sigue el error:

#### Verificar el nombre:
- Debe ser exactamente: `ANTHROPIC_API_KEY`
- No debe tener espacios al inicio o final
- Debe estar en mayúsculas

#### Verificar el valor:
- Debe empezar con `sk-ant-api...`
- No debe tener comillas alrededor
- No debe tener espacios al inicio o final
- Debe ser la clave completa (108 caracteres aproximadamente)

#### Reiniciar el servicio:
1. Ve a la pestaña **"Settings"**
2. Haz clic en **"Restart"**
3. Espera 1-2 minutos

### 4. Verificar que funciona

Una vez configurado, visita estos endpoints:

#### Diagnóstico completo:
```
https://tu-dominio-railway.app/api/config/diagnostics
```

Busca en la respuesta:
```json
{
  "anthropic": {
    "configured": true,
    "in_system_env": true,
    "in_loaded_env": true,
    "client_initialized": true
  }
}
```

#### Test de Claude:
```
https://tu-dominio-railway.app/api/test/claude
```

Debería responder con:
```json
{
  "api_key_configured": true,
  "test_status": "success",
  "test_response": "OK"
}
```

## Problemas Comunes

### "configured: false"
- La variable no está en Railway o tiene un nombre incorrecto
- Solución: Agrega/edita la variable en Railway

### "in_system_env: false"
- Railway no está pasando la variable al proceso
- Solución: Reinicia el servicio en Railway

### "in_loaded_env: false" pero "in_system_env: true"
- La variable está en Railway pero no se carga
- Solución: Verifica que no haya espacios en el nombre o valor

### "client_initialized: false"
- La API key está configurada pero el cliente no se inicializó
- Solución: Verifica que la API key sea válida y tenga el formato correcto

## Verificar Logs en Railway

1. Ve a tu servicio en Railway
2. Pestaña **"Deployments"**
3. Selecciona el último deploy
4. Haz clic en **"View Logs"**
5. Busca mensajes que contengan "ANTHROPIC" o "API_KEY"

Si ves errores, cópialos y revisa qué está pasando.

## Contacto

Si después de seguir estos pasos sigue sin funcionar:
1. Verifica los logs en Railway
2. Usa el endpoint `/api/config/diagnostics` para ver el estado exacto
3. Verifica que la API key de Anthropic sea válida y esté activa


