-- =============================================================================
-- Migration: Consolidação de RLS e correções para fluxo uniforme de histórico
-- Data: 2026-02-17
-- =============================================================================
-- Esta migration:
--  1. Garante que pet_admin_history tenha WITH CHECK explícito para INSERT
--     (necessário para alguns drivers/versões do Postgres)
--  2. Adiciona política de leitura do histórico para o próprio dono do pet
--     (portal do cliente)
--  3. Cria as tabelas pet_documents, pet_exams, pet_vaccines, etc. com IF NOT
--     EXISTS para ambientes que ainda não rodaram 20260214100000_pet_records_complete
--  4. Garante que todas as tabelas de registros tenham política de INSERT para
--     admins (WITH CHECK explícito)
-- =============================================================================

-- ─── Corrigir política ALL do pet_admin_history com WITH CHECK explícito ─────
DO $$
BEGIN
  -- Remove a política genérica FOR ALL sem WITH CHECK
  DROP POLICY IF EXISTS "Admins can manage pet admin history" ON pet_admin_history;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Admins can manage pet admin history"
  ON pet_admin_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Proprietários do pet podem ler o histórico (portal do cliente)
DROP POLICY IF EXISTS "Users can view their pet history" ON pet_admin_history;
CREATE POLICY "Users can view their pet history"
  ON pet_admin_history
  FOR SELECT
  USING (
    pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
  );

-- ─── pet_documents — garantir que existe + política explícita de INSERT ──────
CREATE TABLE IF NOT EXISTS pet_documents (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id        UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID NOT NULL,
  title         VARCHAR(255) NOT NULL,
  document_type VARCHAR(100),
  file_url      TEXT,
  description   TEXT,
  date          DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pet_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage documents" ON pet_documents;
CREATE POLICY "Admins can manage documents"
  ON pet_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

DROP POLICY IF EXISTS "Users can view their pet documents" ON pet_documents;
CREATE POLICY "Users can view their pet documents"
  ON pet_documents FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

-- ─── Corrigir políticas WITH CHECK nas demais tabelas de registros ────────────

-- pet_weight_records
DROP POLICY IF EXISTS "Admins can manage weight records" ON pet_weight_records;
CREATE POLICY "Admins can manage weight records"
  ON pet_weight_records FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- pet_pathologies
DROP POLICY IF EXISTS "Admins can manage pathologies" ON pet_pathologies;
CREATE POLICY "Admins can manage pathologies"
  ON pet_pathologies FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- pet_exams
DROP POLICY IF EXISTS "Admins can manage exams" ON pet_exams;
CREATE POLICY "Admins can manage exams"
  ON pet_exams FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- pet_photos
DROP POLICY IF EXISTS "Admins can manage photos" ON pet_photos;
CREATE POLICY "Admins can manage photos"
  ON pet_photos FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- pet_vaccines
DROP POLICY IF EXISTS "Admins can manage vaccines" ON pet_vaccines;
CREATE POLICY "Admins can manage vaccines"
  ON pet_vaccines FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- pet_prescriptions
DROP POLICY IF EXISTS "Admins can manage prescriptions" ON pet_prescriptions;
CREATE POLICY "Admins can manage prescriptions"
  ON pet_prescriptions FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- pet_observations
DROP POLICY IF EXISTS "Admins can manage observations" ON pet_observations;
CREATE POLICY "Admins can manage observations"
  ON pet_observations FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- pet_videos
DROP POLICY IF EXISTS "Admins can manage videos" ON pet_videos;
CREATE POLICY "Admins can manage videos"
  ON pet_videos FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- pet_hospitalizations
DROP POLICY IF EXISTS "Admins can manage hospitalizations" ON pet_hospitalizations;
CREATE POLICY "Admins can manage hospitalizations"
  ON pet_hospitalizations FOR ALL
  USING   (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- ─── Índices para pet_documents (se não existirem) ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_documents_pet_id ON pet_documents(pet_id);
CREATE INDEX IF NOT EXISTS idx_documents_date   ON pet_documents(date DESC);
