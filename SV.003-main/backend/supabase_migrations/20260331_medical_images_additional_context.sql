-- Migración: columna additional_context en medical_images (pruebas de laboratorio / interpretación)
-- Fecha: 2026-03-31
--
-- Ejecutar en Supabase → SQL Editor (proyecto de producción o el que uses).
-- Corrige PGRST204: Could not find the 'additional_context' column of 'medical_images' in the schema cache

alter table public.medical_images
  add column if not exists additional_context text;

comment on column public.medical_images.additional_context is
  'Contexto libre del veterinario al interpretar imagen o datos de estudio.';
