-- ==============================================================================
-- Migration: Add is_visible to tenant_reviews (Soft-delete & Visibility Toggle)
-- Data: 17 de Setembro de 2026
-- ==============================================================================

ALTER TABLE public.tenant_reviews
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- Índice composto para otimização de busca na vitrine pública
CREATE INDEX IF NOT EXISTS idx_tenant_reviews_visibility
ON public.tenant_reviews(tenant_id, is_visible);

COMMENT ON COLUMN public.tenant_reviews.is_visible IS 'Indica se a avaliação deve ser exibida na vitrine pública (true) ou ocultada (false).';
