-- Opcional: alinear consultations con el resto del esquema.
-- El backend ya no depende de esta columna para guardar observaciones/payload.
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

COMMENT ON COLUMN public.consultations.updated_at IS
  'Última actualización de la consulta (payload/observaciones/análisis).';
