-- ==============================================================================
-- Migration: Adiciona google_place_id à tabela public.tenants
-- Data: 26 de Agosto de 2026
-- ==============================================================================

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.tenants.google_place_id IS 'Place ID oficial retornado pelo Google Places API para o tenant.';
