-- =============================================================================
-- MIGRAÇÃO: Adicionar valores 'vet' e 'tutor' ao enum app_role
-- Arquivo: 20260324100001_enum_roles.sql
--
-- ⚠️  ATENÇÃO IMPORTANTE:
--     ALTER TYPE ADD VALUE não é transacional no PostgreSQL.
--     Execute este arquivo DIRETAMENTE no SQL Editor do Supabase,
--     NÃO via `supabase db push` (que usa transações implícitas).
--
-- Execute APÓS o arquivo 20260324100000_auth_roles_vet_tutor.sql
-- =============================================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vet';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tutor';
