-- ==============================================================================
-- Migration: Analytics Events (Zero PII - LGPD Compliant)
-- Data: 14 de Agosto de 2026
-- ==============================================================================

-- 1. Tabela de Métricas e Eventos Agregados
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    event_name VARCHAR(100) NOT NULL, -- 'page_view', 'click_whatsapp', 'click_phone', 'click_directions', 'click_booking'
    device_type VARCHAR(50) DEFAULT 'desktop', -- 'mobile', 'desktop', 'tablet', 'unknown'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices otimizados para dashboards agregados
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant ON public.analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(tenant_id, event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(tenant_id, created_at);

-- 2. Habilitar Row-Level Security (RLS)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (RLS)
-- Permite inserção anônima para computar visualizações e cliques sem expor dados
DROP POLICY IF EXISTS "Public can record analytics events" ON public.analytics_events;
CREATE POLICY "Public can record analytics events"
ON public.analytics_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Apenas membros autenticados do tenant podem ler as métricas da sua empresa
DROP POLICY IF EXISTS "Members can view analytics events" ON public.analytics_events;
CREATE POLICY "Members can view analytics events"
ON public.analytics_events FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
);
