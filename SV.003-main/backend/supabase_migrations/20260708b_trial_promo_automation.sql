-- Automatización: promo al agotar prueba + campos de plantillas
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_promo_sent_at timestamptz;

COMMENT ON COLUMN public.profiles.trial_promo_sent_at IS 'Fecha del envío automático de promo al agotar 3 consultas de prueba';
