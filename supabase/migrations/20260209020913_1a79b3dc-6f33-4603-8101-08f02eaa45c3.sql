
-- Tabela de anamnese vinculada a cada solicitação de consulta
CREATE TABLE public.anamnesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_request_id UUID NOT NULL REFERENCES public.appointment_requests(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Identificação extra do paciente
  cor TEXT,
  sexo TEXT,
  nascimento TEXT,

  -- Queixa principal e medicamentos
  queixa_principal TEXT,
  medicamentos TEXT,

  -- Sistemas (checkboxes armazenados como arrays JSONB)
  sistema_gastrintestinal JSONB DEFAULT '[]'::jsonb,
  sistema_genitourinario JSONB DEFAULT '[]'::jsonb,
  sistema_genitourinario_extras JSONB DEFAULT '{}'::jsonb,
  sistema_cardiorespiratório JSONB DEFAULT '[]'::jsonb,
  sistema_neurologico JSONB DEFAULT '[]'::jsonb,
  sistema_musculoesqueletico JSONB DEFAULT '[]'::jsonb,
  sistema_ototegumentar JSONB DEFAULT '[]'::jsonb,
  sistema_ototegumentar_obs TEXT,

  -- Manejo
  alimentacao JSONB DEFAULT '[]'::jsonb,
  ectoparasitas JSONB DEFAULT '{}'::jsonb,
  vacinacao JSONB DEFAULT '[]'::jsonb,
  vermifugo TEXT,
  ambiente JSONB DEFAULT '[]'::jsonb,
  contactantes JSONB DEFAULT '{}'::jsonb,
  banho JSONB DEFAULT '{}'::jsonb,
  acesso_rua JSONB DEFAULT '{}'::jsonb,
  acesso_plantas TEXT,
  acesso_roedores TEXT,
  comportamento JSONB DEFAULT '[]'::jsonb,

  -- Exame Físico (preenchido pelo admin/veterinário)
  mucosas JSONB DEFAULT '[]'::jsonb,
  linfonodos JSONB DEFAULT '[]'::jsonb,
  hidratacao TEXT,
  pulso TEXT,
  temperatura TEXT,
  tpc TEXT,
  fc TEXT,
  fr TEXT,
  campos_pulmonares TEXT,
  bulhas_cardiacas TEXT,
  ritmo_cardiaco TEXT,
  palpacao_abdominal TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;

-- Tutores podem criar e ver sua própria anamnese
CREATE POLICY "Users can insert their own anamnesis"
  ON public.anamnesis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own anamnesis"
  ON public.anamnesis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own anamnesis"
  ON public.anamnesis FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins podem ver e atualizar todas
CREATE POLICY "Admins can view all anamnesis"
  ON public.anamnesis FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all anamnesis"
  ON public.anamnesis FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_anamnesis_updated_at
  BEFORE UPDATE ON public.anamnesis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
