-- ==============================================================================
-- Migration: Add editorial_summary to profiles & adjust RLS
-- Data: 19 de Agosto de 2026
-- ==============================================================================

-- 1. Extensao de tenant_profiles com editorial_summary e name
ALTER TABLE public.tenant_profiles
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS editorial_summary TEXT;

-- 2. Extensao de tenant_posts com is_published caso necessario
ALTER TABLE public.tenant_posts
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- 3. Garantir politicas publicas RLS para SELECT em anon e authenticated
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
ON public.services FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active tenant posts" ON public.tenant_posts;
CREATE POLICY "Public can view active tenant posts"
ON public.tenant_posts FOR SELECT
TO anon, authenticated
USING (is_active = true OR is_published = true);

DROP POLICY IF EXISTS "Public can view tenant reviews" ON public.tenant_reviews;
CREATE POLICY "Public can view tenant reviews"
ON public.tenant_reviews FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can view active portfolio items" ON public.portfolio_items;
CREATE POLICY "Public can view active portfolio items"
ON public.portfolio_items FOR SELECT
TO anon, authenticated
USING (is_active = true);
