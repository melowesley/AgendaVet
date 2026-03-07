-- Adiciona a coluna quick_notes à tabela appointment_requests para as anotações do dia
ALTER TABLE appointment_requests
ADD COLUMN IF NOT EXISTS quick_notes TEXT;

-- Atualiza a política do RLS se necessário (geralmente as políticas existentes de UPDATE já cobrem todas as colunas)
-- Mas podemos garantir um comentário
COMMENT ON COLUMN appointment_requests.quick_notes IS 'Anotações rápidas feitas pelo veterinário na tela da Agenda do Dia';
