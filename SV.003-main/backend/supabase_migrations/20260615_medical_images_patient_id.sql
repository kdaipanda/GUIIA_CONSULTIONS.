-- Vincular interpretaciones de imágenes/estudios con pacientes (Fase 2 PMS)
ALTER TABLE public.medical_images
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_medical_images_patient_id ON public.medical_images(patient_id);

COMMENT ON COLUMN public.medical_images.patient_id IS 'Paciente clínico vinculado (módulo PMS)';
