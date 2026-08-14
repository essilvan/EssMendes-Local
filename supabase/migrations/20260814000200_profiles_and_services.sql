-- ==============================================================================
-- Migration: Tenant Profiles & Services Management
-- Data: 14 de Agosto de 2026
-- ==============================================================================

-- 1. Tabela de Perfis do Estabelecimento (Branding & Dados Públicos)
CREATE TABLE IF NOT EXISTS public.tenant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
    description TEXT,
    phone_whatsapp VARCHAR(50),
    address TEXT,
    logo_url TEXT,
    template_id VARCHAR(50) NOT NULL DEFAULT 'default',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_profiles_tenant_id ON public.tenant_profiles(tenant_id);

-- 2. Tabela de Catálogo de Serviços
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON public.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant_active ON public.services(tenant_id, is_active);

-- 3. Habilitar Row-Level Security (RLS)
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança: tenant_profiles
DROP POLICY IF EXISTS "Public can view tenant profiles" ON public.tenant_profiles;
CREATE POLICY "Public can view tenant profiles"
ON public.tenant_profiles FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Members can manage tenant profiles" ON public.tenant_profiles;
CREATE POLICY "Members can manage tenant profiles"
ON public.tenant_profiles FOR ALL
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

-- 5. Políticas de Segurança: services
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
ON public.services FOR SELECT
TO anon
USING (is_active = true);

DROP POLICY IF EXISTS "Members can view all tenant services" ON public.services;
CREATE POLICY "Members can view all tenant services"
ON public.services FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Members can manage tenant services" ON public.services;
CREATE POLICY "Members can manage tenant services"
ON public.services FOR ALL
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
