-- ==============================================================================
-- Migration: Google Reviews Sync Enhancements
-- Data: 25 de Agosto de 2026
-- ==============================================================================

-- 1. Extensão da tabela tenant_reviews para suportar links e fotos oficiais
ALTER TABLE public.tenant_reviews
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS author_url TEXT;

-- 2. Extensão da tabela tenants para notas consolidadas
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER DEFAULT 0;

-- 3. Extensão da tabela tenant_profiles para redundância de notas
ALTER TABLE public.tenant_profiles
ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER DEFAULT 0;
