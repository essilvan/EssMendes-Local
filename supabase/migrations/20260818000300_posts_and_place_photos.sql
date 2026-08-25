-- ==============================================================================
-- Migration: Posts & Novidades + Google Place Photos
-- Data: 18 de Agosto de 2026
-- ==============================================================================

-- 1. Extensão de tenant_profiles para armazenar fotos importadas do Google
ALTER TABLE public.tenant_profiles
ADD COLUMN IF NOT EXISTS place_photos JSONB DEFAULT '[]'::jsonb;

-- 2. Tabela de Posts & Novidades do Estabelecimento
CREATE TABLE IF NOT EXISTS public.tenant_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    cta_type VARCHAR(50) DEFAULT 'booking', -- 'booking', 'whatsapp', 'link'
    cta_label VARCHAR(100) DEFAULT 'Agendar Agora',
    cta_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_posts_tenant_id ON public.tenant_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_posts_active ON public.tenant_posts(tenant_id, is_active);

-- 3. Habilitar RLS em tenant_posts
ALTER TABLE public.tenant_posts ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança: tenant_posts
DROP POLICY IF EXISTS "Public can view active tenant posts" ON public.tenant_posts;
CREATE POLICY "Public can view active tenant posts"
ON public.tenant_posts FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Members can manage tenant posts" ON public.tenant_posts;
CREATE POLICY "Members can manage tenant posts"
ON public.tenant_posts FOR ALL
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
