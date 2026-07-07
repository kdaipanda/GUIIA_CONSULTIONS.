-- Contraseñas bcrypt para login (Fase 2 seguridad)
alter table public.profiles
  add column if not exists password_hash text;

comment on column public.profiles.password_hash is
  'Hash bcrypt de la contraseña de acceso; null = login legacy email+matricula';
