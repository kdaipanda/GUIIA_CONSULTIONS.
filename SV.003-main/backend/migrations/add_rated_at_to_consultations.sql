-- Migración: Agregar columna rated_at a la tabla consultations
-- Esta columna almacena la fecha/hora en que se calificó una consulta

-- Verificar si la columna ya existe antes de agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'rated_at'
    ) THEN
        -- Agregar la columna como TIMESTAMPTZ (timestamp with time zone) nullable
        ALTER TABLE public.consultations 
        ADD COLUMN rated_at TIMESTAMPTZ;
        
        -- Agregar índice para mejorar las consultas por fecha de calificación
        CREATE INDEX IF NOT EXISTS idx_consultations_rated_at 
        ON public.consultations(rated_at);
        
        RAISE NOTICE 'Columna rated_at agregada exitosamente a la tabla consultations';
    ELSE
        RAISE NOTICE 'La columna rated_at ya existe en la tabla consultations';
    END IF;
END $$;

-- Verificar si la columna rating también existe (por si acaso)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'rating'
    ) THEN
        -- Agregar la columna rating como INTEGER nullable
        ALTER TABLE public.consultations 
        ADD COLUMN rating INTEGER;
        
        -- Agregar constraint para asegurar que rating esté entre 1 y 5
        ALTER TABLE public.consultations 
        ADD CONSTRAINT check_rating_range 
        CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
        
        RAISE NOTICE 'Columna rating agregada exitosamente a la tabla consultations';
    ELSE
        RAISE NOTICE 'La columna rating ya existe en la tabla consultations';
    END IF;
END $$;

