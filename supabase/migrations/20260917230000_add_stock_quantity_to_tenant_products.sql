-- ==============================================================================
-- Migration: Add stock_quantity to tenant_products
-- Data: 17 de Setembro de 2026
-- Empresa: EssMendes Tecnologia
-- ==============================================================================

-- 1. Adicionar coluna de quantidade em estoque (NULL = Ilimitado / Sob Encomenda)
ALTER TABLE public.tenant_products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL;

-- 2. Comentário explicativo
COMMENT ON COLUMN public.tenant_products.stock_quantity IS 'Quantidade física em estoque. NULL indica estoque ilimitado ou sob encomenda. Valores >= 0 controlam contagem exata.';

-- 3. Índice para filtragem rápida de produtos disponíveis e em estoque
CREATE INDEX IF NOT EXISTS idx_tenant_products_stock
ON public.tenant_products(tenant_id, is_available, stock_quantity);
