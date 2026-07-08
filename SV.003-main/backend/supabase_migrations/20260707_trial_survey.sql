-- Encuesta al agotar las 3 consultas de prueba + oferta Premium con cupón
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_survey_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_survey_rating SMALLINT,
  ADD COLUMN IF NOT EXISTS trial_survey_comment TEXT;

COMMENT ON COLUMN profiles.trial_survey_completed_at IS 'Cuándo el usuario completó la encuesta post-prueba';
COMMENT ON COLUMN profiles.trial_survey_rating IS 'Calificación 1-5 de la experiencia en periodo de prueba';
COMMENT ON COLUMN profiles.trial_survey_comment IS 'Comentarios libres de la encuesta post-prueba';
