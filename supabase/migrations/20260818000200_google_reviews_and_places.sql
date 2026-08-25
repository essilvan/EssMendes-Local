-- ==============================================================================
-- Migration: Google Reviews & Place Sync
-- Data: 18 de Agosto de 2026
-- ==============================================================================

-- 1. Extensão de tenant_profiles para armazenar dados do Google Maps & Hero
ALTER TABLE public.tenant_profiles
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 4.9,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 128,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- 2. Tabela de Avaliações Importadas do Google
CREATE TABLE IF NOT EXISTS public.tenant_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_photo_url TEXT,
    rating INTEGER NOT NULL DEFAULT 5,
    text TEXT NOT NULL,
    relative_time VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_reviews_tenant_id ON public.tenant_reviews(tenant_id);

-- 3. Habilitar RLS em tenant_reviews
ALTER TABLE public.tenant_reviews ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança: tenant_reviews
DROP POLICY IF EXISTS "Public can view tenant reviews" ON public.tenant_reviews;
CREATE POLICY "Public can view tenant reviews"
ON public.tenant_reviews FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Members can manage tenant reviews" ON public.tenant_reviews;
CREATE POLICY "Members can manage tenant reviews"
ON public.tenant_reviews FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
);
