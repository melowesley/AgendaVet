-- =============================================================================
-- FIX_POLICIES.sql — Arquitetura de Segurança Definitiva (AgendaVet)
-- =============================================================================
-- Este script limpa TODAS as policies antigas e recria uma estrutura profissional,
-- baseada estritamente no papel (admin) vs (user), garantindo a integridade
-- clínica dos dados e acesso "blindado".
-- =============================================================================

-- 0. Função utilitária para checar permissão de admin:
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::TEXT = 'admin'
  )
$$;

-- 1. Limpar TODAS as policies antigas nas tabelas do sistema para um "Clean Slate"
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'user_roles', 'profiles', 'pets', 'services', 
        'appointment_requests', 'anamnesis', 'pet_admin_history', 
        'pet_weight_records', 'pet_pathologies', 'pet_documents', 
        'pet_exams', 'pet_photos', 'pet_vaccines', 'pet_prescriptions', 
        'pet_observations', 'pet_videos', 'pet_hospitalizations', 
        'mortes', 'audit_logs'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;


-- =============================================================================
-- 1️⃣ USER_ROLES (Base da Autorização)
-- =============================================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Usuário apenas lê a própria linha
CREATE POLICY "Users read own role"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Admin lê todas
CREATE POLICY "Admin read all roles"
ON public.user_roles FOR SELECT
USING (public.is_admin());

-- (Não há política de INSERT/UPDATE/DELETE. Edição de papéis deve ser via console/SQL)


-- =============================================================================
-- 2️⃣ PROFILES (Perfis)
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access profiles"
ON public.profiles FOR ALL
USING (public.is_admin());

CREATE POLICY "Users read own profile"
ON public.profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid());

-- (Trigger de criaçao do usuário cuidará do INSERT)


-- =============================================================================
-- 3️⃣ PETS (Animais / Pacientes)
-- =============================================================================
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access pets"
ON public.pets FOR ALL
USING (public.is_admin());

CREATE POLICY "User read own pets"
ON public.pets FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "User insert own pets"
ON public.pets FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "User update own pets"
ON public.pets FOR UPDATE
USING (user_id = auth.uid());


-- =============================================================================
-- 4️⃣ SERVICES (Catálogo de Serviços)
-- =============================================================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access services"
ON public.services FOR ALL
USING (public.is_admin());

CREATE POLICY "Anyone read active services"
ON public.services FOR SELECT
USING (active = true);


-- =============================================================================
-- 5️⃣ APPOINTMENT_REQUESTS (Agenda e Solicitações)
-- =============================================================================
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access appointment_requests"
ON public.appointment_requests FOR ALL
USING (public.is_admin());

CREATE POLICY "User read own appointment_requests"
ON public.appointment_requests FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "User insert own appointment_requests"
ON public.appointment_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Usuário pode talvez cancelar se o status for pending, mas centralizamos num UPDATE próprio
CREATE POLICY "User update own appointment_requests"
ON public.appointment_requests FOR UPDATE
USING (user_id = auth.uid());


-- =============================================================================
-- 6️⃣ PET_ADMIN_HISTORY (CRÍTICA - Histórico de Auditoria Clínica)
-- =============================================================================
-- Nunca deve ser pública. O tutor não tem conhecimento direto do histórico interno do painel admin.
ALTER TABLE public.pet_admin_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only history access"
ON public.pet_admin_history FOR ALL
USING (public.is_admin());

-- (Nenhuma policy para o usuário comum / tutor)


-- =============================================================================
-- 7️⃣ ANAMNESIS E REGISTROS CLÍNICOS PESADOS ESTRITAMENTE MÉDICOS
-- =============================================================================
-- Tutor SÓ PODE LER os seus, Administrador pode TUDO
-- Aplicaremos o padrão em lote.

DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'anamnesis', 'pet_hospitalizations', 'pet_pathologies', 
    'pet_prescriptions', 'mortes'
  ])
  LOOP
    -- Ativa RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    
    -- Admin: ALL
    EXECUTE format('CREATE POLICY "Admin full access %I" ON public.%I FOR ALL USING (public.is_admin());', t, t);
    
    -- Tutor: SELECT (via junção com a tabela pets)
    IF t = 'anamnesis' THEN
        EXECUTE format('CREATE POLICY "User read own %I" ON public.%I FOR SELECT USING (user_id = auth.uid());', t, t);
    ELSE
        -- Na maioria a FK é 'pet_id', e usamos ela para cruzar com 'pets' e chegar ao 'user_id' do tutor
        EXECUTE format('
            CREATE POLICY "User read own %I" ON public.%I FOR SELECT 
            USING (
               pet_id IN (SELECT id FROM public.pets WHERE user_id = auth.uid()) 
            );', t, t);
    END IF;
  END LOOP;
END $$;


-- =============================================================================
-- 8️⃣ DEMAIS REGISTROS DO PACIENTE (Peso, Vacinas, Fotos, Exames, Obs, Vídeos)
-- =============================================================================
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'pet_weight_records', 'pet_documents', 'pet_exams', 
    'pet_photos', 'pet_vaccines', 'pet_observations', 'pet_videos'   
  ])
  LOOP
    -- Ativa RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    
    -- Admin: ALL
    EXECUTE format('CREATE POLICY "Admin full access %I" ON public.%I FOR ALL USING (public.is_admin());', t, t);
    
    -- Tutor: SELECT
    EXECUTE format('
        CREATE POLICY "User read own %I" ON public.%I FOR SELECT 
        USING (pet_id IN (SELECT id FROM public.pets WHERE user_id = auth.uid()));', t, t);
  END LOOP;
END $$;


-- =============================================================================
-- 9️⃣ AUDIT_LOGS (Apenas Admin)
-- =============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only audit_logs access"
ON public.audit_logs FOR ALL
USING (public.is_admin());

-- =============================================================================
-- ✔️ SCRIPT CONCLUÍDO
-- As permissões estão profissionais e o paciente não poderá adulterar o sistema.
-- =============================================================================
