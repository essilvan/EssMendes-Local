-- ==============================================================================
-- Migration: Super Admin & Hybrid Multi-Tenant Management
-- Data: 27 de Agosto de 2026
-- ==============================================================================

-- 1. Expansão do Enum de Roles para incluir 'super_admin'
DO $$
BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION
    WHEN duplicate_object THEN null;
END$$;

-- 2. Função Auxiliar de Verificação de Super Admin (Segurança Definida)
CREATE OR REPLACE FUNCTION public.is_user_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = p_user_id
        AND (
            u.raw_user_meta_data->>'role' = 'super_admin'
            OR u.raw_app_meta_data->>'role' = 'super_admin'
        )
    ) OR EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.user_id = p_user_id
        AND tu.role = 'super_admin'
    );
END;
$$;

-- 3. Políticas RLS para Super Admin na tabela 'tenants'
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
CREATE POLICY "Super admins can view all tenants" 
ON public.tenants FOR SELECT 
TO authenticated 
USING (
    public.is_user_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Super admins can manage all tenants" ON public.tenants;
CREATE POLICY "Super admins can manage all tenants" 
ON public.tenants FOR ALL 
TO authenticated 
USING (
    public.is_user_super_admin(auth.uid())
)
WITH CHECK (
    public.is_user_super_admin(auth.uid())
);

-- 4. Políticas RLS para Super Admin gerenciar tabelas filhas de tenants
-- tenant_profiles
DROP POLICY IF EXISTS "Super admins can manage tenant profiles" ON public.tenant_profiles;
CREATE POLICY "Super admins can manage tenant profiles"
ON public.tenant_profiles FOR ALL
TO authenticated
USING (public.is_user_super_admin(auth.uid()))
WITH CHECK (public.is_user_super_admin(auth.uid()));

-- services
DROP POLICY IF EXISTS "Super admins can manage services" ON public.services;
CREATE POLICY "Super admins can manage services"
ON public.services FOR ALL
TO authenticated
USING (public.is_user_super_admin(auth.uid()))
WITH CHECK (public.is_user_super_admin(auth.uid()));

-- tenant_products
DROP POLICY IF EXISTS "Super admins can manage tenant products" ON public.tenant_products;
CREATE POLICY "Super admins can manage tenant products"
ON public.tenant_products FOR ALL
TO authenticated
USING (public.is_user_super_admin(auth.uid()))
WITH CHECK (public.is_user_super_admin(auth.uid()));

-- tenant_reviews
DROP POLICY IF EXISTS "Super admins can manage tenant reviews" ON public.tenant_reviews;
CREATE POLICY "Super admins can manage tenant reviews"
ON public.tenant_reviews FOR ALL
TO authenticated
USING (public.is_user_super_admin(auth.uid()))
WITH CHECK (public.is_user_super_admin(auth.uid()));

-- tenant_posts
DROP POLICY IF EXISTS "Super admins can manage tenant posts" ON public.tenant_posts;
CREATE POLICY "Super admins can manage tenant posts"
ON public.tenant_posts FOR ALL
TO authenticated
USING (public.is_user_super_admin(auth.uid()))
WITH CHECK (public.is_user_super_admin(auth.uid()));

-- tenant_integrations
DROP POLICY IF EXISTS "Super admins can manage tenant integrations" ON public.tenant_integrations;
CREATE POLICY "Super admins can manage tenant integrations"
ON public.tenant_integrations FOR ALL
TO authenticated
USING (public.is_user_super_admin(auth.uid()))
WITH CHECK (public.is_user_super_admin(auth.uid()));

-- tenant_opportunities
DROP POLICY IF EXISTS "Super admins can manage tenant opportunities" ON public.tenant_opportunities;
CREATE POLICY "Super admins can manage tenant opportunities"
ON public.tenant_opportunities FOR ALL
TO authenticated
USING (public.is_user_super_admin(auth.uid()))
WITH CHECK (public.is_user_super_admin(auth.uid()));
