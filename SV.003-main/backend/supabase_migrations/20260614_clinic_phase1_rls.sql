-- RLS Fase 1 PMS — aislamiento por organization_id
-- El backend usa service_role; RLS protege acceso directo vía Supabase client

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Helper: organizaciones del usuario autenticado
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

-- organizations
DROP POLICY IF EXISTS org_select_member ON public.organizations;
CREATE POLICY org_select_member ON public.organizations
  FOR SELECT USING (id IN (SELECT public.user_organization_ids()));

DROP POLICY IF EXISTS org_update_owner_admin ON public.organizations;
CREATE POLICY org_update_owner_admin ON public.organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE profile_id = auth.uid()::text AND role IN ('owner', 'admin')
    )
  );

-- organization_members
DROP POLICY IF EXISTS org_members_select ON public.organization_members;
CREATE POLICY org_members_select ON public.organization_members
  FOR SELECT USING (organization_id IN (SELECT public.user_organization_ids()));

-- branches
DROP POLICY IF EXISTS branches_all_member ON public.branches;
CREATE POLICY branches_all_member ON public.branches
  FOR ALL USING (organization_id IN (SELECT public.user_organization_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));

-- clients
DROP POLICY IF EXISTS clients_all_member ON public.clients;
CREATE POLICY clients_all_member ON public.clients
  FOR ALL USING (organization_id IN (SELECT public.user_organization_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));

-- patients
DROP POLICY IF EXISTS patients_all_member ON public.patients;
CREATE POLICY patients_all_member ON public.patients
  FOR ALL USING (organization_id IN (SELECT public.user_organization_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));

-- appointments
DROP POLICY IF EXISTS appointments_all_member ON public.appointments;
CREATE POLICY appointments_all_member ON public.appointments
  FOR ALL USING (organization_id IN (SELECT public.user_organization_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));

-- Service role bypasses RLS by default in Supabase
