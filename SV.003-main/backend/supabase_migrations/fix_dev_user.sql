-- Script para actualizar usuario de desarrollo sin requerir todas las columnas
-- Ejecutar en Supabase SQL Editor

-- Primero, asegurar que las columnas existan (si no, crearlas)
DO $$
BEGIN
  -- Agregar columnas si no existen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'cedula_verification_status') THEN
    ALTER TABLE public.profiles ADD COLUMN cedula_verification_status text DEFAULT 'unsubmitted';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'cedula_verification_checked_at') THEN
    ALTER TABLE public.profiles ADD COLUMN cedula_verification_checked_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'cedula_sep_nombre') THEN
    ALTER TABLE public.profiles ADD COLUMN cedula_sep_nombre text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'cedula_sep_profesion') THEN
    ALTER TABLE public.profiles ADD COLUMN cedula_sep_profesion text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'cedula_document_uploaded_at') THEN
    ALTER TABLE public.profiles ADD COLUMN cedula_document_uploaded_at timestamptz;
  END IF;
END $$;

-- Ahora actualizar el usuario de desarrollo
UPDATE public.profiles
SET 
  cedula_verification_status = 'verified',
  cedula_verification_checked_at = NOW(),
  cedula_sep_nombre = COALESCE(nombre, 'Carlos Hernandez'),
  cedula_sep_profesion = 'Médico Veterinario Zootecnista',
  cedula_document_uploaded_at = COALESCE(cedula_document_uploaded_at, NOW())
WHERE email = 'carlos.hernandez@vetmed.com';

-- Verificar resultado
SELECT 
  id,
  email,
  nombre,
  cedula_verification_status,
  cedula_verification_checked_at
FROM public.profiles
WHERE email = 'carlos.hernandez@vetmed.com';






