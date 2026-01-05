# 🚀 Ejecutar Optimización RLS - Paso a Paso

## 📋 Paso 1: Abrir Supabase SQL Editor

1. Ve a **Supabase Dashboard**: https://supabase.com
2. Inicia sesión si es necesario
3. Selecciona tu proyecto
4. En el menú lateral izquierdo, haz clic en **"SQL Editor"**
5. Haz clic en **"New query"** o busca un área de texto para escribir SQL

---

## 📋 Paso 2: Leer el Script

1. Abre el archivo: `SV.003-main/backend/supabase_migrations/optimize_rls_policies.sql`
2. **Lee todo el contenido** para entender qué hace
3. El script es seguro: usa `IF NOT EXISTS` para evitar errores
4. **Optimización clave**: Usa comparaciones directas de UUID (`user_id = auth.uid()`) que aprovechan los índices mejor que las conversiones a texto

---

## 📋 Paso 3: Copiar y Pegar el Script

1. **Copia TODO el contenido** del archivo `optimize_rls_policies.sql`
2. **Pégalo** en el SQL Editor de Supabase
3. Revisa que se haya pegado correctamente

---

## 📋 Paso 4: Ejecutar el Script

1. Haz clic en el botón **"Run"** o **"Execute"** (normalmente está en la parte inferior derecha)
2. Espera a que termine la ejecución (puede tardar unos segundos)
3. Verás los resultados en la parte inferior

---

## 📋 Paso 5: Verificar Resultados

El script incluye consultas de verificación al final. Deberías ver:

### Resultados Esperados:

1. **Índices creados**: Lista de índices en `consultations` y `medical_images`
2. **Políticas creadas**: Lista de políticas RLS optimizadas

### Si hay Errores:

- **"already exists"**: Normal, significa que ya existía (el script usa `IF NOT EXISTS`)
- **"permission denied"**: Verifica que tengas permisos de administrador
- **Otros errores**: Copia el mensaje de error y te ayudo a resolverlo

---

## 📋 Paso 6: Verificar en Supabase Dashboard

Después de unos minutos:

1. Ve a **Database** → **Advisors** o **Performance**
2. Verifica que los problemas de rendimiento hayan disminuido
3. Los cambios pueden tardar unos minutos en reflejarse

---

## 🔍 Verificación Manual (Opcional)

Si quieres verificar manualmente que todo está bien:

### Ver Índices Creados:

```sql
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('consultations', 'medical_images')
ORDER BY tablename, indexname;
```

### Ver Políticas Creadas:

```sql
SELECT 
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('consultations', 'medical_images')
ORDER BY tablename, policyname;
```

---

## ⚠️ Si Tienes Políticas Antiguas

Si ves políticas duplicadas (antiguas + nuevas):

1. **Primero verifica** que las nuevas políticas funcionen
2. **Prueba** las funcionalidades de tu aplicación
3. **Luego** puedes eliminar las políticas antiguas:

```sql
-- Ver políticas existentes
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename IN ('consultations', 'medical_images');

-- Eliminar políticas antiguas (ajusta los nombres según lo que veas)
-- DROP POLICY IF EXISTS "nombre_politica_antigua" ON public.consultations;
```

---

## ✅ Checklist

- [ ] Script copiado completamente
- [ ] Script pegado en Supabase SQL Editor
- [ ] Script ejecutado sin errores críticos
- [ ] Índices creados (verificado en resultados)
- [ ] Políticas creadas (verificado en resultados)
- [ ] Funcionalidades probadas en la aplicación
- [ ] Problemas de rendimiento verificados en Supabase

---

## 🆘 Si Algo Sale Mal

### Error: "permission denied"
- Verifica que estés usando una cuenta con permisos de administrador
- O ejecuta solo la parte de índices primero

### Error: "relation already exists"
- Normal, significa que el índice/política ya existe
- El script usa `IF NOT EXISTS` para evitar esto, pero algunos pueden fallar

### Las políticas no funcionan
- Verifica que RLS esté habilitado: `ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;`
- Verifica que las políticas estén activas en `pg_policies`

---

**¿Listo?** Abre Supabase SQL Editor y ejecuta el script. Si encuentras algún error, compártelo y te ayudo a resolverlo.

