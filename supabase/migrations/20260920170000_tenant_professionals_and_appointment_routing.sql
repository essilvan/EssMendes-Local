-- ==============================================================================
-- Migration: Cadastro de Profissionais e Roteamento de Agendamento
-- Data: 20 de Setembro de 2026
-- ==============================================================================

-- 1. Criação da Tabela de Profissionais do Estabelecimento (tenant_professionals)
CREATE TABLE IF NOT EXISTS public.tenant_professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role_title VARCHAR(255) DEFAULT 'Profissional',
    specialty VARCHAR(255),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir adição de colunas caso a tabela já existisse com estrutura parcial
ALTER TABLE public.tenant_professionals ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.tenant_professionals ADD COLUMN IF NOT EXISTS role_title VARCHAR(255) DEFAULT 'Profissional';
ALTER TABLE public.tenant_professionals ADD COLUMN IF NOT EXISTS specialty VARCHAR(255);
ALTER TABLE public.tenant_professionals ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.tenant_professionals ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.tenant_professionals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tenant_professionals_tenant_id 
    ON public.tenant_professionals(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_professionals_active 
    ON public.tenant_professionals(tenant_id, is_active);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.tenant_professionals ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS para tenant_professionals
-- Leitura pública de profissionais ativos (vitrine pública de agendamento)
DROP POLICY IF EXISTS "Public can view active tenant_professionals" ON public.tenant_professionals;
CREATE POLICY "Public can view active tenant_professionals"
ON public.tenant_professionals FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Leitura completa por membros autenticados do tenant
DROP POLICY IF EXISTS "Members can view all tenant_professionals" ON public.tenant_professionals;
CREATE POLICY "Members can view all tenant_professionals"
ON public.tenant_professionals FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
);

-- Gestão completa (insert/update/delete) por membros autenticados do tenant
DROP POLICY IF EXISTS "Members can manage tenant_professionals" ON public.tenant_professionals;
CREATE POLICY "Members can manage tenant_professionals"
ON public.tenant_professionals FOR ALL
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

-- 4. Vínculo de professional_id na tabela appointments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'professional_id'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN professional_id UUID;
    END IF;

    -- Ajusta constraint de chave estrangeira com segurança
    ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_professional_id_fkey;
    ALTER TABLE public.appointments ADD CONSTRAINT appointments_professional_id_fkey 
        FOREIGN KEY (professional_id) REFERENCES public.tenant_professionals(id) ON DELETE SET NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint adjustment exception: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_professional_id 
    ON public.appointments(professional_id);
