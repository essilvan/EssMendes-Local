-- ==============================================================================
-- Migration: Add cover_image_url to tenants & tenant_profiles + tenants bucket
-- Data: 13 de Setembro de 2026
-- ==============================================================================

-- 1. Adiciona coluna cover_image_url nas tabelas tenants e tenant_profiles
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.tenant_profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 2. Criação / Configuração do Bucket de Storage 'tenants' (Público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tenants',
    'tenants',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 3. Políticas de Segurança do Storage para o bucket 'tenants'
DROP POLICY IF EXISTS "Public can view tenant assets" ON storage.objects;
CREATE POLICY "Public can view tenant assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'tenants');

DROP POLICY IF EXISTS "Authenticated users can upload tenant assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload tenant assets"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'tenants');

DROP POLICY IF EXISTS "Authenticated users can update tenant assets" ON storage.objects;
CREATE POLICY "Authenticated users can update tenant assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tenants')
WITH CHECK (bucket_id = 'tenants');

DROP POLICY IF EXISTS "Authenticated users can delete tenant assets" ON storage.objects;
CREATE POLICY "Authenticated users can delete tenant assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tenants');
