-- Tabela de registros de peso
CREATE TABLE IF NOT EXISTS pet_weight_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de patologias
CREATE TABLE IF NOT EXISTS pet_pathologies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  diagnosis_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  description TEXT,
  treatment TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS pet_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  document_type VARCHAR(100),
  file_url TEXT,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de exames
CREATE TABLE IF NOT EXISTS pet_exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  exam_type VARCHAR(100) NOT NULL,
  exam_date DATE NOT NULL,
  results TEXT,
  veterinarian VARCHAR(255),
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de fotos
CREATE TABLE IF NOT EXISTS pet_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  title VARCHAR(255),
  photo_url TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de vacinas
CREATE TABLE IF NOT EXISTS pet_vaccines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  vaccine_name VARCHAR(255) NOT NULL,
  application_date DATE NOT NULL,
  next_dose_date DATE,
  batch_number VARCHAR(100),
  veterinarian VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de receitas
CREATE TABLE IF NOT EXISTS pet_prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  prescription_date DATE NOT NULL,
  veterinarian VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de observações
CREATE TABLE IF NOT EXISTS pet_observations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  title VARCHAR(255),
  observation TEXT NOT NULL,
  observation_date DATE NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de vídeos
CREATE TABLE IF NOT EXISTS pet_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  title VARCHAR(255),
  video_url TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de internações
CREATE TABLE IF NOT EXISTS pet_hospitalizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  admission_date TIMESTAMPTZ NOT NULL,
  discharge_date TIMESTAMPTZ,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  veterinarian VARCHAR(255),
  diagnosis TEXT,
  treatment TEXT,
  daily_notes JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_weight_records_pet_id ON pet_weight_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_pathologies_pet_id ON pet_pathologies(pet_id);
CREATE INDEX IF NOT EXISTS idx_documents_pet_id ON pet_documents(pet_id);
CREATE INDEX IF NOT EXISTS idx_exams_pet_id ON pet_exams(pet_id);
CREATE INDEX IF NOT EXISTS idx_photos_pet_id ON pet_photos(pet_id);
CREATE INDEX IF NOT EXISTS idx_vaccines_pet_id ON pet_vaccines(pet_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pet_id ON pet_prescriptions(pet_id);
CREATE INDEX IF NOT EXISTS idx_observations_pet_id ON pet_observations(pet_id);
CREATE INDEX IF NOT EXISTS idx_videos_pet_id ON pet_videos(pet_id);
CREATE INDEX IF NOT EXISTS idx_hospitalizations_pet_id ON pet_hospitalizations(pet_id);

-- RLS (Row Level Security)
ALTER TABLE pet_weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_pathologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_hospitalizations ENABLE ROW LEVEL SECURITY;

-- Policies para admins terem acesso total
CREATE POLICY "Admins can manage weight records" ON pet_weight_records FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Admins can manage pathologies" ON pet_pathologies FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Admins can manage documents" ON pet_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Admins can manage exams" ON pet_exams FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Admins can manage photos" ON pet_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Admins can manage vaccines" ON pet_vaccines FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Admins can manage prescriptions" ON pet_prescriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Admins can manage observations" ON pet_observations FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Admins can manage videos" ON pet_videos FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Admins can manage hospitalizations" ON pet_hospitalizations FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- Policies para usuários verem seus próprios registros
CREATE POLICY "Users can view their pet weight records" ON pet_weight_records FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their pet pathologies" ON pet_pathologies FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their pet documents" ON pet_documents FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their pet exams" ON pet_exams FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their pet photos" ON pet_photos FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their pet vaccines" ON pet_vaccines FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their pet prescriptions" ON pet_prescriptions FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their pet observations" ON pet_observations FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their pet videos" ON pet_videos FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their pet hospitalizations" ON pet_hospitalizations FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
);
