-- Seguridad plataforma: admins configurables y auditoría
-- Ejecutar en Supabase SQL Editor

create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  email text not null,
  role text not null default 'super_admin'
    check (role in ('read_only', 'support', 'super_admin')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (email)
);

create index if not exists idx_platform_admins_profile
  on public.platform_admins (profile_id) where active = true;

create index if not exists idx_platform_admins_email
  on public.platform_admins (lower(email)) where active = true;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_profile_id uuid,
  admin_email text,
  action text not null,
  target_profile_id uuid,
  target_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_log_created
  on public.admin_audit_log (created_at desc);

create index if not exists idx_admin_audit_log_admin
  on public.admin_audit_log (admin_profile_id, created_at desc);

-- Ejemplo: otorgar admin por email (ajusta el correo)
-- insert into public.platform_admins (email, role, active)
-- values ('admin@guiaa.vet', 'super_admin', true)
-- on conflict (email) do update set active = true, role = excluded.role;
