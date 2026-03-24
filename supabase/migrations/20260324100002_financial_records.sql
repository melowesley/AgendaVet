-- =============================================================================
-- MIGRAÇÃO: Tabela financial_records — Módulo Financeiro
-- Arquivo: 20260324100002_financial_records.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.financial_records (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid        REFERENCES public.appointment_requests(id) ON DELETE SET NULL,
  pet_id         uuid        REFERENCES public.pets(id) ON DELETE SET NULL,
  profile_id     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  type           text        NOT NULL CHECK (type IN ('receita', 'despesa')),
  category       text        NOT NULL DEFAULT 'outro',
  description    text,
  amount         numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text        CHECK (payment_method IN (
                               'dinheiro', 'cartao_credito', 'cartao_debito',
                               'pix', 'transferencia', 'outro'
                             )),
  status         text        NOT NULL DEFAULT 'pendente'
                               CHECK (status IN ('pendente', 'pago', 'cancelado')),
  due_date       date,
  paid_at        timestamptz,
  notes          text,
  created_by     uuid        REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at     timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- RLS: qualquer usuário autenticado pode gerenciar lançamentos
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage financial records"
  ON public.financial_records;

CREATE POLICY "Authenticated users can manage financial records"
  ON public.financial_records
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE TRIGGER financial_records_updated_at
  BEFORE UPDATE ON public.financial_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices de performance
CREATE INDEX IF NOT EXISTS financial_records_appointment_id_idx
  ON public.financial_records(appointment_id);

CREATE INDEX IF NOT EXISTS financial_records_created_at_idx
  ON public.financial_records(created_at DESC);

CREATE INDEX IF NOT EXISTS financial_records_status_idx
  ON public.financial_records(status);

CREATE INDEX IF NOT EXISTS financial_records_type_idx
  ON public.financial_records(type);
