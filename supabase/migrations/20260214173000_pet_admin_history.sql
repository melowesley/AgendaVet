-- Histórico administrativo detalhado da ficha veterinária
CREATE TABLE IF NOT EXISTS pet_admin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  title TEXT NOT NULL,
  details JSONB,
  source_table TEXT,
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pet_admin_history_pet_id
  ON pet_admin_history(pet_id);

CREATE INDEX IF NOT EXISTS idx_pet_admin_history_module
  ON pet_admin_history(module);

CREATE INDEX IF NOT EXISTS idx_pet_admin_history_created_at
  ON pet_admin_history(created_at DESC);

ALTER TABLE pet_admin_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pet admin history"
  ON pet_admin_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );
