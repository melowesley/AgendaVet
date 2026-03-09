-- Script de Banco de Dados para o Dashboard Financeiro (AgendaVet)
-- Execute este script no SQL Editor do Supabase para criar a nova tabela payments e interligar com appointments

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointment_requests(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, cancelled, refunded
    payment_method TEXT, -- pix, credit_card, debit_card, cash
    payment_date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Adaptadas das tabelas anteriores)
CREATE POLICY "Usuários autenticados podem visualizar pagamentos" 
ON public.payments FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir pagamentos" 
ON public.payments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar pagamentos" 
ON public.payments FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar pagamentos" 
ON public.payments FOR DELETE 
USING (auth.role() = 'authenticated');
