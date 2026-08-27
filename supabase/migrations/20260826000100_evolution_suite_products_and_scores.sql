-- ==============================================================================
-- Migration: Evolution Suite — Products, Integrations, Opportunities & Score
-- Data: 26 de Agosto de 2026
-- Empresa: EssMendes Tecnologia
-- ==============================================================================

-- 1. TABELA DE PRODUTOS DO TENANT (VITRINE DE PEÇAS E PRODUTOS FÍSICOS)
CREATE TABLE IF NOT EXISTS public.tenant_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    promotional_price DECIMAL(10, 2),
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_products_tenant_id ON public.tenant_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_products_available ON public.tenant_products(tenant_id, is_available);

ALTER TABLE public.tenant_products ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tenant_products
DROP POLICY IF EXISTS "Public can view available products" ON public.tenant_products;
CREATE POLICY "Public can view available products"
ON public.tenant_products FOR SELECT
TO anon, authenticated
USING (is_available = true);

DROP POLICY IF EXISTS "Members can manage tenant products" ON public.tenant_products;
CREATE POLICY "Members can manage tenant products"
ON public.tenant_products FOR ALL
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

-- 2. TABELA DE INTEGRAÇÕES EXTERNAS (GOOGLE BUSINESS PROFILE / OAUTH)
CREATE TABLE IF NOT EXISTS public.tenant_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
    provider VARCHAR(50) NOT NULL DEFAULT 'google_business',
    is_connected BOOLEAN NOT NULL DEFAULT false,
    account_id VARCHAR(255),
    location_id VARCHAR(255),
    location_name VARCHAR(255),
    last_synced_at TIMESTAMPTZ,
    sync_status VARCHAR(50) DEFAULT 'idle',
    sync_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant_id ON public.tenant_integrations(tenant_id);

ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view tenant integrations" ON public.tenant_integrations;
CREATE POLICY "Members can view tenant integrations"
ON public.tenant_integrations FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Members can manage tenant integrations" ON public.tenant_integrations;
CREATE POLICY "Members can manage tenant integrations"
ON public.tenant_integrations FOR ALL
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

-- 3. TABELA DE OPORTUNIDADES E RECOMENDAÇÕES DE CRESCIMENTO
CREATE TABLE IF NOT EXISTS public.tenant_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
    impact VARCHAR(50) NOT NULL DEFAULT 'medium',   -- 'high', 'medium', 'low'
    action_label VARCHAR(100) NOT NULL,
    action_url VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'reputation', -- 'profile', 'reputation', 'content', 'catalog', 'seo'
    status VARCHAR(30) NOT NULL DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'dismissed'
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_opps_tenant_status ON public.tenant_opportunities(tenant_id, status);

ALTER TABLE public.tenant_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can manage tenant opportunities" ON public.tenant_opportunities;
CREATE POLICY "Members can manage tenant opportunities"
ON public.tenant_opportunities FOR ALL
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

-- 4. EXTENSÕES EM TABELAS EXISTENTES (CAMPOS SEGUROS E IDEMPOTENTES)

-- Distinção de reviews oficiais vs manuais e status de resposta
ALTER TABLE public.tenant_reviews
ADD COLUMN IF NOT EXISTS is_official_google BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reply_text TEXT,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

-- Histórico de Score de Presença e sincronização em tenants
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS presence_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- 5. TABELA DE LEADS GERADOS NO DIAGNÓSTICO GRATUITO
CREATE TABLE IF NOT EXISTS public.lead_diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    city VARCHAR(150) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    calculated_score INTEGER NOT NULL DEFAULT 50,
    google_found BOOLEAN DEFAULT false,
    google_place_id VARCHAR(255),
    google_rating DECIMAL(2,1),
    google_reviews_count INTEGER,
    issues_detected JSONB DEFAULT '[]'::jsonb,
    opportunities_detected JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_diagnostics ENABLE ROW LEVEL SECURITY;

-- Leitura apenas para authenticated (equipe EssMendes)
DROP POLICY IF EXISTS "Staff can read lead diagnostics" ON public.lead_diagnostics;
CREATE POLICY "Staff can read lead diagnostics"
ON public.lead_diagnostics FOR SELECT
TO authenticated
USING (true);

-- Inserção pública permitida para captação de leads da landing page
DROP POLICY IF EXISTS "Public can insert lead diagnostics" ON public.lead_diagnostics;
CREATE POLICY "Public can insert lead diagnostics"
ON public.lead_diagnostics FOR INSERT
TO anon, authenticated
WITH CHECK (true);
