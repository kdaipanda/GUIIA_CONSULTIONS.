-- Presencia de usuarios: última actividad en plataforma
-- Ejecutar en Supabase SQL Editor

alter table public.profiles
  add column if not exists last_seen timestamptz;

create index if not exists idx_profiles_last_seen
  on public.profiles (last_seen desc nulls last);

notify pgrst, 'reload schema';
