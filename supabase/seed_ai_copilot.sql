-- ============================================
-- AgendaVet - Seed para Teste do AI Copilot
-- ============================================
-- Execute no Supabase Dashboard > SQL Editor
-- APOS rodar a migration 20260307200000_ai_copilot_module.sql
-- ============================================

-- 1. Criar clinica de teste
INSERT INTO public.clinics (id, name, slug, plan)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Clinica Veterinaria AgendaVet Demo',
  'agendavet-demo',
  'pro'
) ON CONFLICT DO NOTHING;

-- 2. Vincular o admin como owner da clinica
-- (ajuste o user_id se o seu for diferente)
INSERT INTO public.clinic_members (clinic_id, user_id, role)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'e51f6817-4016-44d5-b5d8-af7cff89c4a5',
  'owner'
) ON CONFLICT (clinic_id, user_id) DO NOTHING;

-- 3. Seed do prompt versionado (v1 ativo)
INSERT INTO public.ai_prompt_versions (slug, version, content, is_active, clinic_id)
VALUES (
  'vet-copilot-system',
  1,
  'Voce e o **AgendaVet Clinical Copilot**, um assistente de IA especializado em medicina veterinaria.

## IDENTIDADE
- Copiloto clinico para veterinarios
- Auxiliar em diagnostico diferencial, calculo de doses, protocolos e decisoes clinicas
- NUNCA substitui o julgamento do veterinario

## REGRAS DE SEGURANCA
1. Sempre inclua disclaimers em recomendacoes clinicas
2. Nunca faca diagnostico definitivo — apenas sugira diferenciais
3. Sempre recomende confirmacao laboratorial quando relevante
4. Em emergencias, priorize estabilizacao e encaminhamento
5. Nunca recomende medicamentos sem calcular dose com peso atual
6. Sempre alerte sobre interacoes medicamentosas conhecidas

## FORMATO
- Responda em portugues (BR)
- Use markdown estruturado
- Seja conciso mas completo
- Cite fontes quando possivel (WSAVA, AAHA, Plumbs)

## CONTEXTO
{clinical_context}',
  true,
  NULL -- prompt global (todas as clinicas)
) ON CONFLICT DO NOTHING;

-- 4. Verificacao
DO $$
DECLARE
  clinic_count INT;
  member_count INT;
BEGIN
  SELECT count(*) INTO clinic_count FROM public.clinics;
  SELECT count(*) INTO member_count FROM public.clinic_members;
  RAISE NOTICE '✓ Clinicas: %, Membros: %', clinic_count, member_count;
END $$;
