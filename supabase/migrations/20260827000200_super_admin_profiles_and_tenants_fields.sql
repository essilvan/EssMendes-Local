-- ==============================================================================
-- Migration: Profiles RLS & Tenants City/Phone Fields
-- Data: 27 de Agosto de 2026
-- ==============================================================================

-- 1. Criação / Ajuste da tabela public.profiles para RBAC do usuário
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'tenant_owner',
    full_name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Habilita RLS e cria políticas sem recursão infinita
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (id = auth.uid());

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

-- 3. Adiciona colunas diretas city e phone na tabela tenants (se não existirem)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS city VARCHAR(150);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- 4. Preenche city e phone a partir de tenant_profiles caso existam registros
UPDATE public.tenants t
SET 
    city = COALESCE(t.city, tp.address),
    phone = COALESCE(t.phone, tp.phone_whatsapp)
FROM public.tenant_profiles tp
WHERE t.id = tp.tenant_id
AND (t.city IS NULL OR t.phone IS NULL);
