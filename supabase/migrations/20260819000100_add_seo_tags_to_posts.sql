-- ==============================================================================
-- Migration: Add SEO Tags and Meta Description to Posts
-- Data: 19 de Agosto de 2026
-- ==============================================================================

-- 1. Extensao da tabela tenant_posts com campos de SEO Local
ALTER TABLE public.tenant_posts
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 2. Indice para busca por tags
CREATE INDEX IF NOT EXISTS idx_tenant_posts_tags ON public.tenant_posts USING GIN (tags);

-- Comentarios explicativos
COMMENT ON COLUMN public.tenant_posts.tags IS 'Array de palavras-chave e tags de SEO Local para ranqueamento no Google';
COMMENT ON COLUMN public.tenant_posts.meta_description IS 'Descricao resumida para metatags e snippets de busca';
COMMENT ON COLUMN public.tenant_posts.slug IS 'Slug amigavel da publicacao para URLs de artigos SEO';
