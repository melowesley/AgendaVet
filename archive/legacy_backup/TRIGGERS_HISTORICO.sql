-- =============================================================================
-- TRIGGERS_HISTORICO.sql
-- Este script cria uma função genérica e triggers para popular automaticamente
-- a tabela pet_admin_history sempre que um novo registro clínico ou administrativo
-- for inserido. Isso garante consistência entre o Web App e Vet App.
-- =============================================================================

-- 1. Cria a função genérica do Trigger
CREATE OR REPLACE FUNCTION public.fn_log_to_pet_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module TEXT;
  v_action TEXT := 'create';
  v_title TEXT := 'Novo Registro';
  v_details JSONB := '{}'::jsonb;
  v_user_id UUID;
  v_organization_id UUID;
BEGIN
  -- Definir user_id: prefere quem disparou a ação (auth.uid), senão usa o dono do registro
  v_user_id := COALESCE(auth.uid(), NEW.user_id);
  v_organization_id := NEW.organization_id;

  IF TG_OP = 'UPDATE' THEN
    v_action := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
  END IF;

  -- Estruturar log de acordo com a tabela de origem
  CASE TG_TABLE_NAME
    WHEN 'pet_weight_records' THEN
      v_module := 'peso';
      v_title := 'Registro de Peso';
      v_details := jsonb_build_object('peso', NEW.weight || ' kg', 'notas', NEW.notes);
    WHEN 'pet_vaccines' THEN
      v_module := 'vacina';
      v_title := 'Vacina Aplicada: ' || COALESCE(NEW.vaccine_name, '');
      v_details := jsonb_build_object('data', NEW.application_date, 'proxima_dose', NEW.next_dose_date, 'lote', NEW.batch_number);
    WHEN 'pet_exams' THEN
      v_module := 'exame';
      v_title := 'Exame: ' || COALESCE(NEW.exam_type, '');
      v_details := jsonb_build_object('data', NEW.exam_date, 'resultados', NEW.results);
    WHEN 'pet_prescriptions' THEN
      v_module := 'receita';
      v_title := 'Receita: ' || COALESCE(NEW.medication_name, '');
      v_details := jsonb_build_object('dosagem', NEW.dosage, 'frequencia', NEW.frequency, 'duracao', NEW.duration);
    WHEN 'pet_pathologies' THEN
      v_module := 'patologia';
      v_title := 'Patologia: ' || COALESCE(NEW.name, '');
      v_details := jsonb_build_object('data_diagnostico', NEW.diagnosis_date, 'status', NEW.status);
    WHEN 'pet_documents' THEN
      v_module := 'documento';
      v_title := 'Documento: ' || COALESCE(NEW.title, '');
      v_details := jsonb_build_object('tipo', NEW.document_type, 'data', NEW.date);
    WHEN 'pet_hospitalizations' THEN
      v_module := 'internacao';
      v_title := 'Internação';
      v_details := jsonb_build_object('motivo', NEW.reason, 'status', NEW.status, 'data_admissao', NEW.admission_date);
    WHEN 'pet_observations' THEN
      v_module := 'observacao';
      v_title := 'Observação: ' || COALESCE(NEW.title, 'Geral');
      v_details := jsonb_build_object('categoria', NEW.category, 'data', NEW.observation_date);
    WHEN 'pet_videos' THEN
      v_module := 'video';
      v_title := 'Vídeo: ' || COALESCE(NEW.title, 'Sem título');
      v_details := jsonb_build_object('tags', NEW.tags, 'data', NEW.date);
    WHEN 'pet_photos' THEN
      v_module := 'foto';
      v_title := 'Foto: ' || COALESCE(NEW.title, 'Sem título');
      v_details := jsonb_build_object('tags', NEW.tags, 'data', NEW.date);
    WHEN 'mortes' THEN
      v_module := 'obito';
      v_title := 'Registro de Óbito';
      v_details := jsonb_build_object('causa', NEW.causa);
    ELSE
      v_module := 'outros';
      v_title := 'Registro em ' || TG_TABLE_NAME;
  END CASE;

  -- Inserir no histórico se for INSERT (evita flood de atualizações, a menos que se queira logar UPDATE)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pet_admin_history (
      pet_id,
      user_id,
      organization_id,
      module,
      action,
      title,
      details,
      source_table,
      source_id
    ) VALUES (
      NEW.pet_id,
      v_user_id,
      v_organization_id,
      v_module,
      v_action,
      v_title,
      v_details,
      TG_TABLE_NAME,
      NEW.id::TEXT
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Aplicar as triggers nas tabelas

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'pet_weight_records', 'pet_pathologies', 'pet_documents', 'pet_exams',
    'pet_photos', 'pet_vaccines', 'pet_observations', 'pet_prescriptions',
    'pet_videos', 'pet_hospitalizations', 'mortes'
  ]) LOOP
    -- Garantir que não duplica se já rodou
    EXECUTE format('DROP TRIGGER IF EXISTS trg_log_history_%I ON public.%I', t, t);
    
    EXECUTE format('
      CREATE TRIGGER trg_log_history_%I
      AFTER INSERT ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_log_to_pet_history();
    ', t, t);
  END LOOP;
END $$;
