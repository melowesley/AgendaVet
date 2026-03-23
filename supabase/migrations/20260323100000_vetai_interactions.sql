-- ============================================
-- VetAI Interaction Logging
-- Migration: vet_ai_interactions + knowledge_versions + RLS + Analytics View
-- ============================================

-- ============================================
-- TABELA PRINCIPAL DE INTERAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS public.vet_ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,

  -- Contexto da consulta
  query_text TEXT NOT NULL,
  query_type VARCHAR(50) DEFAULT 'duvida_geral',
  patient_context JSONB DEFAULT '{}',

  -- Resposta da IA
  ai_suggestions JSONB NOT NULL DEFAULT '[]',
  model_version VARCHAR(100),
  confidence_score DECIMAL(3,2),

  -- Ação tomada pelo veterinário
  action_taken JSONB,
  followed_suggestion BOOLEAN,

  -- Feedback e resultado
  immediate_feedback INT,
  outcome TEXT,
  outcome_notes TEXT,
  outcome_recorded_at TIMESTAMPTZ,

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID,

  -- Constraints
  CONSTRAINT valid_feedback CHECK (
    immediate_feedback IS NULL OR
    (immediate_feedback >= 1 AND immediate_feedback <= 5)
  ),
  CONSTRAINT valid_query_type CHECK (
    query_type IN ('diagnostico', 'tratamento', 'protocolo', 'duvida_geral', 'calculo_dose', 'interacoes', 'historico')
  ),
  CONSTRAINT valid_outcome CHECK (
    outcome IS NULL OR
    outcome IN ('melhorou', 'piorou', 'neutro', 'sem_followup')
  )
);

-- Índices para análise
CREATE INDEX IF NOT EXISTS idx_vetai_vet ON public.vet_ai_interactions(vet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vetai_clinic ON public.vet_ai_interactions(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vetai_outcomes ON public.vet_ai_interactions(outcome, followed_suggestion);
CREATE INDEX IF NOT EXISTS idx_vetai_query_type ON public.vet_ai_interactions(query_type);
CREATE INDEX IF NOT EXISTS idx_vetai_session ON public.vet_ai_interactions(session_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.vet_ai_interactions ENABLE ROW LEVEL SECURITY;

-- Veterinários veem suas próprias interações
CREATE POLICY "Vets can view own interactions"
  ON public.vet_ai_interactions
  FOR SELECT
  USING (auth.uid() = vet_id);

-- Veterinários podem criar interações
CREATE POLICY "Vets can create interactions"
  ON public.vet_ai_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = vet_id);

-- Veterinários podem atualizar (feedback/outcome) suas interações
CREATE POLICY "Vets can update own interactions"
  ON public.vet_ai_interactions
  FOR UPDATE
  USING (auth.uid() = vet_id);

-- Admin pode ver tudo dentro da sua clínica
CREATE POLICY "Clinic admins full access"
  ON public.vet_ai_interactions
  FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- VERSIONAMENTO DE CONHECIMENTO
-- ============================================

CREATE TABLE IF NOT EXISTS public.knowledge_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number INT NOT NULL,
  version_tag VARCHAR(50) NOT NULL,

  -- Snapshot de dados de treino
  training_data_snapshot JSONB DEFAULT '{}',
  total_cases INT DEFAULT 0,
  date_range_start DATE,
  date_range_end DATE,

  -- Configuração do modelo
  model_config JSONB DEFAULT '{}',

  -- Métricas de performance
  performance_metrics JSONB DEFAULT '{}',

  -- Deployment
  deployed_at TIMESTAMPTZ,
  deployed_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT false,

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  CONSTRAINT unique_version_tag UNIQUE(version_tag)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_active ON public.knowledge_versions(is_active, version_number DESC);

ALTER TABLE public.knowledge_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read knowledge versions"
  ON public.knowledge_versions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage knowledge versions"
  ON public.knowledge_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- VIEW DE MÉTRICAS DE PERFORMANCE
-- ============================================

CREATE OR REPLACE VIEW public.vetai_performance_metrics AS
SELECT
  DATE_TRUNC('week', created_at) AS week,
  clinic_id,
  query_type,
  COUNT(*) AS total_queries,
  AVG(confidence_score) AS avg_confidence,
  AVG(immediate_feedback) AS avg_feedback,
  SUM(CASE WHEN followed_suggestion THEN 1 ELSE 0 END)::FLOAT /
    NULLIF(COUNT(*), 0) AS adoption_rate,
  SUM(CASE WHEN outcome = 'melhorou' THEN 1 ELSE 0 END)::FLOAT /
    NULLIF(SUM(CASE WHEN outcome IS NOT NULL THEN 1 ELSE 0 END), 0) AS success_rate,
  COUNT(*) FILTER (WHERE immediate_feedback IS NOT NULL) AS feedback_count,
  COUNT(*) FILTER (WHERE outcome IS NOT NULL) AS outcomes_recorded
FROM public.vet_ai_interactions
GROUP BY DATE_TRUNC('week', created_at), clinic_id, query_type
ORDER BY week DESC;
