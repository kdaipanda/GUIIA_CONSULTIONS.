-- Recordatorio por correo: cuándo se envió el último email de cédula pendiente
alter table public.profiles
  add column if not exists cedula_reminder_sent_at timestamptz;
