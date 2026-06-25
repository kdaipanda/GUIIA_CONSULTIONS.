-- Solicitudes desde la landing: Guía Consultas (software + CDS/ADS)
CREATE TABLE IF NOT EXISTS public.guia_consultas_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'closed')),
  privacy_accepted boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'landing',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_guia_consultas_leads_status_created
  ON public.guia_consultas_leads(status, created_at DESC);

COMMENT ON TABLE public.guia_consultas_leads IS 'Solicitudes de información Guía Consultas desde la landing pública';
