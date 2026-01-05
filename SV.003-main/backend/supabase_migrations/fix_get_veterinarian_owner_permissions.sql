-- Fix: Permisos para función get_veterinarian_owner
-- Fecha: 2025-01-04
--
-- Ejecutar en Supabase SQL Editor
-- Este script resuelve el error "permission denied" en la función get_veterinarian_owner

-- Opción 1: Otorgar EXECUTE a PUBLIC (Recomendado para pruebas rápidas)
-- Esto permite que cualquier usuario autenticado pueda ejecutar la función
GRANT EXECUTE ON FUNCTION public.get_veterinarian_owner(uuid) TO public;

-- Opción 2: Otorgar EXECUTE solo a authenticated (Más seguro)
-- Si prefieres restringir solo a usuarios autenticados:
-- GRANT EXECUTE ON FUNCTION public.get_veterinarian_owner(uuid) TO authenticated;

-- Opción 3: Asegurar que el OWNER de la función tenga permisos en las tablas
-- Verificar y otorgar permisos si es necesario
DO $$
BEGIN
    -- Asegurar que el propietario de la función tenga acceso a las tablas
    -- Esto es necesario si la función es SECURITY DEFINER
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_veterinarian_owner') THEN
        -- Otorgar permisos al propietario de la función en las tablas necesarias
        -- (Ajusta según el propietario real de la función)
        GRANT SELECT ON public.profiles TO postgres;
        GRANT SELECT ON public.veterinarians TO postgres;
        
        -- Si la función usa otras tablas, agrégales aquí
        -- GRANT SELECT ON public.consultations TO postgres;
    END IF;
END $$;

-- Verificar permisos actuales de la función
SELECT 
    p.proname as function_name,
    pg_get_userbyid(p.proowner) as owner,
    p.prosecdef as is_security_definer,
    array_to_string(p.proacl, ', ') as acl
FROM pg_proc p
WHERE p.proname = 'get_veterinarian_owner';

-- Verificar permisos en las tablas
SELECT 
    schemaname,
    tablename,
    tableowner,
    array_to_string(relacl, ', ') as acl
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'veterinarians')
LIMIT 10;

