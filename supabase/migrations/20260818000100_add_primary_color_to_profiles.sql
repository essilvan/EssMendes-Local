-- ==============================================================================
-- Migration: Add primary_color to tenant_profiles
-- Data: 18 de Agosto de 2026
-- ==============================================================================

ALTER TABLE public.tenant_profiles
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#0d9488';

COMMENT ON COLUMN public.tenant_profiles.primary_color IS 'Cor primária customizável do tema do estabelecimento (formato HEX)';
