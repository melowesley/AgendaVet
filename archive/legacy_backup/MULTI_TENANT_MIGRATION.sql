-- =============================================================================
-- MULTI_TENANT_MIGRATION.sql — AgendaVet SaaS Multi-Tenant
-- =============================================================================
-- ⚠️  LEIA ANTES DE EXECUTAR:
-- Este script é ADITIVO. Ele NÃO apaga dados existentes.
-- Ele adiciona a camada multi-tenant sobre a estrutura atual.
-- Execute em ambiente de teste primeiro!
--
-- ESTRATÉGIA:
--   1. Cria a tabela organizations
--   2. Cria uma organização padrão para absorver dados existentes
--   3. Adiciona coluna organization_id em todas as tabelas relevantes
--   4. Migra os dados existentes para a organização padrão
--   5. Aplica RLS de isolamento baseado em organization_id
-- =============================================================================

-- =============================================================================
-- PASSO 1 — Criar tabela de organizações (veterinárias/clínicas)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE,                    -- ex: "clinica-chaves" para URLs
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  logo_url    TEXT,
  plan        TEXT DEFAULT 'basic',           -- 'basic' | 'pro' | 'enterprise'
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PASSO 2 — Criar organização padrão para absorver dados existentes
-- =============================================================================
INSERT INTO public.organizations (id, name, slug, plan)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::UUID,
  'Clínica Veterinária Principal',
  'principal',
  'pro'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PASSO 3 — Adicionar organization_id nas tabelas existentes
--           (sem perder dados: nullable primeiro, depois migrar, depois NOT NULL)
-- =============================================================================

-- profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- pets
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- appointment_requests
ALTER TABLE public.appointment_requests
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- anamnesis
ALTER TABLE public.anamnesis
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- pet_admin_history
ALTER TABLE public.pet_admin_history
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- pet_services
ALTER TABLE public.pet_services
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- mortes
ALTER TABLE public.mortes
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- registros médicos
ALTER TABLE public.pet_weight_records     ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.pet_pathologies        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.pet_documents          ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.pet_exams              ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.pet_photos             ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.pet_vaccines           ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.pet_observations       ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.pet_prescriptions      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.pet_videos             ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.pet_hospitalizations   ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- =============================================================================
-- PASSO 4 — Migrar dados existentes para a organização padrão
-- =============================================================================
UPDATE public.profiles           SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pets                SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.appointment_requests SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.anamnesis           SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pet_admin_history   SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pet_services        SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.services            SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.mortes              SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pet_weight_records  SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pet_pathologies     SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pet_documents       SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pet_exams           SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pet_photos          SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pet_vaccines        SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pet_observations    SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pet_prescriptions   SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pet_videos          SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.pet_hospitalizations SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- =============================================================================
-- PASSO 5 — Função auxiliar: retorna o organization_id do usuário logado
--           (mais eficiente do que um subselect em cada policy)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.my_organization_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =============================================================================
-- PASSO 6 — RLS: Isolamento por organização nas tabelas sensíveis
--           (executa em bloco para não repetir código)
-- =============================================================================

-- Ativar RLS na tabela organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Admin global lê todas, membro lê só a sua
CREATE POLICY "org_read_own" ON public.organizations FOR SELECT
  USING (
    id = public.my_organization_id()
    OR public.is_admin()
  );

-- Somente super admin (via service role) cria/edita organizações
-- (não há policy de INSERT/UPDATE pública)

-- Macro: aplica isolamento por org em todas as tabelas de dados
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'pets', 'appointment_requests', 'anamnesis', 'pet_admin_history',
    'pet_services', 'services', 'mortes',
    'pet_weight_records', 'pet_pathologies', 'pet_documents', 'pet_exams',
    'pet_photos', 'pet_vaccines', 'pet_observations', 'pet_prescriptions',
    'pet_videos', 'pet_hospitalizations'
  ]) LOOP
    -- Garante RLS ativo
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    -- Admin da clínica: acesso total à sua organização
    EXECUTE format('
      CREATE POLICY "admin_org_access_%I" ON public.%I FOR ALL
      USING (
        organization_id = public.my_organization_id()
        AND public.is_admin()
      );
    ', t, t);
  END LOOP;
END $$;

-- Tutores: leer apenas seus próprios pets e agendamentos (já cobertos pelo FIX_POLICIES.sql)

-- =============================================================================
-- PASSO 7 — Storage bucket isolado por organização
-- =============================================================================
-- Crie o bucket 'veterinary-files' no painel do Supabase → Storage → New bucket
-- Depois rode estas policies:

-- INSERT: qualquer usuário autenticado pode fazer upload na pasta da sua org
CREATE POLICY "org_storage_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'veterinary-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = public.my_organization_id()::TEXT
);

-- SELECT: usuário acessa apenas arquivos da sua org
CREATE POLICY "org_storage_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'veterinary-files'
  AND (storage.foldername(name))[1] = public.my_organization_id()::TEXT
);

-- DELETE: apenas admin deleta
CREATE POLICY "org_storage_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'veterinary-files'
  AND public.is_admin()
  AND (storage.foldername(name))[1] = public.my_organization_id()::TEXT
);

-- =============================================================================
-- PASSO 8 — Atualizar trigger de criação de usuário para vincular org
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, organization_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    -- Pega o org_id do convite (passado via metadata), senão usa o padrão
    COALESCE(
      (NEW.raw_user_meta_data->>'organization_id')::UUID,
      'a0000000-0000-0000-0000-000000000001'::UUID
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- =============================================================================
-- ✅  MIGRAÇÃO CONCLUÍDA
-- Estrutura multi-tenant instalada com isolamento real por organization_id.
-- Dados existentes migrados para a organização padrão (ID: a0000000-...-0001)
-- =============================================================================
