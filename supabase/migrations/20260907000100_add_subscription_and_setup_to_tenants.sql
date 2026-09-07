-- ==============================================================================
-- Migration: Campos de Assinatura, Setup e Ofertas no Tenant
-- Data: 07 de Setembro de 2026
-- ==============================================================================

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trialing';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(100);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS setup_paid BOOLEAN DEFAULT false;
