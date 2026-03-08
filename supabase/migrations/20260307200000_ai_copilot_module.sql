-- ============================================
-- AgendaVet AI Copilot Module
-- Migration: Multi-tenant + Conversations + RAG + Observability
-- ============================================

-- Habilitar pgvector para RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TABELAS DE MULTI-TENANT
-- ============================================

CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'basic',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinic_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'vet',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, user_id)
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_own_clinic" ON public.clinics
  FOR SELECT USING (
    id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid())
  );

CREATE POLICY "members_read_own_membership" ON public.clinic_members
  FOR SELECT USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.clinic_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- TABELAS DE CONVERSAS E MENSAGENS
-- ============================================

CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  title TEXT,
  model_used TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  prompt_version_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  tool_calls JSONB,
  clinical_action JSONB,
  token_count INTEGER,
  model TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);
CREATE INDEX idx_ai_conversations_clinic ON public.ai_conversations(clinic_id, updated_at DESC);
CREATE INDEX idx_ai_conversations_pet ON public.ai_conversations(pet_id);
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_member_read_conversations" ON public.ai_conversations
  FOR SELECT USING (
    clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid())
  );

CREATE POLICY "user_insert_conversations" ON public.ai_conversations
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND clinic_id = public.user_clinic_id()
  );

CREATE POLICY "user_update_own_conversations" ON public.ai_conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "clinic_member_read_messages" ON public.ai_messages
  FOR SELECT USING (
    clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid())
  );

CREATE POLICY "clinic_member_insert_messages" ON public.ai_messages
  FOR INSERT WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid())
  );

-- ============================================
-- LOGS DE USO E CUSTO
-- ============================================

CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  conversation_id UUID REFERENCES public.ai_conversations(id),
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  latency_ms INTEGER,
  fallback_from TEXT,
  error JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_usage_clinic_date ON public.ai_usage_logs(clinic_id, created_at);
CREATE INDEX idx_ai_usage_user_date ON public.ai_usage_logs(user_id, created_at);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_member_read_usage" ON public.ai_usage_logs
  FOR SELECT USING (
    clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid())
  );

CREATE POLICY "clinic_member_insert_usage" ON public.ai_usage_logs
  FOR INSERT WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid())
  );

-- ============================================
-- VERSIONAMENTO DE PROMPTS
-- ============================================

CREATE TABLE public.ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  clinic_id UUID REFERENCES public.clinics(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slug, version, clinic_id)
);

CREATE INDEX idx_prompt_active ON public.ai_prompt_versions(slug, is_active)
  WHERE is_active = true;

ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_prompts" ON public.ai_prompt_versions
  FOR SELECT USING (
    clinic_id IS NULL
    OR clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid())
  );

-- ============================================
-- RAG - DOCUMENTOS E CHUNKS
-- ============================================

CREATE TABLE public.rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id),
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  chunk_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.rag_documents(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id),
  content TEXT NOT NULL,
  embedding vector(768),
  chunk_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rag_chunks_embedding ON public.rag_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_rag_chunks_document ON public.rag_chunks(document_id);
CREATE INDEX idx_rag_documents_clinic ON public.rag_documents(clinic_id, status);

ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_rag_documents" ON public.rag_documents
  FOR SELECT USING (
    clinic_id IS NULL
    OR clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid())
  );

CREATE POLICY "admin_insert_rag_documents" ON public.rag_documents
  FOR INSERT WITH CHECK (
    clinic_id IS NULL
    OR clinic_id IN (
      SELECT clinic_id FROM public.clinic_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "read_rag_chunks" ON public.rag_chunks
  FOR SELECT USING (
    clinic_id IS NULL
    OR clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.search_rag_chunks(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_clinic_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  document_title TEXT,
  source_type TEXT,
  metadata JSONB
) AS $$
  SELECT
    rc.id,
    rc.content,
    1 - (rc.embedding <=> query_embedding) AS similarity,
    rd.title AS document_title,
    rd.source_type,
    rc.metadata
  FROM public.rag_chunks rc
  JOIN public.rag_documents rd ON rd.id = rc.document_id
  WHERE
    rd.status = 'ready'
    AND (
      (filter_clinic_id IS NULL AND rc.clinic_id IS NULL)
      OR rc.clinic_id = filter_clinic_id
      OR rc.clinic_id IS NULL
    )
    AND 1 - (rc.embedding <=> query_embedding) > match_threshold
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;

-- ============================================
-- CACHE DE RESPOSTAS
-- ============================================

CREATE TABLE public.ai_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  response TEXT NOT NULL,
  model TEXT NOT NULL,
  hit_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cache_key ON public.ai_response_cache(cache_key);
CREATE INDEX idx_cache_expires ON public.ai_response_cache(expires_at);

-- ============================================
-- TRIGGER: updated_at automatico
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
