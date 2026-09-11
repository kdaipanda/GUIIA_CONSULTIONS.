-- Expediente clínico rico: chart estructurado por paciente (JSONB)
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS clinical_chart jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_patients_clinical_chart_gin
  ON public.patients USING gin (clinical_chart);

COMMENT ON COLUMN public.patients.clinical_chart IS
  'Antecedentes estructurados: allergies, vaccines, surgeries, deworming, problems, reproductive';
