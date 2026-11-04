-- ==============================================================================
-- Migration: Roteamento de Orçamentos para Profissionais (CRM & WhatsApp)
-- Data: 04 de Novembro de 2026
-- ==============================================================================

-- 1. Adicionar colunas receives_quotes e is_primary_quote_contact em tenant_professionals
ALTER TABLE public.tenant_professionals
    ADD COLUMN IF NOT EXISTS receives_quotes BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS is_primary_quote_contact BOOLEAN NOT NULL DEFAULT false;

-- Garantir que a coluna phone suporte DDD + número formatado ou sanitizado
ALTER TABLE public.tenant_professionals
    ALTER COLUMN phone TYPE VARCHAR(50);

-- 2. Adicionar colunas equivalentes na tabela espelho 'professionals' (compatibilidade)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'professionals'
    ) THEN
        ALTER TABLE public.professionals
            ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
            ADD COLUMN IF NOT EXISTS receives_quotes BOOLEAN NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS is_primary_quote_contact BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- 3. Índices compostos para busca rápida na vitrine pública (/[slug])
CREATE INDEX IF NOT EXISTS idx_tenant_professionals_quotes_routing
    ON public.tenant_professionals(tenant_id, is_active, receives_quotes, is_primary_quote_contact);

-- 4. Garantir política de leitura pública para roteamento de orçamentos na vitrine
DROP POLICY IF EXISTS "Public can view active tenant_professionals" ON public.tenant_professionals;
CREATE POLICY "Public can view active tenant_professionals"
ON public.tenant_professionals FOR SELECT
TO anon, authenticated
USING (is_active = true);

