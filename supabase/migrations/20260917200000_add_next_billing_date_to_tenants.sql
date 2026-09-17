-- ==============================================================================
-- Migration: Add next_billing_date to tenants table
-- Data: 17 de Setembro de 2026
-- ==============================================================================

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;
