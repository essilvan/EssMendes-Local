-- Adiciona colunas website e region na tabela prospecting_leads
ALTER TABLE public.prospecting_leads
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT;
