/* Harden direct Supabase access to Owner B2C clinical consultations. */

ALTER TABLE public.owner_consultations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.owner_consultations FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'owner_consultations'
      AND policyname = 'owner_consultations_select_owner'
  ) THEN
    CREATE POLICY owner_consultations_select_owner
      ON public.owner_consultations
      FOR SELECT
      TO authenticated
      USING (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'owner_consultations'
      AND policyname = 'owner_consultations_insert_owner'
  ) THEN
    CREATE POLICY owner_consultations_insert_owner
      ON public.owner_consultations
      FOR INSERT
      TO authenticated
      WITH CHECK (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'owner_consultations'
      AND policyname = 'owner_consultations_update_owner'
  ) THEN
    CREATE POLICY owner_consultations_update_owner
      ON public.owner_consultations
      FOR UPDATE
      TO authenticated
      USING (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'owner_consultations'
      AND policyname = 'owner_consultations_delete_owner'
  ) THEN
    CREATE POLICY owner_consultations_delete_owner
      ON public.owner_consultations
      FOR DELETE
      TO authenticated
      USING (owner_id = auth.uid());
  END IF;
END $$;
