-- Campañas promocionales multicanal (email + WhatsApp) para GUIAA

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS telefono_e164 text;

COMMENT ON COLUMN public.profiles.marketing_opt_in IS 'Consentimiento explícito para correos y WhatsApp promocionales';
COMMENT ON COLUMN public.profiles.marketing_unsubscribed_at IS 'Fecha de baja de marketing; no enviar promociones después';
COMMENT ON COLUMN public.profiles.telefono_e164 IS 'Teléfono normalizado E.164 para WhatsApp';

CREATE TABLE IF NOT EXISTS public.promotion_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  segment text NOT NULL,
  channels text[] NOT NULL DEFAULT ARRAY['email']::text[],
  offer jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  created_by_profile_id uuid,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'preview', 'sending', 'completed', 'failed', 'cancelled')),
  dry_run boolean NOT NULL DEFAULT false,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.promotion_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.promotion_campaigns(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  recipient_type text NOT NULL DEFAULT 'profile'
    CHECK (recipient_type IN ('profile', 'guia_lead')),
  recipient_id uuid,
  recipient_email text,
  recipient_phone text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  external_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_status_created
  ON public.promotion_campaigns(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_promotion_sends_campaign
  ON public.promotion_sends(campaign_id, status);

CREATE INDEX IF NOT EXISTS idx_promotion_sends_recipient
  ON public.promotion_sends(recipient_email, sent_at DESC);

COMMENT ON TABLE public.promotion_campaigns IS 'Campañas promocionales GUIAA (email + WhatsApp + imagen Canva)';
COMMENT ON TABLE public.promotion_sends IS 'Registro por destinatario y canal de cada campaña promocional';
