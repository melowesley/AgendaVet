-- =============================================================================
-- Migration: Grants para PostgREST (anon/authenticated)
-- Data: 2026-02-26
--
-- Sintoma corrigido:
--   "permission denied for table <tabela>" ao usar o app com a anon key.
--
-- Observação:
--   GRANT não ignora RLS. As políticas continuam sendo a camada de segurança.
-- =============================================================================

-- Garantir acesso ao schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Tabelas: anon só lê; authenticated pode escrever (RLS ainda se aplica)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;

-- Sequences: necessário para inserts em colunas serial/identity (quando existirem)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Defaults para futuras tabelas/sequences criadas pelo role que roda as migrations
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO authenticated;

