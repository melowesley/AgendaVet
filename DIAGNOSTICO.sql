-- =============================================================================
-- DIAGNÓSTICO — rode no SQL Editor do Supabase e me mande o resultado
-- =============================================================================

-- 1. Verifica se o usuário admin existe na tabela user_roles
SELECT
  u.email,
  ur.role,
  ur.user_id
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at DESC;

-- 2. Verifica quais tabelas existem no banco
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. Verifica se as políticas de RLS estão criadas nas tabelas principais
SELECT
  schemaname,
  tablename,
  policyname,
  cmd AS operacao,
  qual AS condicao_using
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('pets', 'appointment_requests', 'pet_admin_history',
                    'pet_weight_records', 'pet_observations', 'pet_vaccines',
                    'pet_prescriptions', 'pet_exams', 'pet_hospitalizations',
                    'pet_pathologies', 'pet_documents', 'mortes')
ORDER BY tablename, cmd;

-- 4. Testa se a função has_role está funcionando
-- (substitua o UUID pelo UUID do seu usuário admin)
-- SELECT public.has_role('COLE_UUID_DO_ADMIN_AQUI', 'admin');
