-- ==============================================================================
-- Migration: Add business_attributes to tenants and tenant_profiles
-- Data: 07 de Setembro de 2026
-- ==============================================================================

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS business_attributes JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.tenant_profiles
ADD COLUMN IF NOT EXISTS business_attributes JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.tenants.business_attributes IS 'Comodidades, diferenciais e atributos de atendimento (estilo Google Maps)';
COMMENT ON COLUMN public.tenant_profiles.business_attributes IS 'Comodidades, diferenciais e atributos de atendimento (estilo Google Maps)';
