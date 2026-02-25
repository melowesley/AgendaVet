-- Tabela de registros de óbitos (mortes) de pets
-- Compatível com a tabela criada no SQL Editor do Supabase
CREATE TABLE IF NOT EXISTS public.mortes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  data_de_morte TIMESTAMPTZ,
  causa TEXT,
  notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_mortes_pet_id ON public.mortes(pet_id);
CREATE INDEX IF NOT EXISTS idx_mortes_data_de_morte ON public.mortes(data_de_morte DESC);

ALTER TABLE public.mortes ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem inserir/atualizar/excluir
DROP POLICY IF EXISTS "Admins can manage mortes" ON public.mortes;
CREATE POLICY "Admins can manage mortes"
  ON public.mortes
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

-- Donos do pet podem apenas ler (portal do cliente)
DROP POLICY IF EXISTS "Users can view their pet mortes" ON public.mortes;
CREATE POLICY "Users can view their pet mortes"
  ON public.mortes
  FOR SELECT
  USING (
    pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
  );
