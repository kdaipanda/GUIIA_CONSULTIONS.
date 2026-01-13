-- Migración: Agregar columna cedula_skip_count a la tabla profiles
-- Esta columna permite rastrear cuántas veces un usuario ha pospuesto la verificación de cédula (máximo 3)

-- Verificar si la columna ya existe antes de agregarla
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

