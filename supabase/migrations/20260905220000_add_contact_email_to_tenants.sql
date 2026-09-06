-- ==============================================================================
-- Migration: Add contact_email to tenants table
-- Data: 05 de Setembro de 2026
-- ==============================================================================

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_tenants_contact_email ON public.tenants(contact_email);
