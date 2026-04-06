-- Migración: columnas de interpretación de laboratorio en medical_images
-- Fecha: 2026-04-01
--
-- El backend (server_simple interpret_medical_image) inserta analysis, findings,
-- recommendations, image_type, patient_name y additional_context. Si faltan,
-- PostgREST devuelve PGRST204 (column not in schema cache).
--
-- Ejecutar en Supabase → SQL Editor (mismo proyecto que usa el frontend/backend).

alter table public.medical_images
  add column if not exists analysis text,
  add column if not exists findings jsonb default '[]'::jsonb,
  add column if not exists recommendations jsonb default '[]'::jsonb,
  add column if not exists additional_context text,
  add column if not exists image_type text,
  add column if not exists patient_name text;

comment on column public.medical_images.analysis is 'Texto completo del análisis (Claude / laboratorio).';
comment on column public.medical_images.findings is 'Lista de hallazgos (JSON array).';
comment on column public.medical_images.recommendations is 'Lista de recomendaciones (JSON array).';
