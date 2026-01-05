-- Optimización de Políticas RLS para mejorar rendimiento
-- Fecha: 2025-01-04
--
-- Ejecutar en Supabase SQL Editor
-- Este script optimiza las políticas RLS de consultations y medical_images

-- ============================================
-- 1. CREAR ÍNDICES PARA OPTIMIZAR RLS
-- ============================================

-- Índices para consultations (si no existen)
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON public.consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);

-- Índices para medical_images (si no existen)
CREATE INDEX IF NOT EXISTS idx_medical_images_user_id ON public.medical_images(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_images_created_at ON public.medical_images(created_at DESC);

-- Índice compuesto para consultas comunes
CREATE INDEX IF NOT EXISTS idx_consultations_user_status ON public.consultations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_medical_images_user_consultation ON public.medical_images(user_id, consultation_id) WHERE consultation_id IS NOT NULL;

-- ============================================
-- 2. ELIMINAR POLÍTICAS RLS DUPLICADAS O INEFICIENTES
-- ============================================

-- Primero, listar políticas existentes para referencia
-- (No las eliminamos automáticamente, solo las optimizamos)

-- ============================================
-- 3. CREAR POLÍTICAS RLS OPTIMIZADAS PARA consultations
-- ============================================

-- Eliminar políticas antiguas si existen (ajusta los nombres según tus políticas actuales)
-- DROP POLICY IF EXISTS "consultations_select_policy" ON public.consultations;
-- DROP POLICY IF EXISTS "consultations_insert_policy" ON public.consultations;
-- DROP POLICY IF EXISTS "consultations_update_policy" ON public.consultations;
-- DROP POLICY IF EXISTS "consultations_delete_policy" ON public.consultations;

-- Política optimizada para SELECT (usar índices)
CREATE POLICY IF NOT EXISTS "consultations_select_optimized"
ON public.consultations
FOR SELECT
TO authenticated
USING (
    -- Usar comparación directa con índice en user_id
    user_id::text = auth.uid()::text
    OR user_id = auth.uid()::text
);

-- Política optimizada para INSERT
CREATE POLICY IF NOT EXISTS "consultations_insert_optimized"
ON public.consultations
FOR INSERT
TO authenticated
WITH CHECK (
    -- Verificar que el user_id coincida
    user_id::text = auth.uid()::text
    OR user_id = auth.uid()::text
);

-- Política optimizada para UPDATE
CREATE POLICY IF NOT EXISTS "consultations_update_optimized"
ON public.consultations
FOR UPDATE
TO authenticated
USING (
    -- Usar índice en user_id
    user_id::text = auth.uid()::text
    OR user_id = auth.uid()::text
)
WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id = auth.uid()::text
);

-- Política optimizada para DELETE (si es necesario)
CREATE POLICY IF NOT EXISTS "consultations_delete_optimized"
ON public.consultations
FOR DELETE
TO authenticated
USING (
    user_id::text = auth.uid()::text
    OR user_id = auth.uid()::text
);

-- ============================================
-- 4. CREAR POLÍTICAS RLS OPTIMIZADAS PARA medical_images
-- ============================================

-- Eliminar políticas antiguas si existen
-- DROP POLICY IF EXISTS "medical_images_select_policy" ON public.medical_images;
-- DROP POLICY IF EXISTS "medical_images_insert_policy" ON public.medical_images;
-- DROP POLICY IF EXISTS "medical_images_update_policy" ON public.medical_images;
-- DROP POLICY IF EXISTS "medical_images_delete_policy" ON public.medical_images;

-- Política optimizada para SELECT
CREATE POLICY IF NOT EXISTS "medical_images_select_optimized"
ON public.medical_images
FOR SELECT
TO authenticated
USING (
    -- Usar índice en user_id
    user_id::text = auth.uid()::text
    OR user_id = auth.uid()::text
);

-- Política optimizada para INSERT
CREATE POLICY IF NOT EXISTS "medical_images_insert_optimized"
ON public.medical_images
FOR INSERT
TO authenticated
WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id = auth.uid()::text
);

-- Política optimizada para UPDATE
CREATE POLICY IF NOT EXISTS "medical_images_update_optimized"
ON public.medical_images
FOR UPDATE
TO authenticated
USING (
    user_id::text = auth.uid()::text
    OR user_id = auth.uid()::text
)
WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id = auth.uid()::text
);

-- Política optimizada para DELETE
CREATE POLICY IF NOT EXISTS "medical_images_delete_optimized"
ON public.medical_images
FOR DELETE
TO authenticated
USING (
    user_id::text = auth.uid()::text
    OR user_id = auth.uid()::text
);

-- ============================================
-- 5. HABILITAR RLS EN LAS TABLAS (si no está habilitado)
-- ============================================

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_images ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. VERIFICAR ÍNDICES Y POLÍTICAS
-- ============================================

-- Ver índices creados
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('consultations', 'medical_images')
ORDER BY tablename, indexname;

-- Ver políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('consultations', 'medical_images')
ORDER BY tablename, policyname;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Si tus políticas actuales tienen nombres diferentes, ajusta los nombres arriba
-- 2. Si usas service_role desde el backend, las políticas RLS no se aplican
-- 3. Las políticas optimizadas usan comparaciones directas que aprovechan los índices
-- 4. Si user_id es UUID, usa auth.uid() directamente sin conversión a texto

