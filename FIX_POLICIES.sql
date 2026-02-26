-- =============================================================================
-- FIX_POLICIES.sql — Recria TODAS as políticas de RLS corretamente
-- Execute no SQL Editor do Supabase (cahlaalebcwqgbbavrsf)
-- Garante que admin possa inserir/ler/excluir em todas as tabelas
-- e que cliente só veja seus próprios dados.
-- =============================================================================

-- ── 1. Garantir função has_role correta ───────────────────────────────────────
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::TEXT = _role
  )
$$;

-- ── 1b. ADICIONAR user_id NA TABELA PETS (estava faltando) ──────────────────
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Preencher user_id dos pets existentes com o user_id do primeiro admin
-- (pets cadastrados antes desta correção ficarão vinculados ao admin)
UPDATE public.pets
SET user_id = (
  SELECT user_id FROM public.user_roles
  WHERE role::TEXT = 'admin'
  LIMIT 1
)
WHERE user_id IS NULL;

-- ── 2. PETS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own pets"   ON public.pets;
DROP POLICY IF EXISTS "Users can insert their own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can update their own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can delete their own pets" ON public.pets;
DROP POLICY IF EXISTS "Admins can view all pets"        ON public.pets;
DROP POLICY IF EXISTS "Admins can manage all pets"      ON public.pets;

