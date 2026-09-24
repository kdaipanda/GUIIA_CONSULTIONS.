-- Hospitalización de pacientes: estado + notas diarias de evolución
-- Backend usa service_role; RLS protege acceso directo vía cliente Supabase.

CREATE TABLE IF NOT EXISTS public.patient_hospitalizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'discharged')),
  admitted_at timestamptz NOT NULL DEFAULT now(),
  discharged_at timestamptz,
  reason text,
  notes_summary text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_patient_hospitalizations_org
  ON public.patient_hospitalizations(organization_id);

CREATE INDEX IF NOT EXISTS idx_patient_hospitalizations_patient
  ON public.patient_hospitalizations(patient_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_hospitalizations_one_active
  ON public.patient_hospitalizations(patient_id)
  WHERE status = 'active';

-- Enforce tenant consistency for direct Supabase/RLS writes. The backend already
-- validates the patient, but authenticated clients can reach public tables.
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_org_id_id
  ON public.patients(organization_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_hospitalizations_org_id_id
  ON public.patient_hospitalizations(organization_id, id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patient_hospitalizations_org_patient_fk'
      AND conrelid = 'public.patient_hospitalizations'::regclass
  ) THEN
    ALTER TABLE public.patient_hospitalizations
      ADD CONSTRAINT patient_hospitalizations_org_patient_fk
      FOREIGN KEY (organization_id, patient_id)
      REFERENCES public.patients(organization_id, id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.patient_hospitalization_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospitalization_id uuid NOT NULL REFERENCES public.patient_hospitalizations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  noted_at timestamptz NOT NULL DEFAULT now(),
  body text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_patient_hospitalization_notes_hosp
  ON public.patient_hospitalization_notes(hospitalization_id, noted_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_hospitalization_notes_org
  ON public.patient_hospitalization_notes(organization_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patient_hospitalization_notes_org_hosp_fk'
      AND conrelid = 'public.patient_hospitalization_notes'::regclass
  ) THEN
    ALTER TABLE public.patient_hospitalization_notes
      ADD CONSTRAINT patient_hospitalization_notes_org_hosp_fk
      FOREIGN KEY (organization_id, hospitalization_id)
      REFERENCES public.patient_hospitalizations(organization_id, id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END
$$;

COMMENT ON TABLE public.patient_hospitalizations IS 'Internamientos de pacientes (activo / alta)';
COMMENT ON TABLE public.patient_hospitalization_notes IS 'Notas diarias de evolución durante hospitalización';

-- Helper RLS (por si no se aplicó 20260614_clinic_phase1_rls.sql)
CREATE OR REPLACE FUNCTION public.user_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE profile_id = auth.uid()::text;
$$;

ALTER TABLE public.patient_hospitalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_hospitalization_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_hospitalizations_all_member ON public.patient_hospitalizations;
CREATE POLICY patient_hospitalizations_all_member ON public.patient_hospitalizations
  FOR ALL USING (organization_id IN (SELECT public.user_organization_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));

DROP POLICY IF EXISTS patient_hospitalization_notes_all_member ON public.patient_hospitalization_notes;
CREATE POLICY patient_hospitalization_notes_all_member ON public.patient_hospitalization_notes
  FOR ALL USING (organization_id IN (SELECT public.user_organization_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));
