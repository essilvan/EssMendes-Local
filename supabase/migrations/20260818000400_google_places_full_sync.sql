-- ==============================================================================
-- Migration: Google Places Full Sync Extended Fields
-- Data: 18 de Agosto de 2026
-- ==============================================================================

-- 1. Extensao de tenant_profiles com campos completos do Google Places API (New)
ALTER TABLE public.tenant_profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS business_category VARCHAR(150),
ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER,
ADD COLUMN IF NOT EXISTS opening_hours_json JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. Extensao de tenant_reviews para compatibilidade de nomenclaturas
ALTER TABLE public.tenant_reviews
ADD COLUMN IF NOT EXISTS review_text TEXT,
ADD COLUMN IF NOT EXISTS relative_time_description VARCHAR(100);

-- Comentarios descritivos
COMMENT ON COLUMN public.tenant_profiles.business_category IS 'Categoria principal do Google Meu Negocio (primaryTypeDisplayName)';
COMMENT ON COLUMN public.tenant_profiles.opening_hours_json IS 'Lista de horarios de funcionamento por dia da semana em JSON';
COMMENT ON COLUMN public.tenant_profiles.latitude IS 'Latitude GPS do estabelecimento';
COMMENT ON COLUMN public.tenant_profiles.longitude IS 'Longitude GPS do estabelecimento';
