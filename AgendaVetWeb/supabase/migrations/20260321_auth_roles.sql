-- supabase/migrations/20260321_auth_roles.sql

-- profiles: adicionar campos de perfil para vet/tutor
-- e garantir UNIQUE(user_id) para o ON CONFLICT do RPC funcionar
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS idade int,
  ADD COLUMN IF NOT EXISTS genero text CHECK (genero IN ('masculino', 'feminino'));

ALTER TABLE profiles
  ADD CONSTRAINT IF NOT EXISTS profiles_user_id_unique UNIQUE (user_id);

-- user_roles: adicionar campo status e constraint de unicidade por usuário
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'rejected'));

ALTER TABLE user_roles
  ADD CONSTRAINT IF NOT EXISTS user_roles_user_id_unique UNIQUE (user_id);

-- approval_tokens: tokens de aprovação para secretários
CREATE TABLE IF NOT EXISTS approval_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '72 hours',
  used        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS para approval_tokens (apenas service_role pode ler/escrever)
ALTER TABLE approval_tokens ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy pública: somente service_role acessa.
