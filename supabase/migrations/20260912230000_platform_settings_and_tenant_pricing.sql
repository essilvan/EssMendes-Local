-- ==============================================================================
-- Migration: Configurações Globais de Pagamento (Platform Settings) e Precificação Customizada
-- Data: 12 de Setembro de 2026
-- ==============================================================================

-- 1. Tabela de configurações globais da plataforma (Chave Pix, Titular da Agência, etc.)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilita RLS estrito
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Leitura pública liberada para que a vitrine e o painel de assinatura acessem a chave Pix da agência
DROP POLICY IF EXISTS "Leitura pública permitida para platform_settings" ON public.platform_settings;
CREATE POLICY "Leitura pública permitida para platform_settings"
ON public.platform_settings
FOR SELECT
USING (true);

-- Gravação permitida exclusivamente via service_role
DROP POLICY IF EXISTS "Gravação permitida apenas via service_role" ON public.platform_settings;
CREATE POLICY "Gravação permitida apenas via service_role"
ON public.platform_settings
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 2. Valores padrão iniciais para as configurações da agência
INSERT INTO public.platform_settings (key, value, updated_at)
VALUES 
    ('pix_agency_key', 'essilvanmendes@gmail.com', now()),
    ('pix_agency_holder', 'EssMendes Tecnologia', now())
ON CONFLICT (key) DO NOTHING;

-- 3. Adiciona colunas de precificação e controle de setup em tenants se não existirem
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS setup_fee_amount NUMERIC(10, 2) DEFAULT 197.00;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS setup_fee_paid BOOLEAN DEFAULT false;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS setup_paid_at TIMESTAMPTZ;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMPTZ;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS monthly_fee_amount NUMERIC(10, 2) DEFAULT 97.00;
