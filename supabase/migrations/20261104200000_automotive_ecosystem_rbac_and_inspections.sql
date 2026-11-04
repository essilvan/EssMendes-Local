-- ==============================================================================
-- Migration: RBAC por Perfil, Nicho Modular e Ecossistema Operacional de Oficinas
-- Data: 04 de Novembro de 2026
-- ==============================================================================

-- 1. Garantir coluna 'niche' na tabela tenants
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS niche TEXT DEFAULT 'general';

UPDATE public.tenants
SET niche = 'automotive'
WHERE (niche IS NULL OR niche = 'general')
  AND (
    theme_niche ILIKE '%auto%'
    OR theme_niche ILIKE '%mecanic%'
    OR (theme_settings->>'niche') ILIKE '%auto%'
    OR (theme_settings->>'niche') ILIKE '%mecanic%'
  );

-- 2. Adicionar colunas operacionais na tabela vehicle_quotes
ALTER TABLE public.vehicle_quotes
    ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS damaged_parts_photos TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS post_sale_contacted BOOLEAN DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_quotes_public_token
    ON public.vehicle_quotes(public_token);

-- 3. Criar tabela de Vistoria Digital de Entrada (vehicle_inspections)
CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES public.vehicle_quotes(id) ON DELETE CASCADE,
    license_plate TEXT NOT NULL,
    entry_km INTEGER,
    fuel_level TEXT,
    photos TEXT[] DEFAULT '{}',
    scratch_notes TEXT,
    spare_tire BOOLEAN DEFAULT true,
    jack_tool BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_tenant_id
    ON public.vehicle_inspections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_quote_id
    ON public.vehicle_inspections(quote_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_license_plate
    ON public.vehicle_inspections(tenant_id, license_plate);

ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS para vehicle_inspections e leitura/aprovação pública de vehicle_quotes por token
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'vehicle_inspections' AND policyname = 'Membros do tenant podem gerenciar vehicle_inspections'
    ) THEN
        CREATE POLICY "Membros do tenant podem gerenciar vehicle_inspections"
        ON public.vehicle_inspections
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = vehicle_inspections.tenant_id
                AND tu.user_id = auth.uid()
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = vehicle_inspections.tenant_id
                AND tu.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'vehicle_quotes' AND policyname = 'Leitura publica de orcamento via token'
    ) THEN
        CREATE POLICY "Leitura publica de orcamento via token"
        ON public.vehicle_quotes
        FOR SELECT
        TO anon, authenticated
        USING (public_token IS NOT NULL);
    END IF;
END $$;

