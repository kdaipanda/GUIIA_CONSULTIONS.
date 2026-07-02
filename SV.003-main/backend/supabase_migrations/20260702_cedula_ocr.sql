-- OCR de cédula profesional (extracción con visión / Claude)
alter table public.profiles
  add column if not exists cedula_ocr_nombre text,
  add column if not exists cedula_ocr_registro text,
  add column if not exists cedula_ocr_profesion text,
  add column if not exists cedula_ocr_institucion text,
  add column if not exists cedula_ocr_confidence text,
  add column if not exists cedula_ocr_notes text,
  add column if not exists cedula_ocr_match boolean,
  add column if not exists cedula_ocr_at timestamptz;

comment on column public.profiles.cedula_ocr_match is
  'True si nombre y/o registro extraídos por OCR coinciden con el perfil';
