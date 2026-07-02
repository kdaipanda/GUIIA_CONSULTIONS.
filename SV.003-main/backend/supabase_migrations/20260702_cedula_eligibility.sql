-- Dictamen de elegibilidad profesional (portal SEP + IA)
alter table public.profiles
  add column if not exists cedula_eligibility_puede_ejercer text,
  add column if not exists cedula_eligibility_confianza text,
  add column if not exists cedula_eligibility_resumen text,
  add column if not exists cedula_eligibility_motivos text,
  add column if not exists cedula_eligibility_fuente text,
  add column if not exists cedula_eligibility_recomendacion text,
  add column if not exists cedula_eligibility_checked_at timestamptz;
