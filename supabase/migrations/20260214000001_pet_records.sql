-- Tabela genérica para registros do pet (peso, documento, vacina, exame, receita, observação, patologia, fotos, vídeo, internação)
CREATE TABLE public.pet_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  title TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_pet_records_pet_id ON public.pet_records(pet_id);
CREATE INDEX idx_pet_records_record_type ON public.pet_records(record_type);
CREATE INDEX idx_pet_records_created_at ON public.pet_records(created_at DESC);

ALTER TABLE public.pet_records ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver, inserir, atualizar e excluir registros
CREATE POLICY "Admins can view pet_records"
ON public.pet_records FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert pet_records"
ON public.pet_records FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update pet_records"
ON public.pet_records FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete pet_records"
ON public.pet_records FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_pet_records_updated_at
  BEFORE UPDATE ON public.pet_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
