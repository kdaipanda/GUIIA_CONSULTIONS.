-- Calificación 1-5 de consultas CDS (historial + pantalla de resultado).
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS rating smallint,
  ADD COLUMN IF NOT EXISTS rated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'consultations_rating_range'
      AND conrelid = 'public.consultations'::regclass
  ) THEN
    ALTER TABLE public.consultations
      ADD CONSTRAINT consultations_rating_range
      CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consultations_rating
  ON public.consultations (rating)
  WHERE rating IS NOT NULL;

COMMENT ON COLUMN public.consultations.rating IS 'Calificación del MVZ a la consulta CDS (1-5)';
COMMENT ON COLUMN public.consultations.rated_at IS 'Momento en que se guardó la calificación';
