-- Módulo Financeiro: tabela de lançamentos financeiros
-- Execute no Supabase Studio → SQL Editor

create table if not exists public.financial_records (
  id uuid default gen_random_uuid() primary key,
  appointment_id uuid references public.appointment_requests(id) on delete set null,
  pet_id uuid references public.pets(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('receita', 'despesa')),
  category text not null default 'outro',
  description text,
  amount numeric(10,2) not null default 0,
  payment_method text check (payment_method in ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'outro')),
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  due_date date,
  paid_at timestamp with time zone,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- RLS
alter table public.financial_records enable row level security;

create policy "Authenticated users can manage financial records"
  on public.financial_records
  for all
  using (auth.uid() is not null);

-- Índices
create index if not exists financial_records_appointment_id_idx on public.financial_records(appointment_id);
create index if not exists financial_records_created_at_idx on public.financial_records(created_at desc);
create index if not exists financial_records_status_idx on public.financial_records(status);
create index if not exists financial_records_type_idx on public.financial_records(type);
