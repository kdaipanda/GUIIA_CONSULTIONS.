-- Acceso temporal a funciones Premium sin cambiar cupo CDS ni membership_type.
-- Uso: UPDATE profiles SET premium_features_until = now() + interval '15 days' WHERE email = '...';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS premium_features_until TIMESTAMPTZ NULL;

COMMENT ON COLUMN profiles.premium_features_until IS
  'Si es futura, el perfil tiene features Premium (UI/API) sin alterar consultations_remaining ni membership_type.';