CREATE POLICY "Users can view their own pets"
  ON public.pets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pets"
  ON public.pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pets"
  ON public.pets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pets"
  ON public.pets FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all pets"
  ON public.pets FOR ALL
  USING   (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 3. APPOINTMENT_REQUESTS ───────────────────────────────────────────────────
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own appointment requests"   ON public.appointment_requests;
DROP POLICY IF EXISTS "Users can insert their own appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Users can update their own appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Admins can view all appointment requests"        ON public.appointment_requests;
DROP POLICY IF EXISTS "Admins can update all appointment requests"      ON public.appointment_requests;
DROP POLICY IF EXISTS "Admins can insert appointment requests"          ON public.appointment_requests;
DROP POLICY IF EXISTS "Admins can manage all appointment requests"      ON public.appointment_requests;

CREATE POLICY "Users can view their own appointment requests"
  ON public.appointment_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own appointment requests"
  ON public.appointment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own appointment requests"
  ON public.appointment_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all appointment requests"
  ON public.appointment_requests FOR ALL
  USING   (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 4. PROFILES ───────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile"  ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"       ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles"     ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING   (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 5. USER_ROLES ─────────────────────────────────────────────────────────────
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles"      ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles"        ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING   (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 6. PET_ADMIN_HISTORY ──────────────────────────────────────────────────────
ALTER TABLE public.pet_admin_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage pet admin history" ON public.pet_admin_history;
DROP POLICY IF EXISTS "Users can view their pet history"    ON public.pet_admin_history;

CREATE POLICY "Admins can manage pet admin history"
  ON public.pet_admin_history FOR ALL
  USING   (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their pet history"
  ON public.pet_admin_history FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- ── 7. TODAS AS TABELAS DE REGISTROS VETERINÁRIOS ────────────────────────────
-- (peso, patologia, documento, exame, fotos, vacinas, receita, observações,
--  vídeos, internação, mortes)

-- PET_WEIGHT_RECORDS
ALTER TABLE public.pet_weight_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage weight records"        ON public.pet_weight_records;
DROP POLICY IF EXISTS "Users can view their pet weight records" ON public.pet_weight_records;
CREATE POLICY "Admins can manage weight records"
  ON public.pet_weight_records FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their pet weight records"
  ON public.pet_weight_records FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- PET_PATHOLOGIES
ALTER TABLE public.pet_pathologies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage pathologies"        ON public.pet_pathologies;
DROP POLICY IF EXISTS "Users can view their pet pathologies" ON public.pet_pathologies;
CREATE POLICY "Admins can manage pathologies"
  ON public.pet_pathologies FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their pet pathologies"
  ON public.pet_pathologies FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- PET_DOCUMENTS
ALTER TABLE public.pet_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage documents"        ON public.pet_documents;
DROP POLICY IF EXISTS "Users can view their pet documents" ON public.pet_documents;
CREATE POLICY "Admins can manage documents"
  ON public.pet_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their pet documents"
  ON public.pet_documents FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- PET_EXAMS
ALTER TABLE public.pet_exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage exams"        ON public.pet_exams;
DROP POLICY IF EXISTS "Users can view their pet exams" ON public.pet_exams;
CREATE POLICY "Admins can manage exams"
  ON public.pet_exams FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their pet exams"
  ON public.pet_exams FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- PET_PHOTOS
ALTER TABLE public.pet_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage photos"        ON public.pet_photos;
DROP POLICY IF EXISTS "Users can view their pet photos" ON public.pet_photos;
CREATE POLICY "Admins can manage photos"
  ON public.pet_photos FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their pet photos"
  ON public.pet_photos FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- PET_VACCINES
ALTER TABLE public.pet_vaccines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage vaccines"        ON public.pet_vaccines;
DROP POLICY IF EXISTS "Users can view their pet vaccines" ON public.pet_vaccines;
CREATE POLICY "Admins can manage vaccines"
  ON public.pet_vaccines FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their pet vaccines"
  ON public.pet_vaccines FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- PET_PRESCRIPTIONS
ALTER TABLE public.pet_prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage prescriptions"        ON public.pet_prescriptions;
DROP POLICY IF EXISTS "Users can view their pet prescriptions" ON public.pet_prescriptions;
CREATE POLICY "Admins can manage prescriptions"
  ON public.pet_prescriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their pet prescriptions"
  ON public.pet_prescriptions FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- PET_OBSERVATIONS
ALTER TABLE public.pet_observations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage observations"        ON public.pet_observations;
DROP POLICY IF EXISTS "Users can view their pet observations" ON public.pet_observations;
CREATE POLICY "Admins can manage observations"
  ON public.pet_observations FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their pet observations"
  ON public.pet_observations FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- PET_VIDEOS
ALTER TABLE public.pet_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage videos"        ON public.pet_videos;
DROP POLICY IF EXISTS "Users can view their pet videos" ON public.pet_videos;
CREATE POLICY "Admins can manage videos"
  ON public.pet_videos FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their pet videos"
  ON public.pet_videos FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- PET_HOSPITALIZATIONS
ALTER TABLE public.pet_hospitalizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage hospitalizations"        ON public.pet_hospitalizations;
DROP POLICY IF EXISTS "Users can view their pet hospitalizations" ON public.pet_hospitalizations;
CREATE POLICY "Admins can manage hospitalizations"
  ON public.pet_hospitalizations FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their pet hospitalizations"
  ON public.pet_hospitalizations FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- MORTES (ÓBITO)
ALTER TABLE public.mortes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage mortes"        ON public.mortes;
DROP POLICY IF EXISTS "Users can view their pet mortes" ON public.mortes;
CREATE POLICY "Admins can manage mortes"
  ON public.mortes FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their pet mortes"
  ON public.mortes FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- ANAMNESIS
ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all anamnesis"   ON public.anamnesis;
DROP POLICY IF EXISTS "Admins can update all anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Admins can insert anamnesis"     ON public.anamnesis;
DROP POLICY IF EXISTS "Admins can manage all anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Users can insert their own anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Users can view their own anamnesis"   ON public.anamnesis;
DROP POLICY IF EXISTS "Users can update their own anamnesis" ON public.anamnesis;
CREATE POLICY "Admins can manage all anamnesis"
  ON public.anamnesis FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their own anamnesis"
  ON public.anamnesis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own anamnesis"
  ON public.anamnesis FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AUDIT_LOGS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all audit logs"  ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs"    ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can manage audit logs"    ON public.audit_logs;
CREATE POLICY "Admins can manage audit logs"
  ON public.audit_logs FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 8. PERMISSÕES (GRANTS) — ESSENCIAL ──────────────────────────────────────
-- Sem estes GRANTs, o Supabase retorna "permission denied" mesmo com RLS ok.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT SELECT ON public.services TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO authenticated;

-- ── 9. VERIFICAÇÃO FINAL ──────────────────────────────────────────────────────
SELECT
  u.email,
  ur.role,
  public.has_role(u.id, 'admin') AS is_admin_check
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at DESC;
