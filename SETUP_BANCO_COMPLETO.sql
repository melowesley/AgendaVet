-- =============================================================================
-- SETUP COMPLETO DO BANCO — AgendaVet
-- Rode este script no SQL Editor do seu projeto Supabase
-- URL: https://supabase.com/dashboard/project/cahlaalebcwqgbbavrsf
--
-- É seguro rodar mais de uma vez (usa IF NOT EXISTS / DROP IF EXISTS).
-- Cobre todos os módulos:
--   Consulta, Avaliação Cirúrgica, Cirurgia, Retorno, Peso, Patologia,
--   Documento, Exame, Fotos, Aplicações (Vacinas), Receita, Observações,
--   Gravações (Vídeos), Internação, Diagnóstico, Banho e Tosa, Óbito
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSÕES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- PRÉ-LIMPEZA: remove a função has_role antiga se existir com assinatura
-- incompatível (app_role), para evitar conflito de sobrecarga
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FUNÇÕES AUXILIARES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PERFIS DE USUÁRIOS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Trigger: criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ROLES (admin / user)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role       app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::TEXT = _role
  )
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PETS (cadastro de animais)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL,
  breed      TEXT,
  age        TEXT,
  weight     TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own pets" ON public.pets;
CREATE POLICY "Users can view their own pets" ON public.pets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own pets" ON public.pets;
CREATE POLICY "Users can insert their own pets" ON public.pets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pets" ON public.pets;
CREATE POLICY "Users can update their own pets" ON public.pets FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own pets" ON public.pets;
CREATE POLICY "Users can delete their own pets" ON public.pets FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all pets" ON public.pets;
CREATE POLICY "Admins can view all pets" ON public.pets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage all pets" ON public.pets;
CREATE POLICY "Admins can manage all pets" ON public.pets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_pets_updated_at ON public.pets;
CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SERVIÇOS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  price            DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  active           BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services" ON public.services FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.services (name, description, price, duration_minutes) VALUES
  ('Consulta Geral',     'Consulta veterinária de rotina',                 150.00, 30),
  ('Vacinação',          'Aplicação de vacinas',                            80.00, 15),
  ('Exame de Sangue',    'Coleta e análise laboratorial',                  120.00, 20),
  ('Ultrassonografia',   'Exame de ultrassom',                             200.00, 45),
  ('Cirurgia Simples',   'Procedimentos cirúrgicos de baixa complexidade', 500.00, 60),
  ('Limpeza Dentária',   'Profilaxia dental completa',                     350.00, 45),
  ('Banho e Tosa',       'Banho e tosa completos',                         120.00, 60),
  ('Internação (diária)','Diária de internação',                           300.00, 1440)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. AGENDAMENTOS / ATENDIMENTOS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id         UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  reason         TEXT NOT NULL,
  notes          TEXT,
  admin_notes    TEXT,
  service_id     UUID REFERENCES public.services(id),
  scheduled_date DATE,
  scheduled_time TEXT,
  veterinarian   TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own appointment requests" ON public.appointment_requests;
