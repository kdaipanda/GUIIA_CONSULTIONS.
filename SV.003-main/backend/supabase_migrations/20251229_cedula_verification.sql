-- Migración: verificación de cédula profesional (registro + login)
-- Fecha: 2025-12-29
--
-- Ejecutar en Supabase SQL Editor (proyecto correspondiente).
-- Nota: este repo usa la tabla `public.profiles` para perfiles (id = auth.uid o UUID propio).

-- 1) Columnas de documento + estado de verificación
alter table public.profiles
  add column if not exists cedula_document_url text,
  add column if not exists cedula_document_uploaded_at timestamptz,
  add column if not exists cedula_verification_status text default 'unsubmitted',
  add column if not exists cedula_verification_checked_at timestamptz,
  add column if not exists cedula_verification_error text,
  add column if not exists cedula_sep_nombre text,
  add column if not exists cedula_sep_profesion text;

-- 2) Constraint opcional para limitar valores (puedes omitir si ya tienes datos libres)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_cedula_verification_status_chk'
  ) then
    alter table public.profiles
      add constraint profiles_cedula_verification_status_chk
      check (cedula_verification_status in ('unsubmitted','pending','verified','rejected'));
  end if;
end $$;

-- 3) Storage bucket (opcional)
-- Si usas el bucket `uploads` como público para URLs públicas:
-- - En UI: Storage -> Buckets -> New bucket -> name: uploads -> public: ON
-- - O con SQL (si tu proyecto permite escribir en storage.buckets):
-- insert into storage.buckets (id, name, public)
-- values ('uploads', 'uploads', true)
-- on conflict (id) do nothing;

-- 4) Políticas (RLS) (depende de tu modelo de seguridad)
-- Si el bucket es público, no necesitas lectura autenticada.
-- Para escritura, normalmente se recomienda restringir por auth.uid() o usar service role desde backend.







