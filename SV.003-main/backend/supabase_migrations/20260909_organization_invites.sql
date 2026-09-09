-- Invitaciones a equipo del consultorio (recepción / admin / veterinario)
CREATE TABLE IF NOT EXISTS public.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL
    CHECK (role IN ('admin', 'veterinarian', 'receptionist')),
  token_hash text NOT NULL UNIQUE,
  invited_by text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_profile_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_organization_id
  ON public.organization_invites(organization_id);

CREATE INDEX IF NOT EXISTS idx_org_invites_email_pending
  ON public.organization_invites(organization_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_org_invites_token_hash
  ON public.organization_invites(token_hash)
  WHERE status = 'pending';

COMMENT ON TABLE public.organization_invites IS
  'Invitaciones por email/link para unirse a un consultorio (staff o veterinario).';
