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

-- Tabelas: authenticated pode escrever (RLS ainda se aplica)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;

-- Sequences: necessário para inserts em colunas serial/identity (quando existirem)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Defaults para futuras tabelas/sequences criadas pelo role que roda as migrations
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO authenticated;

-- Opcional (se você expõe algum catálogo público): liberar SELECT só da tabela `services` para anon.
-- (Mantém o resto fechado caso o app rode sem sessão.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'services'
      AND c.relkind = 'r'
  ) THEN
    GRANT SELECT ON TABLE public.services TO anon;
  END IF;
END $$;

