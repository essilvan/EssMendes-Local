-- ==============================================================================
-- Migration: Criação e Configuração do Bucket 'establishment-photos'
-- Data: 21 de Outubro de 2026
-- Objetivo: Persistência multi-tenant de imagens com isolamento por tenant_id
-- ==============================================================================

-- 1. Criação / Configuração do Bucket de Storage 'establishment-photos' (Público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'establishment-photos',
    'establishment-photos',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Políticas de Segurança do Storage para o bucket 'establishment-photos'
DROP POLICY IF EXISTS "Public can view establishment photos" ON storage.objects;
CREATE POLICY "Public can view establishment photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'establishment-photos');

DROP POLICY IF EXISTS "Authenticated users can upload establishment photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload establishment photos"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'establishment-photos');

DROP POLICY IF EXISTS "Authenticated users can update establishment photos" ON storage.objects;
CREATE POLICY "Authenticated users can update establishment photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'establishment-photos')
WITH CHECK (bucket_id = 'establishment-photos');

DROP POLICY IF EXISTS "Authenticated users can delete establishment photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete establishment photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'establishment-photos');
