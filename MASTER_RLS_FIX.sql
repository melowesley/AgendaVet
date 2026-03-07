-- =============================================================================
-- MASTER_RLS_FIX.sql — Correção Definitiva de Segurança e Acesso (V2)
-- =============================================================================
-- Este script limpa e redefine TODAS as regras de segurança (RLS) para garantir
-- que Admins vejam tudo da sua clínica e Tutores vejam apenas seus próprios pets.
-- =============================================================================

DO $$ 
DECLARE
  t TEXT;
BEGIN
  -- 1. LISTA DE TODAS AS TABELAS RELEVANTES
  FOR t IN SELECT unnest(ARRAY[
    'profiles', 'pets', 'appointment_requests', 'anamnesis', 'pet_admin_history',
    'pet_services', 'services', 'mortes', 'pet_weight_records', 'pet_pathologies', 
    'pet_documents', 'pet_exams', 'pet_photos', 'pet_vaccines', 'pet_observations', 
    'pet_prescriptions', 'pet_videos', 'pet_hospitalizations'
  ]) LOOP
    -- Habilita RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    
    -- Limpa políticas antigas para evitar conflitos
    EXECUTE format('DROP POLICY IF EXISTS "admin_org_access" ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "tutor_access" ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "user_access" ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "tutor_update_own" ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "allow_insert_for_all" ON public.%I;', t);

    -- 2. REGRA PARA ADMINS (Acesso total à sua Organização)
    EXECUTE format('
      CREATE POLICY "admin_org_access" ON public.%I FOR ALL
      TO authenticated
      USING (organization_id = public.my_organization_id() AND public.is_admin())
      WITH CHECK (organization_id = public.my_organization_id() AND public.is_admin());
    ', t);

    -- 3. REGRA PARA TUTORES E USUÁRIOS AUTENTICADOS (Acesso limitado)
    IF t = 'services' THEN
       -- Catálogo de serviços: todos podem ver o que está ativo
       EXECUTE format('CREATE POLICY "user_access" ON public.%I FOR SELECT TO authenticated USING (active = true);', t);
    
    ELSIF t = 'profiles' THEN
       -- Perfis: Usuário vê o seu e Admins veem os da sua clínica
       EXECUTE format('CREATE POLICY "user_access" ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid());', t);
       EXECUTE format('CREATE POLICY "user_update" ON public.%I FOR UPDATE TO authenticated USING (user_id = auth.uid());', t);
       -- IMPORTANTE: Permitir insert de novos perfis durante cadastro
       EXECUTE format('CREATE POLICY "allow_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);', t);
    
    ELSIF t IN ('pets', 'appointment_requests') THEN
       -- Pets: Usuário vê os seus e pode criar novos
       EXECUTE format('CREATE POLICY "user_access" ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid());', t);
       EXECUTE format('CREATE POLICY "user_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());', t);
       EXECUTE format('CREATE POLICY "user_update" ON public.%I FOR UPDATE TO authenticated USING (user_id = auth.uid());', t);
    
    ELSE
       -- Tabelas de registros (vacinas, exames, etc): acesso via pet_id
       EXECUTE format('
         CREATE POLICY "user_access" ON public.%I FOR SELECT 
         TO authenticated 
         USING (pet_id IN (SELECT id FROM public.pets WHERE user_id = auth.uid()));
       ', t);
    END IF;

    -- 4. PERMISSÕES DE TABELA
    EXECUTE format('GRANT ALL ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
  END LOOP;
END $$;

-- 5. AJUSTE EXTRA: Garante que a Clínica Principal aceite novos usuários
INSERT INTO public.organizations (id, name, slug, plan)
VALUES ('a0000000-0000-0000-0000-000000000001'::UUID, 'Clínica Veterinária Principal', 'principal', 'pro')
ON CONFLICT (id) DO NOTHING;

-- ✅ SCRIPT CONCLUÍDO