CREATE POLICY "Users can view their own appointment requests" ON public.appointment_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own appointment requests" ON public.appointment_requests;
CREATE POLICY "Users can insert their own appointment requests" ON public.appointment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own appointment requests" ON public.appointment_requests;
CREATE POLICY "Users can update their own appointment requests" ON public.appointment_requests FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all appointment requests" ON public.appointment_requests;
CREATE POLICY "Admins can view all appointment requests" ON public.appointment_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all appointment requests" ON public.appointment_requests;
CREATE POLICY "Admins can update all appointment requests" ON public.appointment_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert appointment requests" ON public.appointment_requests;
CREATE POLICY "Admins can insert appointment requests" ON public.appointment_requests FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_appointment_requests_updated_at ON public.appointment_requests;
CREATE TRIGGER update_appointment_requests_updated_at
  BEFORE UPDATE ON public.appointment_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. ANAMNESE / CONSULTA (formulário clínico completo)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.anamnesis (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_request_id      UUID NOT NULL REFERENCES public.appointment_requests(id) ON DELETE CASCADE,
  pet_id                      UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id                     UUID NOT NULL,
  cor                         TEXT,
  sexo                        TEXT,
  nascimento                  TEXT,
  queixa_principal            TEXT,
  medicamentos                TEXT,
  sistema_gastrintestinal     JSONB DEFAULT '[]',
  sistema_genitourinario      JSONB DEFAULT '[]',
  sistema_genitourinario_extras JSONB DEFAULT '{}',
  sistema_cardiorespiratório  JSONB DEFAULT '[]',
  sistema_neurologico         JSONB DEFAULT '[]',
  sistema_musculoesqueletico  JSONB DEFAULT '[]',
  sistema_ototegumentar       JSONB DEFAULT '[]',
  sistema_ototegumentar_obs   TEXT,
  alimentacao                 JSONB DEFAULT '[]',
  ectoparasitas               JSONB DEFAULT '{}',
  vacinacao                   JSONB DEFAULT '[]',
  vermifugo                   TEXT,
  ambiente                    JSONB DEFAULT '[]',
  contactantes                JSONB DEFAULT '{}',
  banho                       JSONB DEFAULT '{}',
  acesso_rua                  JSONB DEFAULT '{}',
  acesso_plantas              TEXT,
  acesso_roedores             TEXT,
  comportamento               JSONB DEFAULT '[]',
  mucosas                     JSONB DEFAULT '[]',
  linfonodos                  JSONB DEFAULT '[]',
  hidratacao                  TEXT,
  pulso                       TEXT,
  temperatura                 TEXT,
  tpc                         TEXT,
  fc                          TEXT,
  fr                          TEXT,
  campos_pulmonares           TEXT,
  bulhas_cardiacas            TEXT,
  ritmo_cardiaco              TEXT,
  palpacao_abdominal          TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own anamnesis" ON public.anamnesis;
CREATE POLICY "Users can insert their own anamnesis" ON public.anamnesis FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own anamnesis" ON public.anamnesis;
CREATE POLICY "Users can view their own anamnesis" ON public.anamnesis FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own anamnesis" ON public.anamnesis;
CREATE POLICY "Users can update their own anamnesis" ON public.anamnesis FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all anamnesis" ON public.anamnesis;
CREATE POLICY "Admins can view all anamnesis" ON public.anamnesis FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all anamnesis" ON public.anamnesis;
CREATE POLICY "Admins can update all anamnesis" ON public.anamnesis FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert anamnesis" ON public.anamnesis;
CREATE POLICY "Admins can insert anamnesis" ON public.anamnesis FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_anamnesis_updated_at ON public.anamnesis;
CREATE TRIGGER update_anamnesis_updated_at
  BEFORE UPDATE ON public.anamnesis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. HISTÓRICO ADMINISTRATIVO (log central de todas as ações)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pet_admin_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id       UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,
  module       TEXT NOT NULL,
  action       TEXT NOT NULL,
  title        TEXT NOT NULL,
  details      JSONB,
  source_table TEXT,
  source_id    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_admin_history_pet_id    ON public.pet_admin_history(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_admin_history_module    ON public.pet_admin_history(module);
CREATE INDEX IF NOT EXISTS idx_pet_admin_history_created_at ON public.pet_admin_history(created_at DESC);

ALTER TABLE public.pet_admin_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage pet admin history" ON public.pet_admin_history;
CREATE POLICY "Admins can manage pet admin history" ON public.pet_admin_history FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Users can view their pet history" ON public.pet_admin_history;
CREATE POLICY "Users can view their pet history" ON public.pet_admin_history FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. REGISTROS VETERINÁRIOS (todos os módulos da tela "Adicionar")
-- ─────────────────────────────────────────────────────────────────────────────

-- PESO
CREATE TABLE IF NOT EXISTS public.pet_weight_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id     UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,
  weight     DECIMAL(10,2) NOT NULL,
  date       DATE NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_weight_records_pet_id ON public.pet_weight_records(pet_id);
ALTER TABLE public.pet_weight_records ENABLE ROW LEVEL SECURITY;

-- PATOLOGIA / DIAGNÓSTICO
CREATE TABLE IF NOT EXISTS public.pet_pathologies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id         UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL,
  name           VARCHAR(255) NOT NULL,
  diagnosis_date DATE NOT NULL,
  status         VARCHAR(50) DEFAULT 'active',
  description    TEXT,
  treatment      TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pathologies_pet_id ON public.pet_pathologies(pet_id);
ALTER TABLE public.pet_pathologies ENABLE ROW LEVEL SECURITY;

-- DOCUMENTO
CREATE TABLE IF NOT EXISTS public.pet_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id        UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  title         VARCHAR(255) NOT NULL,
  document_type VARCHAR(100),
  file_url      TEXT,
  description   TEXT,
  date          DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_pet_id ON public.pet_documents(pet_id);
CREATE INDEX IF NOT EXISTS idx_documents_date   ON public.pet_documents(date DESC);
ALTER TABLE public.pet_documents ENABLE ROW LEVEL SECURITY;

-- EXAME
CREATE TABLE IF NOT EXISTS public.pet_exams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id        UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  exam_type     VARCHAR(100) NOT NULL,
  exam_date     DATE NOT NULL,
  results       TEXT,
  veterinarian  VARCHAR(255),
  file_url      TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exams_pet_id ON public.pet_exams(pet_id);
ALTER TABLE public.pet_exams ENABLE ROW LEVEL SECURITY;

-- FOTOS
CREATE TABLE IF NOT EXISTS public.pet_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id      UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  title       VARCHAR(255),
  photo_url   TEXT NOT NULL,
  description TEXT,
  date        DATE NOT NULL,
  tags        TEXT[],
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_photos_pet_id ON public.pet_photos(pet_id);
ALTER TABLE public.pet_photos ENABLE ROW LEVEL SECURITY;

-- VACINAS / APLICAÇÕES
CREATE TABLE IF NOT EXISTS public.pet_vaccines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id           UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL,
  vaccine_name     VARCHAR(255) NOT NULL,
  application_date DATE NOT NULL,
  next_dose_date   DATE,
  batch_number     VARCHAR(100),
  veterinarian     VARCHAR(255),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vaccines_pet_id ON public.pet_vaccines(pet_id);
ALTER TABLE public.pet_vaccines ENABLE ROW LEVEL SECURITY;

-- RECEITA / PRESCRIÇÃO
CREATE TABLE IF NOT EXISTS public.pet_prescriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id            UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,
  medication_name   VARCHAR(255) NOT NULL,
  dosage            VARCHAR(100),
  frequency         VARCHAR(100),
  duration          VARCHAR(100),
  prescription_date DATE NOT NULL,
  veterinarian      VARCHAR(255),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pet_id ON public.pet_prescriptions(pet_id);
ALTER TABLE public.pet_prescriptions ENABLE ROW LEVEL SECURITY;

-- OBSERVAÇÕES (também usada por Banho/Tosa e Óbito)
CREATE TABLE IF NOT EXISTS public.pet_observations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id           UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL,
  title            VARCHAR(255),
  observation      TEXT NOT NULL,
  observation_date DATE NOT NULL,
  category         VARCHAR(100),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_observations_pet_id ON public.pet_observations(pet_id);
ALTER TABLE public.pet_observations ENABLE ROW LEVEL SECURITY;

-- GRAVAÇÕES / VÍDEOS
CREATE TABLE IF NOT EXISTS public.pet_videos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id      UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  title       VARCHAR(255),
  video_url   TEXT NOT NULL,
  description TEXT,
  date        DATE NOT NULL,
  tags        TEXT[],
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_videos_pet_id ON public.pet_videos(pet_id);
ALTER TABLE public.pet_videos ENABLE ROW LEVEL SECURITY;

-- INTERNAÇÃO (Hospitalização)
CREATE TABLE IF NOT EXISTS public.pet_hospitalizations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id         UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL,
  admission_date TIMESTAMPTZ NOT NULL,
  discharge_date TIMESTAMPTZ,
  reason         TEXT NOT NULL,
  status         VARCHAR(50) DEFAULT 'active',
  veterinarian   VARCHAR(255),
  diagnosis      TEXT,
  treatment      TEXT,
  daily_notes    JSONB,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hospitalizations_pet_id ON public.pet_hospitalizations(pet_id);
ALTER TABLE public.pet_hospitalizations ENABLE ROW LEVEL SECURITY;

-- ÓBITO (mortes) — tabela criada no SQL Editor do Supabase
CREATE TABLE IF NOT EXISTS public.mortes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id        UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  data_de_morte TIMESTAMPTZ,
  causa         TEXT,
  notas         TEXT
);
CREATE INDEX IF NOT EXISTS idx_mortes_pet_id        ON public.mortes(pet_id);
CREATE INDEX IF NOT EXISTS idx_mortes_data_de_morte ON public.mortes(data_de_morte DESC);
ALTER TABLE public.mortes ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. RLS — POLÍTICAS PARA TODOS OS MÓDULOS (admins + donos do pet)
-- ─────────────────────────────────────────────────────────────────────────────
-- Macro para reutilização: admins têm ALL + WITH CHECK, donos têm SELECT
-- (repetido por tabela — Postgres não suporta macros, mas o padrão é o mesmo)

-- PESO
DROP POLICY IF EXISTS "Admins can manage weight records" ON public.pet_weight_records;
CREATE POLICY "Admins can manage weight records" ON public.pet_weight_records FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
DROP POLICY IF EXISTS "Users can view their pet weight records" ON public.pet_weight_records;
CREATE POLICY "Users can view their pet weight records" ON public.pet_weight_records FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- PATOLOGIA
DROP POLICY IF EXISTS "Admins can manage pathologies" ON public.pet_pathologies;
CREATE POLICY "Admins can manage pathologies" ON public.pet_pathologies FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
DROP POLICY IF EXISTS "Users can view their pet pathologies" ON public.pet_pathologies;
CREATE POLICY "Users can view their pet pathologies" ON public.pet_pathologies FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- DOCUMENTO
DROP POLICY IF EXISTS "Admins can manage documents" ON public.pet_documents;
CREATE POLICY "Admins can manage documents" ON public.pet_documents FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
DROP POLICY IF EXISTS "Users can view their pet documents" ON public.pet_documents;
CREATE POLICY "Users can view their pet documents" ON public.pet_documents FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- EXAME
DROP POLICY IF EXISTS "Admins can manage exams" ON public.pet_exams;
CREATE POLICY "Admins can manage exams" ON public.pet_exams FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
DROP POLICY IF EXISTS "Users can view their pet exams" ON public.pet_exams;
CREATE POLICY "Users can view their pet exams" ON public.pet_exams FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- FOTOS
DROP POLICY IF EXISTS "Admins can manage photos" ON public.pet_photos;
CREATE POLICY "Admins can manage photos" ON public.pet_photos FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
DROP POLICY IF EXISTS "Users can view their pet photos" ON public.pet_photos;
CREATE POLICY "Users can view their pet photos" ON public.pet_photos FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- VACINAS
DROP POLICY IF EXISTS "Admins can manage vaccines" ON public.pet_vaccines;
CREATE POLICY "Admins can manage vaccines" ON public.pet_vaccines FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
DROP POLICY IF EXISTS "Users can view their pet vaccines" ON public.pet_vaccines;
CREATE POLICY "Users can view their pet vaccines" ON public.pet_vaccines FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- RECEITA
DROP POLICY IF EXISTS "Admins can manage prescriptions" ON public.pet_prescriptions;
CREATE POLICY "Admins can manage prescriptions" ON public.pet_prescriptions FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
DROP POLICY IF EXISTS "Users can view their pet prescriptions" ON public.pet_prescriptions;
CREATE POLICY "Users can view their pet prescriptions" ON public.pet_prescriptions FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- OBSERVAÇÕES
DROP POLICY IF EXISTS "Admins can manage observations" ON public.pet_observations;
CREATE POLICY "Admins can manage observations" ON public.pet_observations FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
DROP POLICY IF EXISTS "Users can view their pet observations" ON public.pet_observations;
CREATE POLICY "Users can view their pet observations" ON public.pet_observations FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- VÍDEOS
DROP POLICY IF EXISTS "Admins can manage videos" ON public.pet_videos;
CREATE POLICY "Admins can manage videos" ON public.pet_videos FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
DROP POLICY IF EXISTS "Users can view their pet videos" ON public.pet_videos;
CREATE POLICY "Users can view their pet videos" ON public.pet_videos FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- INTERNAÇÃO
DROP POLICY IF EXISTS "Admins can manage hospitalizations" ON public.pet_hospitalizations;
CREATE POLICY "Admins can manage hospitalizations" ON public.pet_hospitalizations FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
DROP POLICY IF EXISTS "Users can view their pet hospitalizations" ON public.pet_hospitalizations;
CREATE POLICY "Users can view their pet hospitalizations" ON public.pet_hospitalizations FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- ÓBITO
DROP POLICY IF EXISTS "Admins can manage mortes" ON public.mortes;
CREATE POLICY "Admins can manage mortes" ON public.mortes FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
DROP POLICY IF EXISTS "Users can view their pet mortes" ON public.mortes;
CREATE POLICY "Users can view their pet mortes" ON public.mortes FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. AUDIT LOGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  user_email  TEXT,
  action      TEXT NOT NULL,
  table_name  TEXT NOT NULL,
  record_id   TEXT,
  old_data    JSONB,
  new_data    JSONB,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. PERMISSÕES (GRANTS) — ESSENCIAL PARA O FUNCIONAMENTO
-- Sem estes GRANTs, o Supabase retorna "permission denied" mesmo com RLS ok.
-- ─────────────────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT SELECT ON public.services TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO authenticated;

-- =============================================================================
-- FIM DO SETUP
-- Após rodar este script:
--   1. Vá em Settings → API no dashboard do Supabase
--   2. Copie "Project URL" e "anon public" key
--   3. Cole no arquivo .env do projeto:
--      VITE_SUPABASE_URL=https://cahlaalebcwqgbbavrsf.supabase.co
--      VITE_SUPABASE_ANON_KEY=<anon key>
--   4. Crie o primeiro usuário admin em Authentication → Users
--   5. Atribua role admin rodando:
--      INSERT INTO public.user_roles (user_id, role)
--      VALUES ('<uuid do usuário>', 'admin');
-- =============================================================================
