-- Adiciona colunas de foto, categorias do Google Places e nicho detectado em prospecting_leads
ALTER TABLE public.prospecting_leads
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS place_types JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS primary_type TEXT,
  ADD COLUMN IF NOT EXISTS detected_niche TEXT;
