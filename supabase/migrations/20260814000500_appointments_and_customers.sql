-- ==============================================================================
-- Migration: Appointments & Customers Management (Idempotent / Upgrade Safe)
-- Data: 15 de Agosto de 2026
-- ==============================================================================

-- 1. Extensão para índices GIST com tipos escalares (btree_gist)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Enum de Status do Agendamento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'canceled');
    END IF;
END$$;

-- 3. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(tenant_id, phone);

-- 4. Tabela de Agendamentos (Criação ou Ajuste de Colunas)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_name VARCHAR(255),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    total_duration INTEGER NOT NULL DEFAULT 30,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status appointment_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir adição de colunas caso a tabela já existisse
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_name VARCHAR(255);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS total_duration INTEGER DEFAULT 30;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Flexibilizar constraints legadas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'professional_id'
    ) THEN
        ALTER TABLE public.appointments ALTER COLUMN professional_id DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'booking_period'
    ) THEN
        ALTER TABLE public.appointments ALTER COLUMN booking_period DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE public.appointments ALTER COLUMN customer_id DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'service_id'
    ) THEN
        ALTER TABLE public.appointments ALTER COLUMN service_id DROP NOT NULL;
    END IF;
END$$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_status ON public.appointments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_time ON public.appointments(tenant_id, start_time, end_time);

-- 5. Habilitar Row-Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Segurança: customers
DROP POLICY IF EXISTS "Public and users can insert customers" ON public.customers;
CREATE POLICY "Public and users can insert customers"
ON public.customers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Members can manage tenant customers" ON public.customers;
CREATE POLICY "Members can manage tenant customers"
ON public.customers FOR ALL
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

-- 7. Políticas de Segurança: appointments
DROP POLICY IF EXISTS "Public can view appointments for slot calculation" ON public.appointments;
CREATE POLICY "Public can view appointments for slot calculation"
ON public.appointments FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Public and users can insert appointments" ON public.appointments;
CREATE POLICY "Public and users can insert appointments"
ON public.appointments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view tenant appointments" ON public.appointments;
CREATE POLICY "Members can view tenant appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Members can update tenant appointments" ON public.appointments;
CREATE POLICY "Members can update tenant appointments"
ON public.appointments FOR UPDATE
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

DROP POLICY IF EXISTS "Members can delete tenant appointments" ON public.appointments;
CREATE POLICY "Members can delete tenant appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
);
