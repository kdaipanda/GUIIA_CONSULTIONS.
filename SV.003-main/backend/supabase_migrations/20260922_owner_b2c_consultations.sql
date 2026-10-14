/* Owner B2C layer: account_kind + owner_consultations (isolated from MVZ CDS). */

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_kind text NOT NULL DEFAULT 'veterinarian';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS owner_sessions_remaining integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_account_kind_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_account_kind_check
      CHECK (account_kind IN ('veterinarian', 'pet_owner'));
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.account_kind IS
  'veterinarian = MVZ/PMS; pet_owner = owner B2C consult';
COMMENT ON COLUMN public.profiles.owner_sessions_remaining IS
  'Paid owner sessions for /consulta. Does not affect consultations_remaining.';

CREATE TABLE IF NOT EXISTS public.owner_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  analysis text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
  disclaimer_accepted_at timestamptz,
  payment_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_owner_consultations_owner_id
  ON public.owner_consultations(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_consultations_created_at
  ON public.owner_consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_owner_consultations_owner_status
  ON public.owner_consultations(owner_id, status);

COMMENT ON TABLE public.owner_consultations IS
  'Owner B2C consultations. Isolated from MVZ consultations.';
