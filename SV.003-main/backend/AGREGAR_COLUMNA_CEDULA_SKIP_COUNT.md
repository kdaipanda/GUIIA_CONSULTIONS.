# Agregar Columna cedula_skip_count a Supabase

## Problema
El código intenta guardar el campo `cedula_skip_count` en la tabla `profiles`, pero esta columna no existe en la base de datos, causando el error:
```
Could not find the 'cedula_skip_count' column of 'profiles' in the schema cache
```

## Solución

### Opción 1: Ejecutar SQL en Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase Dashboard: https://supabase.com/dashboard
2. Navega a **SQL Editor** en el menú lateral
3. Ejecuta el siguiente SQL:

```sql
-- Agregar columna cedula_skip_count a la tabla profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'cedula_skip_count'
    ) THEN
        -- Agregar la columna como INTEGER con valor por defecto 0
        ALTER TABLE public.profiles 
        ADD COLUMN cedula_skip_count INTEGER DEFAULT 0 NOT NULL;
        
        -- Actualizar todos los registros existentes para que tengan 0
        UPDATE public.profiles 
        SET cedula_skip_count = 0 
        WHERE cedula_skip_count IS NULL;
        
        RAISE NOTICE 'Columna cedula_skip_count agregada exitosamente a la tabla profiles';
    ELSE
        RAISE NOTICE 'La columna cedula_skip_count ya existe en la tabla profiles';
    END IF;
END $$;
```

### Opción 2: Usar Table Editor (Alternativa)

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Table Editor** en el menú lateral
3. Selecciona la tabla `profiles`
4. Haz clic en **Add Column** (Agregar Columna)
5. Configura la columna:
   - **Name**: `cedula_skip_count`
   - **Type**: `int4` (Integer)
   - **Default value**: `0`
   - **Is nullable**: NO (unchecked)
6. Haz clic en **Save**

### Verificación

Después de agregar la columna, puedes verificar que existe ejecutando:

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'cedula_skip_count';
```

Deberías ver:
- `column_name`: cedula_skip_count
- `data_type`: integer
- `column_default`: 0
- `is_nullable`: NO

## Notas

- Esta columna permite rastrear cuántas veces un usuario ha pospuesto la verificación de cédula
- El valor máximo permitido es 3 (definido en el código)
- El valor por defecto es 0 (sin posposiciones)
- Todos los usuarios existentes se actualizarán automáticamente a 0

