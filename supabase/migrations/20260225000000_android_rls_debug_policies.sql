-- =============================================================================
-- Policy temporária para DEBUG no Android
-- Use APENAS para testar se RLS está bloqueando. REMOVA após diagnóstico.
--
-- Para aplicar: execute no SQL Editor do Supabase
-- Para reverter: execute FIX_POLICIES.sql
-- =============================================================================

-- Exemplo: policy pública temporária para SELECT em pet_exams (apenas para teste)
-- Descomente e execute se suspeitar que RLS está bloqueando:

/*
DROP POLICY IF EXISTS "Admins can manage exams" ON public.pet_exams;
DROP POLICY IF EXISTS "Users can view their pet exams" ON public.pet_exams;

-- TEMPORÁRIO: permite SELECT para qualquer usuário autenticado (debug)
CREATE POLICY "DEBUG: authenticated select pet_exams"
  ON public.pet_exams FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage exams"
  ON public.pet_exams FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
*/

-- Verificação: listar policies atuais de uma tabela
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies WHERE tablename = 'pet_exams';
