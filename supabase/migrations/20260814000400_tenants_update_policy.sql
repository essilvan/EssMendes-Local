-- ==============================================================================
-- Migration: Add UPDATE policy to tenants for authenticated members
-- Data: 14 de Agosto de 2026
-- ==============================================================================

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
