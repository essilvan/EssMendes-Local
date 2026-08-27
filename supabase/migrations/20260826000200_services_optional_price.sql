-- Migração para permitir preço opcional / nulo no catálogo de serviços
-- EssMendes Local: Suporte a serviços com "Sob Consulta" e "Orçamento Gratuito"

ALTER TABLE public.services ALTER COLUMN price DROP NOT NULL;
ALTER TABLE public.services ALTER COLUMN price SET DEFAULT NULL;

COMMENT ON COLUMN public.services.price IS 'Preço em BRL. Quando nulo ou zero, o serviço é considerado sob consulta / orçamento gratuito.';
