-- =============================================================================
-- MIGRAÇÃO: Custom Access Token Hook — injeta role e status no JWT
-- Arquivo: 20260324100003_custom_access_token_hook.sql
--
-- Este hook é chamado pelo Supabase Auth ao gerar cada JWT.
-- Ele lê user_roles e injeta { role, status } em app_metadata do token.
--
-- APÓS executar este SQL, ative o hook no painel Supabase:
--   Authentication → Hooks → Custom Access Token Hook
--   → Function: public.custom_access_token_hook
-- =============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims   jsonb;
  user_row record;
BEGIN
  claims := event -> 'claims';

  -- Buscar role e status do usuário
  SELECT role::text, status
    INTO user_row
    FROM public.user_roles
   WHERE user_id = (event ->> 'user_id')::uuid
   LIMIT 1;

  IF FOUND THEN
    claims := jsonb_set(claims, '{app_metadata,role}',   to_jsonb(user_row.role));
    claims := jsonb_set(claims, '{app_metadata,status}', to_jsonb(user_row.status));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Conceder permissão de execução ao Supabase Auth (supabase_auth_admin)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revogar acesso público (segurança)
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated;
