-- Adiciona campos profissionais ao perfil (veterinário)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crmv TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
