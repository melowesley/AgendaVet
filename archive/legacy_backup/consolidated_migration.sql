-- =============================================================================
-- CONSOLIDATED_MIGRATION.sql — Migração SaaS Profissional AgendaVet
-- =============================================================================
-- Este script combina Políticas de Segurança (RLS) e Infraestrutura Multi-tenant.
-- ⚠️  AVISO: Execute isto no SQL Editor do Supabase.
-- =============================================================================

-- 0. LIMPEZA E FUNÇÕES INICIAIS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::TEXT = 'admin'
  )
$$;

-- 1. INFRAESTRUTURA MULTI-TENANT
CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE,
  plan        TEXT DEFAULT 'basic',
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Organização Padrão (absorve os dados existentes)
INSERT INTO public.organizations (id, name, slug, plan)
VALUES ('a0000000-0000-0000-0000-000000000001'::UUID, 'Clínica Veterinária Principal', 'principal', 'pro')
ON CONFLICT (id) DO NOTHING;

-- 2. ADICIONAR organization_id EM TODAS AS TABELAS
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles', 'pets', 'appointment_requests', 'anamnesis', 'pet_admin_history',
    'pet_services', 'services', 'mortes', 'pet_weight_records', 'pet_pathologies', 
    'pet_documents', 'pet_exams', 'pet_photos', 'pet_vaccines', 'pet_observations', 
    'pet_prescriptions', 'pet_videos', 'pet_hospitalizations'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;', t);
    -- Migrar registros existentes (nulos) para a organização padrão
    EXECUTE format('UPDATE public.%I SET organization_id = ''a0000000-0000-0000-0000-000000000001'' WHERE organization_id IS NULL;', t);
  END LOOP;
END $$;

-- 3. AUXILIAR PARA RLS
CREATE OR REPLACE FUNCTION public.my_organization_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 4. GATILHO INTELIGENTE (SMART TRIGGER): organization_id AUTOMÁTICO NO INSERT
-- Isso garante que quando um veterinário criar um registro, ele seja vinculado à sua clínica automaticamente.
CREATE OR REPLACE FUNCTION public.set_organization_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.my_organization_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'pets', 'appointment_requests', 'anamnesis', 'pet_admin_history',
    'pet_services', 'pet_weight_records', 'pet_pathologies', 
    'pet_documents', 'pet_exams', 'pet_photos', 'pet_vaccines', 'pet_observations', 
    'pet_prescriptions', 'pet_videos', 'pet_hospitalizations'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS tr_set_org_id ON public.%I;', t);
    EXECUTE format('CREATE TRIGGER tr_set_org_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_on_insert();', t);
  END LOOP;
END $$;

-- 5. POLÍTICAS RLS (Consolidadas)
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'pets', 'appointment_requests', 'anamnesis', 'pet_admin_history',
    'pet_services', 'services', 'mortes', 'pet_weight_records', 'pet_pathologies', 
    'pet_documents', 'pet_exams', 'pet_photos', 'pet_vaccines', 'pet_observations', 
    'pet_prescriptions', 'pet_videos', 'pet_hospitalizations'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    -- Limpar políticas antigas
    EXECUTE format('DROP POLICY IF EXISTS "admin_org_access" ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "User read own" ON public.%I;', t);
    
    -- ISOLAMENTO POR CLÍNICA: Admin/Staff só podem ver os dados de sua própria Organização
    EXECUTE format('
      CREATE POLICY "admin_org_access" ON public.%I FOR ALL
      USING (organization_id = public.my_organization_id() AND public.is_admin());
    ', t);

    -- ACESSO DO TUTOR:
    IF t = 'services' THEN
       -- Tabela de catálogo: usuários podem ver todos os serviços ativos
       EXECUTE format('CREATE POLICY "User read own" ON public.%I FOR SELECT USING (active = true);', t);
    ELSIF t IN ('pets', 'appointment_requests') THEN
       -- Tabelas vinculadas diretamente ao user_id
       EXECUTE format('CREATE POLICY "User read own" ON public.%I FOR SELECT USING (user_id = auth.uid());', t);
    ELSE
       -- Tabelas vinculadas ao pet_id
       EXECUTE format('CREATE POLICY "User read own" ON public.%I FOR SELECT USING (pet_id IN (SELECT id FROM public.pets WHERE user_id = auth.uid()));', t);
    END IF;
  END LOOP;
END $$;

-- 6. GATILHO DE PERFIS (Atualizado com suporte a Organização)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, organization_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'organization_id')::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ✅ CONCLUÍDO
