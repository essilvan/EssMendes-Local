-- ============================================================================
-- Migração: Orçamentos Inteligentes por Placa e Revisões Preventivas (Automotivo)
-- Tabelas: public.vehicle_quotes e public.vehicle_maintenance_schedules
-- ============================================================================

-- 1. Tabela de Orçamentos por Placa (vehicle_quotes)
CREATE TABLE IF NOT EXISTS public.vehicle_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    license_plate TEXT NOT NULL,
    plate_display TEXT,
    vehicle_model TEXT,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    complaint TEXT,
    category_tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    parts_needed JSONB DEFAULT '[]'::jsonb,
    labor_cost NUMERIC(10, 2) DEFAULT 0,
    parts_cost NUMERIC(10, 2) DEFAULT 0,
    total_cost NUMERIC(10, 2) DEFAULT 0,
    scheduled_for TIMESTAMPTZ,
    mechanic_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_quotes_tenant_id ON public.vehicle_quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_quotes_license_plate ON public.vehicle_quotes(tenant_id, license_plate);

ALTER TABLE public.vehicle_quotes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para vehicle_quotes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'vehicle_quotes' AND policyname = 'Clientes podem solicitar orcamento publico'
    ) THEN
        CREATE POLICY "Clientes podem solicitar orcamento publico"
        ON public.vehicle_quotes
        FOR INSERT
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'vehicle_quotes' AND policyname = 'Membros do tenant podem gerenciar vehicle_quotes'
    ) THEN
        CREATE POLICY "Membros do tenant podem gerenciar vehicle_quotes"
        ON public.vehicle_quotes
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = vehicle_quotes.tenant_id
                AND tu.user_id = auth.uid()
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = vehicle_quotes.tenant_id
                AND tu.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 2. Tabela de Revisões Preventivas Programadas (vehicle_maintenance_schedules)
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    license_plate TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    vehicle_model TEXT,
    service_type TEXT NOT NULL,
    last_service_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    due_km INTEGER,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_tenant_id ON public.vehicle_maintenance_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_due_date ON public.vehicle_maintenance_schedules(tenant_id, due_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_plate ON public.vehicle_maintenance_schedules(tenant_id, license_plate);

ALTER TABLE public.vehicle_maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para vehicle_maintenance_schedules
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'vehicle_maintenance_schedules' AND policyname = 'Membros do tenant podem gerenciar vehicle_maintenance_schedules'
    ) THEN
        CREATE POLICY "Membros do tenant podem gerenciar vehicle_maintenance_schedules"
        ON public.vehicle_maintenance_schedules
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = vehicle_maintenance_schedules.tenant_id
                AND tu.user_id = auth.uid()
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = vehicle_maintenance_schedules.tenant_id
                AND tu.user_id = auth.uid()
            )
        );
    END IF;
END $$;

