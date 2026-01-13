# Agregar Columna rated_at a Supabase

## Problema
El código intenta guardar el campo `rated_at` en la tabla `consultations` cuando un usuario califica una consulta, pero esta columna no existe en la base de datos, causando el error:
```
Could not find the 'rated_at' column of 'consultations' in the schema cache
```

## Solución

### Opción 1: Ejecutar SQL en Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase Dashboard: https://supabase.com/dashboard
2. Navega a **SQL Editor** en el menú lateral
3. Ejecuta el siguiente SQL:

```sql
-- Agregar columna rated_at a la tabla consultations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'rated_at'
    ) THEN
        ALTER TABLE public.consultations 
        ADD COLUMN rated_at TIMESTAMPTZ;
        
        CREATE INDEX IF NOT EXISTS idx_consultations_rated_at 
        ON public.consultations(rated_at);
        
        RAISE NOTICE 'Columna rated_at agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna ya existe';
    END IF;
END $$;

-- También verificar y agregar rating si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE public.consultations 
        ADD COLUMN rating INTEGER;
        
        ALTER TABLE public.consultations 
        ADD CONSTRAINT check_rating_range 
        CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
        
        RAISE NOTICE 'Columna rating agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna rating ya existe';
    END IF;
END $$;
```

### Opción 2: Usar Table Editor (Alternativa)

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Table Editor** en el menú lateral
3. Selecciona la tabla `consultations`
4. Haz clic en **Add Column** (Agregar Columna)
5. Configura la columna `rated_at`:
   - **Name**: `rated_at`
   - **Type**: `timestamptz` (timestamp with time zone)
   - **Default value**: (vacío)
   - **Is nullable**: YES (checked)
6. Haz clic en **Save**
7. Repite para la columna `rating`:
   - **Name**: `rating`
   - **Type**: `int4` (Integer)
   - **Default value**: (vacío)
   - **Is nullable**: YES (checked)
8. Haz clic en **Save**

### Verificación

Después de agregar las columnas, puedes verificar que existen ejecutando:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'consultations'
AND column_name IN ('rated_at', 'rating')
ORDER BY column_name;
```

Deberías ver:
- `rated_at`: timestamptz, nullable
- `rating`: integer, nullable

## Notas

- La columna `rated_at` almacena la fecha y hora en que se calificó una consulta
- La columna `rating` almacena la calificación (1-5)
- Ambas columnas son opcionales (nullable) porque no todas las consultas tienen calificación
- Se agregó un índice en `rated_at` para mejorar las consultas por fecha de calificación
- Se agregó un constraint para asegurar que `rating` esté entre 1 y 5

