# Verificación de Integración con Productos de Stripe

## Productos en Stripe

Tienes estos productos configurados en Stripe:

### Membresías Mensuales:
1. **Básico Mensual** (prod_Tkyhwtc3i3FYCc)
   - Consultas: 30 mensuales
   - Para perros y gatos

2. **Profesional Mensual** (prod_Tl0PjbQF0p1y5d)
   - Consultas: 35 mensuales
   - Todas las especies

3. **Premium Mensual** (prod_Tl0SrURr1CLGkd)
   - Consultas: 150 mensuales
   - Todas las especies + análisis de laboratorio

### Membresías Anuales:
4. **Básico Anual** (prod_Tl0XHV0d7lpeCh)
   - Consultas: 300 anuales
   - Para perros y gatos

5. **Profesional Anual** (prod_Tl0ZcYwvyujM4P)
   - Consultas: 350 anuales
   - Todas las especies

6. **Premium Anual** (prod_Tl0cuUrxfLTPmj)
   - Consultas: 1500 anuales
   - Todas las especies + análisis de laboratorio

### Créditos:
7. **10 Consultas Extras** (prod_Tl0fjBTflSJtHh)
   - 10 consultas adicionales

## Estado Actual del Código

El backend actualmente:
- ✅ Crea productos dinámicamente usando `price_data`
- ✅ Usa `price_data` en lugar de `price_id`
- ❌ NO usa los productos que ya tienes en Stripe

## Cómo Funciona Actualmente

1. Usuario selecciona un paquete (basic/professional/premium)
2. Backend busca el paquete en MEMBERSHIP_PACKAGES
3. Crea un producto nuevo en Stripe con `price_data`
4. Genera sesión de checkout

## Para Usar tus Productos Existentes

Necesitarías:

1. **Obtener los Price IDs de Stripe**:
   - Ve a Stripe Dashboard → Products
   - Para cada producto, copia el Price ID (price_xxxxx)
   - Los productos pueden tener múltiples precios (mensual/anual)

2. **Configurar Price IDs en el backend**:
   - Agregar mapeo de package_key + billing_cycle → price_id
   - Modificar código para usar `price` en lugar de `price_data`

3. **Ventajas de usar productos existentes**:
   - Más control desde Stripe Dashboard
   - Reportes más precisos
   - Facilita cambios de precios
   - Mejor integración con webhooks

## Verificación Rápida

Para verificar que los pagos funcionan actualmente:

1. **Test de Stripe**:
   ```
   GET https://tu-dominio/api/stripe/config
   ```

2. **Test de Checkout** (simulado):
   ```
   POST https://tu-dominio/api/payments/checkout/session
   ```

3. **Verificar en Stripe Dashboard**:
   - Ve a Payments → Verifica que se crean sesiones
   - Checkout Sessions → Verifica que se crean correctamente

## Recomendación

El código actual **funciona correctamente** usando productos dinámicos. Si quieres usar tus productos existentes, necesitarías hacer cambios significativos en el código.

¿Quieres que:
1. **Mantenga el sistema actual** (productos dinámicos) - Funciona bien
2. **Modifique para usar tus productos** - Requiere cambios en el código

