-- ==============================================================================
-- Migration: Auth & Multi-tenant Base Schema
-- Data: 14 de Agosto de 2026
-- ==============================================================================

-- 1. Criação do Enum de Roles (RBAC)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('owner', 'admin', 'staff');
    END IF;
END$$;

-- 2. Tabela de Tenants (Empresas / Negócios Locais)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    custom_domain VARCHAR(255) UNIQUE,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para busca rápida de tenants
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain);

-- 3. Tabela Associativa de Usuários e Tenants (Multi-tenant Desacoplado)
CREATE TABLE IF NOT EXISTS public.tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'owner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);

-- 4. Habilitar Row-Level Security (RLS)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS)
-- tenant_users: Usuário pode visualizar seus próprios registros de tenant
DROP POLICY IF EXISTS "Users can view their own tenant links" ON public.tenant_users;
CREATE POLICY "Users can view their own tenant links" 
ON public.tenant_users FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- tenants: Usuário pode visualizar empresas das quais faz parte
DROP POLICY IF EXISTS "Users can view their member tenants" ON public.tenants;
CREATE POLICY "Users can view their member tenants" 
ON public.tenants FOR SELECT 
TO authenticated 
USING (
    id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
);

-- tenants: Leitura pública do tenant pelo slug para a página pública
DROP POLICY IF EXISTS "Public can view tenant by slug" ON public.tenants;
CREATE POLICY "Public can view tenant by slug" 
ON public.tenants FOR SELECT 
TO anon 
USING (true);

-- tenants: Atualização dos dados da empresa por membros autorizados
DROP POLICY IF EXISTS "Members can update their own tenants" ON public.tenants;
CREATE POLICY "Members can update their own tenants"
ON public.tenants FOR UPDATE
TO authenticated
USING (
    id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
);

-- 6. Stored Procedure Atômica para Criação de Tenant e Vínculo de Owner
CREATE OR REPLACE FUNCTION public.create_tenant_and_owner(
    p_company_name TEXT,
    p_company_slug TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_final_slug TEXT;
    v_counter INT := 1;
BEGIN
    -- Captura o ID do usuário autenticado na sessão
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Operação não permitida: Usuário não autenticado.';
    END IF;

    -- Garante slug único adicionando sufixo se necessário
    v_final_slug := p_company_slug;
    WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = v_final_slug) LOOP
        v_final_slug := p_company_slug || '-' || v_counter;
        v_counter := v_counter + 1;
    END LOOP;

    -- Inserção do Tenant
    INSERT INTO public.tenants (name, slug)
    VALUES (p_company_name, v_final_slug)
    RETURNING id INTO v_tenant_id;

    -- Vínculo do Usuário como 'owner'
    INSERT INTO public.tenant_users (tenant_id, user_id, role)
    VALUES (v_tenant_id, v_user_id, 'owner');

    RETURN json_build_object(
        'tenant_id', v_tenant_id,
        'name', p_company_name,
        'slug', v_final_slug
    );
END;
$$;
