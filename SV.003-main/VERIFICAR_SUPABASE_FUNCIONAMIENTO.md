# ✅ Verificar que Supabase Funcione Correctamente

## 🎯 Objetivo

Verificar que la base de datos en Supabase esté funcionando, las tablas existan, y las políticas RLS estén configuradas.

---

## 📋 Paso 1: Verificar Conexión a Supabase

### 1.1. Ir a Supabase Dashboard

1. Ve a **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Verifica que tengas:
   - ✅ **Project URL**: `https://xxxxx.supabase.co`
   - ✅ **anon public key**: Una cadena larga
   - ✅ **service_role key**: Para el backend (no la compartas)

---

## 📋 Paso 2: Verificar Tablas en Supabase

### 2.1. Ir a Table Editor

1. En Supabase Dashboard, ve a **Table Editor** (menú lateral)
2. Verifica que existan estas tablas:

**Tablas Requeridas:**
- ✅ `profiles` - Perfiles de usuarios/veterinarios
- ✅ `consultations` - Consultas médicas
- ✅ `medical_images` - Imágenes médicas
- ✅ `payment_transactions` - Transacciones de pago (si usas pagos)

### 2.2. Verificar Estructura de Tablas

Para cada tabla, verifica que tenga las columnas necesarias:

**Tabla `profiles`:**
- `id` (UUID, primary key)
- `email` (text)
- `cedula_profesional` (text)
- `nombre` (text)
- `cedula_verification_status` (text)
- Y otras columnas según tu esquema

**Tabla `consultations`:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key a profiles)
- `payload` (JSONB)
- `status` (text)
- `created_at` (timestamp)
- Y otras columnas según tu esquema

**Tabla `medical_images`:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key a profiles)
- `consultation_id` (UUID, nullable)
- `image_url` (text)
- `created_at` (timestamp)
- Y otras columnas según tu esquema

---

## 📋 Paso 3: Verificar Políticas RLS (Row Level Security)

### 3.1. Verificar que RLS Esté Habilitado

1. En Supabase Dashboard, ve a **Authentication** → **Policies**
2. O ve a **SQL Editor** y ejecuta:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'consultations', 'medical_images');
```

**Resultado esperado**: `rowsecurity` debe ser `true` para todas las tablas.

### 3.2. Verificar Políticas Existentes

En **SQL Editor**, ejecuta:

```sql
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'consultations', 'medical_images')
ORDER BY tablename, policyname;
```

**Resultado esperado**: Deberías ver políticas para SELECT, INSERT, UPDATE, DELETE.

---

## 📋 Paso 4: Probar Consultas Básicas

### 4.1. Probar SELECT (desde SQL Editor)

```sql
-- Contar perfiles
SELECT COUNT(*) FROM profiles;

-- Ver algunos perfiles (si existen)
SELECT id, email, nombre, cedula_profesional 
FROM profiles 
LIMIT 5;

-- Contar consultas
SELECT COUNT(*) FROM consultations;

-- Contar imágenes médicas
SELECT COUNT(*) FROM medical_images;
```

**Resultados esperados:**
- ✅ Las consultas se ejecutan sin errores
- ✅ Pueden devolver 0 si no hay datos, pero no deben dar error

---

### 4.2. Probar desde el Backend

Si tienes el backend corriendo, puedes probar:

1. Ve a `https://api.guiaa.vet/docs`
2. Prueba el endpoint `/health` (debería mostrar que la base de datos es "Supabase")
3. Prueba otros endpoints que usen Supabase

---

## 📋 Paso 5: Verificar Funciones de Supabase

### 5.1. Verificar Función get_veterinarian_owner

Si usas la función `get_veterinarian_owner`, verifica que exista:

```sql
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'get_veterinarian_owner';
```

**Resultado esperado**: Debe existir la función.

### 5.2. Verificar Permisos de la Función

```sql
SELECT 
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' 
  AND routine_name = 'get_veterinarian_owner';
```

**Resultado esperado**: Debe tener permisos para `public` o `authenticated`.

---

## 📋 Paso 6: Verificar Índices

### 6.1. Ver Índices Existentes

```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'consultations', 'medical_images')
ORDER BY tablename, indexname;
```

**Resultado esperado**: Deberías ver índices en:
- `user_id` en `consultations`
- `user_id` en `medical_images`
- `created_at` en ambas tablas (para optimización)

---

## 📋 Paso 7: Probar Autenticación

### 7.1. Verificar que Auth Funcione

1. En Supabase Dashboard, ve a **Authentication** → **Users**
2. Verifica que puedas ver usuarios (si existen)
3. O crea un usuario de prueba desde el frontend

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: Tablas No Existen

**Solución**: Necesitas ejecutar las migraciones de Supabase. Busca archivos `.sql` en `backend/supabase_migrations/` y ejecútalos en el SQL Editor de Supabase.

---

### Problema 2: RLS Bloquea Todas las Consultas

**Solución**: Verifica que existan políticas RLS. Si no existen, ejecuta el script `optimize_rls_policies.sql` que creamos anteriormente.

---

### Problema 3: Función No Tiene Permisos

**Solución**: Ejecuta:

```sql
GRANT EXECUTE ON FUNCTION public.get_veterinarian_owner(uuid) TO public;
```

---

### Problema 4: No Hay Índices

**Solución**: Ejecuta la parte de índices del script `optimize_rls_policies.sql`:

```sql
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON public.consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_images_user_id ON public.medical_images(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_images_created_at ON public.medical_images(created_at DESC);
```

---

## 📋 Checklist de Verificación

- [ ] Conexión a Supabase funciona (Dashboard accesible)
- [ ] Tabla `profiles` existe y tiene las columnas correctas
- [ ] Tabla `consultations` existe y tiene las columnas correctas
- [ ] Tabla `medical_images` existe y tiene las columnas correctas
- [ ] RLS está habilitado en todas las tablas
- [ ] Políticas RLS existen para SELECT, INSERT, UPDATE, DELETE
- [ ] Consultas básicas funcionan (SELECT COUNT)
- [ ] Función `get_veterinarian_owner` existe (si la usas)
- [ ] Función tiene permisos correctos
- [ ] Índices existen en `user_id` y `created_at`
- [ ] Autenticación funciona (puedes ver usuarios)

---

## 🆘 Si Encuentras Problemas

Comparte:
1. **¿Qué tablas existen** en tu proyecto de Supabase?
2. **¿Qué errores aparecen** al ejecutar las consultas?
3. **¿RLS está habilitado** en las tablas?

Con esa información podré ayudarte a resolver cualquier problema específico.

---

## 🔗 Enlaces Útiles

- **Supabase Dashboard**: https://supabase.com/dashboard
- **SQL Editor**: En Supabase Dashboard → SQL Editor
- **Table Editor**: En Supabase Dashboard → Table Editor
- **Documentación Supabase**: https://supabase.com/docs

