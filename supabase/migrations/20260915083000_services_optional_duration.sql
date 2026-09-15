-- ==============================================================================
-- Migration: Tornar Duração de Serviços Opcional e Adicionar Flag show_duration
-- Data: 15 de Setembro de 2026
-- ==============================================================================

-- 1. Permitir duração opcional/nula na tabela services
ALTER TABLE public.services ALTER COLUMN duration_minutes DROP NOT NULL;
ALTER TABLE public.services ALTER COLUMN duration_minutes SET DEFAULT NULL;

-- 2. Adicionar flag explícita show_duration para controle de exibição na vitrine pública
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS show_duration BOOLEAN DEFAULT false;

-- 3. Documentação das colunas
COMMENT ON COLUMN public.services.duration_minutes IS 'Duração estimada do serviço em minutos. Opcional (recomendado para barbearias, clínicas e salões).';
COMMENT ON COLUMN public.services.show_duration IS 'Quando verdadeiro, força a exibição do tempo de duração no card mesmo fora de nichos de agendamento.';
