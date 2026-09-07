-- ==============================================================================
-- Migration: Função auxiliar para captura de ID de usuário por e-mail (Auth)
-- Data: 06 de Setembro de 2026
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF user_email IS NULL OR TRIM(user_email) = '' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE LOWER(email) = LOWER(TRIM(user_email)) 
  LIMIT 1;

  RETURN v_user_id;
END;
$$;
