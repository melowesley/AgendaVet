-- =============================================================================
-- TESTE_TRIGGER.sql
-- Este script realiza um teste de inserção em pet_weight_records para verificar
-- se o trigger trg_log_history_pet_weight_records está funcionando e populando
-- a tabela pet_admin_history com o log correto.
-- =============================================================================

DO $$
DECLARE
  v_pet_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_weight_record_id UUID;
BEGIN
  -- 1. Obter um pet existente para o teste (se não houver, o teste falhará)
  SELECT id, user_id, organization_id INTO v_pet_id, v_user_id, v_org_id 
  FROM public.pets 
  LIMIT 1;

  IF v_pet_id IS NULL THEN
    RAISE NOTICE 'Nenhum pet encontrado para realizar o teste. Crie um pet primeiro.';
    RETURN;
  END IF;

  -- 2. Inserir um registro de peso
  RAISE NOTICE 'Inserindo peso de teste para o pet %...', v_pet_id;
  INSERT INTO public.pet_weight_records (pet_id, user_id, organization_id, weight, date, notes)
  VALUES (v_pet_id, v_user_id, v_org_id, 12.5, current_date, 'Teste de Trigger Automático')
  RETURNING id INTO v_weight_record_id;

  -- 3. Verificar se o registro foi criado no pet_admin_history
  IF EXISTS (
    SELECT 1 FROM public.pet_admin_history 
    WHERE source_table = 'pet_weight_records' AND source_id = v_weight_record_id::TEXT
  ) THEN
    RAISE NOTICE '✅ SUCESSO! O log foi criado automaticamente em pet_admin_history.';
  ELSE
    RAISE NOTICE '❌ FALHA! O log NÃO foi criado em pet_admin_history.';
  END IF;
  
  -- (Opcional) Limpar o registro de teste
  -- DELETE FROM public.pet_weight_records WHERE id = v_weight_record_id;
  -- Nota: a exclusão acima não apagaria do histórico devido à ausência de DELETE CASCADE no histórico em relação à tabela source, 
  -- mas apenas como exemplo de limpeza.
END $$;
