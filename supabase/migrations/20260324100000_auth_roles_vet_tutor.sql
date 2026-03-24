-- =============================================================================
-- MIGRAÇÃO: Sistema de autenticação multi-role (vet / tutor / admin)
-- Arquivo: 20260324100000_auth_roles_vet_tutor.sql
--
-- ATENÇÃO — Executar em 4 passos no SQL Editor do Supabase:
--   Passo 1: este arquivo (enum + tabelas + RPC)
--   Passo 2: 20260324100001_enum_roles.sql  (ALTER TYPE — não transacional)
--   Passo 3: 20260324100002_financial_records.sql
--   Passo 4: 20260324100003_custom_access_token_hook.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Adicionar colunas de perfil em `profiles` (idade, genero)
--    e garantir UNIQUE(user_id) para o ON CONFLICT do RPC funcionar
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS idade   int,
  ADD COLUMN IF NOT EXISTS genero  text CHECK (genero IN ('masculino', 'feminino'));

-- UNIQUE já existe no setup original (user_id UUID NOT NULL UNIQUE), mas
-- adicionamos IF NOT EXISTS para segurança em ambientes parcialmente migrados.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_user_id_unique'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Adicionar campo `status` em `user_roles`
--    e constraint UNIQUE por user_id (para ON CONFLICT no RPC)
-- -----------------------------------------------------------------------------
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'rejected'));

-- O setup original usa UNIQUE(user_id, role). Para o RPC de upsert por user_id
-- precisamos de um índice único só em user_id.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_user_id_unique'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Tabela `approval_tokens` — tokens de aprovação para secretários/vets
--    Apenas service_role acessa (sem RLS policies públicas).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approval_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      text        NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '72 hours',
  used       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_tokens ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy pública — somente service_role (chave de serviço) acessa.

-- -----------------------------------------------------------------------------
-- 4. RPC `register_user_profile` — criação atômica de profile + user_role
--    Chamada com a service_role key (SECURITY DEFINER).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_user_profile(
  p_user_id   uuid,
  p_full_name text,
  p_role      public.app_role,
  p_status    text,
  p_idade     int  DEFAULT NULL,
  p_genero    text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert em profiles
  INSERT INTO public.profiles (user_id, full_name, idade, genero, updated_at)
  VALUES (p_user_id, p_full_name, p_idade, p_genero, now())
  ON CONFLICT (user_id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        idade      = EXCLUDED.idade,
        genero     = EXCLUDED.genero,
        updated_at = now();

  -- Upsert em user_roles
  INSERT INTO public.user_roles (user_id, role, status)
  VALUES (p_user_id, p_role, p_status)
  ON CONFLICT (user_id) DO UPDATE
    SET role   = EXCLUDED.role,
        status = EXCLUDED.status;
END;
$$;
