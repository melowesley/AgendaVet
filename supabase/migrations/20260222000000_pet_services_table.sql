-- ============================================================
-- pet_services: registra serviços prestados/vendidos a um pet
-- Cada linha = 1 serviço adicionado ao prontuário do animal
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pet_services (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id           UUID          NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  service_id       UUID          REFERENCES public.services(id) ON DELETE SET NULL,
  service_name     TEXT          NOT NULL,
  price_snapshot   NUMERIC(10,2) NOT NULL,
  quantity         INTEGER       NOT NULL DEFAULT 1,
  notes            TEXT,
  added_by         UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_pet_services_pet_id     ON public.pet_services(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_services_service_id ON public.pet_services(service_id);
CREATE INDEX IF NOT EXISTS idx_pet_services_created_at ON public.pet_services(created_at DESC);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.pet_services ENABLE ROW LEVEL SECURITY;

-- Admin tem acesso total
CREATE POLICY "admin_all_pet_services"
  ON public.pet_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Tutor (cliente) pode visualizar os serviços dos seus próprios pets
CREATE POLICY "tutor_view_own_pet_services"
  ON public.pet_services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = pet_id
        AND pets.user_id = auth.uid()
    )
  );

-- ── Comentários de documentação ───────────────────────────────────────────────
COMMENT ON TABLE  public.pet_services             IS 'Serviços prestados / vendidos para cada pet. Origem: botão "Adicionar serviço" no prontuário.';
COMMENT ON COLUMN public.pet_services.price_snapshot IS 'Preço no momento da adição (snapshot), independente de alterações futuras em services.price.';
COMMENT ON COLUMN public.pet_services.service_id     IS 'FK para services; pode ser NULL se o serviço for excluído posteriormente.';
COMMENT ON COLUMN public.pet_services.added_by        IS 'Usuário admin que adicionou o serviço.';
