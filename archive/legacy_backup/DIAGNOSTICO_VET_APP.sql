-- =============================================================================
-- DIAGNOSTICO_VET_APP.sql — Diagnóstico de acesso do Veterinário
-- Execute no Supabase SQL Editor e veja os resultados
-- =============================================================================

-- 1. Lista todos os profiles e seus respectivos papeis nas user_roles
SELECT 
  p.user_id, 
  p.full_name, 
  ur.role, 
  p.organization_id,
  p.created_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
ORDER BY p.created_at DESC
LIMIT 20;

-- 2. Verifica se a função is_admin() existe e como funciona
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'is_admin' 
  AND pronamespace = 'public'::regnamespace;

-- 3. Verifica se a função my_organization_id() existe
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'my_organization_id' 
  AND pronamespace = 'public'::regnamespace;

-- 4. Lista as políticas ativas na tabela pets
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'pets' AND schemaname = 'public'
ORDER BY policyname;

-- 5. Conta quantos pets existem e quantos têm organization_id preenchido
SELECT 
  COUNT(*) as total_pets,
  COUNT(organization_id) as pets_com_org,
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as pets_sem_org
FROM public.pets;
