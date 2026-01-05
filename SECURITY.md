# Política de Seguridad

## Versiones Soportadas

Utilizamos las siguientes versiones de nuestro proyecto y proporcionamos actualizaciones de seguridad:

| Versión | Soportada          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reportar una Vulnerabilidad

Si descubres una vulnerabilidad de seguridad, por favor **NO** crees un issue público. En su lugar, sigue estos pasos:

1. **Email de Seguridad**: Envía un email a `k.daipanda@gmail.com` con el asunto `[SECURITY] Descripción breve de la vulnerabilidad`

2. **Información a Incluir**:
   - Descripción detallada de la vulnerabilidad
   - Pasos para reproducir el problema
   - Impacto potencial de la vulnerabilidad
   - Sugerencias de mitigación (si las tienes)

3. **Tiempo de Respuesta**:
   - Nos comprometemos a responder dentro de **48 horas** después de recibir tu reporte
   - Evaluaremos el reporte y te mantendremos informado sobre el progreso
   - Trabajaremos para resolver vulnerabilidades críticas lo antes posible

4. **Reconocimiento**:
   - Si lo deseas, te reconoceremos públicamente en nuestros release notes (siempre que sea apropiado)
   - Respetaremos tu privacidad si prefieres permanecer anónimo

## Buenas Prácticas de Seguridad

Este proyecto maneja información sensible de salud veterinaria. Al reportar vulnerabilidades, ten en cuenta:

- **Datos Sensibles**: Este sistema maneja información médica de animales
- **Autenticación**: Se utiliza Supabase Auth para la autenticación de usuarios
- **Base de Datos**: Se implementa Row Level Security (RLS) para proteger los datos
- **APIs**: El backend utiliza claves de servicio que nunca deben exponerse en el frontend

## Áreas de Interés Especial

Estamos especialmente interesados en vulnerabilidades relacionadas con:

- Exposición de datos sensibles (información médica)
- Bypass de autenticación o autorización
- Inyección SQL o NoSQL
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Exposición de claves API o secretos
- Problemas de configuración de seguridad en Supabase/RLS

## Compromiso

Nos tomamos la seguridad en serio. Toda vulnerabilidad reportada será:

1. Investigada cuidadosamente
2. Priorizada según su severidad
3. Corregida de manera responsable
4. Comunicada a los usuarios afectados cuando sea apropiado

Gracias por ayudar a mantener este proyecto seguro para todos.
