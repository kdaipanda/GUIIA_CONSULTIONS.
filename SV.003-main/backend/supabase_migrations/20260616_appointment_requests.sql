-- Solicitudes de cita desde portal cliente (Fase 3 PMS)
CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  phone text,
  email text,
  patient_name text NOT NULL,
  species text,
  preferred_starts_at timestamptz,
  reason text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_appointment_requests_org_status
  ON public.appointment_requests(organization_id, status);

COMMENT ON TABLE public.appointment_requests IS 'Solicitudes de cita enviadas desde el portal cliente';
