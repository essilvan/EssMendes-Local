-- ==============================================================================
-- Migration: Portfolio (Antes & Depois) e Supabase Storage (tenant-media)
-- Data: 15 de Agosto de 2026
-- ==============================================================================

-- 1. Criação do Bucket de Storage 'tenant-media' (Público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tenant-media',
    'tenant-media',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Políticas de Segurança do Storage para 'tenant-media'
DROP POLICY IF EXISTS "Public can view tenant media" ON storage.objects;
CREATE POLICY "Public can view tenant media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'tenant-media');

DROP POLICY IF EXISTS "Authenticated users can upload tenant media" ON storage.objects;
CREATE POLICY "Authenticated users can upload tenant media"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'tenant-media');

DROP POLICY IF EXISTS "Authenticated users can update tenant media" ON storage.objects;
CREATE POLICY "Authenticated users can update tenant media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tenant-media')
WITH CHECK (bucket_id = 'tenant-media');

DROP POLICY IF EXISTS "Authenticated users can delete tenant media" ON storage.objects;
CREATE POLICY "Authenticated users can delete tenant media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tenant-media');

-- 3. Tabela de Portfólio (Antes & Depois / Transformações)
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    before_image_url TEXT NOT NULL,
    after_image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_portfolio_tenant ON public.portfolio_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_tenant_active ON public.portfolio_items(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_portfolio_order ON public.portfolio_items(tenant_id, display_order);

-- 4. Habilitar Row-Level Security (RLS)
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança para portfolio_items
DROP POLICY IF EXISTS "Public can view active portfolio items" ON public.portfolio_items;
CREATE POLICY "Public can view active portfolio items"
ON public.portfolio_items FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Members can view all tenant portfolio items" ON public.portfolio_items;
CREATE POLICY "Members can view all tenant portfolio items"
ON public.portfolio_items FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Members can manage tenant portfolio items" ON public.portfolio_items;
CREATE POLICY "Members can manage tenant portfolio items"
ON public.portfolio_items FOR ALL
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
