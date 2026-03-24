-- supabase/migrations/20260321_enum_roles.sql
-- ATENÇÃO: ALTER TYPE ADD VALUE não é transacional.
-- Executar este arquivo diretamente no SQL Editor do Supabase,
-- NÃO via supabase db push (que usa transações).

ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'vet';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'tutor';
