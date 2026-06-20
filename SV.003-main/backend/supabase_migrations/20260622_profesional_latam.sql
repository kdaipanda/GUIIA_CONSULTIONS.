-- Verificación profesional LATAM: país + clave normalizada para login
alter table public.profiles
  add column if not exists profesional_pais text default 'MX',
  add column if not exists cedula_profesional_key text;

-- Normalizar claves existentes (alfanumérico, sin espacios ni puntuación)
update public.profiles
set cedula_profesional_key = upper(
  regexp_replace(coalesce(cedula_profesional, ''), '[\s.\-/_]', '', 'g')
)
where cedula_profesional_key is null
  and coalesce(cedula_profesional, '') <> '';

create index if not exists profiles_cedula_profesional_key_idx
  on public.profiles (cedula_profesional_key);
