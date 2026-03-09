-- Script de Banco de Dados para Cobranças (AgendaVet)
-- Execute este script no SQL Editor do Supabase para criar as tabelas necessárias

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, cancelled
    due_date TIMESTAMP WITH TIME ZONE,
    receipt_url TEXT,
    payment_method TEXT, -- pix, cash, card
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Políticas para Invoices
CREATE POLICY "Vet e Admins podem ver todas as faturas" 
ON public.invoices FOR SELECT 
USING (public.has_role(auth.uid(), 'vet') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vet e Admins podem criar e editar faturas" 
ON public.invoices FOR ALL 
USING (public.has_role(auth.uid(), 'vet') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutores podem ver suas próprias faturas" 
ON public.invoices FOR SELECT 
USING (auth.uid() = owner_id);

-- Políticas para Invoice Items
CREATE POLICY "Vet e Admins podem ver itens de faturas" 
ON public.invoice_items FOR SELECT 
USING (public.has_role(auth.uid(), 'vet') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vet e Admins podem criar itens de faturas" 
ON public.invoice_items FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'vet') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutores podem ver seus itens de fatura" 
ON public.invoice_items FOR SELECT 
USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE owner_id = auth.uid()
  )
);
