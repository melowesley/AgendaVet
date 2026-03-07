-- =============================================================================
-- FIX_VET_APP_ACCESS.sql — Corrige acesso do Veterinário no App Mobile (V2)
-- Problema: is_admin() consulta a tabela user_roles (não a coluna role de profiles).
-- O usuário veterinário não tem registro em user_roles com role='admin'.
-- =============================================================================

-- PASSO 1: Ver todos os usuários e seus papéis atuais
SELECT 
  au.id,
  au.email,
  p.full_name,
  p.organization_id,
  ur.role
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
ORDER BY au.created_at DESC;

-- =============================================================================
-- PASSO 2: Inserir o veterinário na tabela user_roles como admin
-- Substitua o email do veterinário abaixo antes de rodar:
-- =============================================================================
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'wesleimelo98@gmail.com'-- ← SUBSTITUA pelo email real
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- =============================================================================
-- PASSO 3: Garante que todos pets têm organization_id (dados legados)
-- =============================================================================
UPDATE public.pets 
SET organization_id = 'a0000000-0000-0000-0000-000000000001' 
WHERE organization_id IS NULL;

UPDATE public.profiles
SET organization_id = 'a0000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- =============================================================================
-- PASSO 4: Garante que o profile do vet tem organization_id
-- =============================================================================
UPDATE public.profiles
SET organization_id = 'a0000000-0000-0000-0000-000000000001'
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'wesleimelo98@gmail.com'  -- ← SUBSTITUA
)
AND (organization_id IS NULL OR organization_id != 'a0000000-0000-0000-0000-000000000001');

-- =============================================================================
-- PASSO 5: Corrigir policies de RLS para pets e histórico
-- (remove policies conflitantes e cria uma mais robusta)
-- =============================================================================

-- pets: admin lê tudo, tutor lê os seus
DROP POLICY IF EXISTS "vet_read_all_pets" ON public.pets;
DROP POLICY IF EXISTS "admin_org_access" ON public.pets;
DROP POLICY IF EXISTS "admin_org_access_pets" ON public.pets;

CREATE POLICY "Admin full access pets"
ON public.pets FOR ALL
TO authenticated
USING (public.is_admin());

-- Garante que tutores ainda conseguem ver seus pets
DROP POLICY IF EXISTS "User read own pets" ON public.pets;
CREATE POLICY "User read own pets"
ON public.pets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- pet_admin_history: admin lê tudo
DROP POLICY IF EXISTS "vet_read_history" ON public.pet_admin_history;
DROP POLICY IF EXISTS "admin_org_access_pet_admin_history" ON public.pet_admin_history;

CREATE POLICY "Admin only history access"
ON public.pet_admin_history FOR ALL
TO authenticated
USING (public.is_admin());

-- INSERT permission para admin gravar histórico
DROP POLICY IF EXISTS "admin_insert_history" ON public.pet_admin_history;
CREATE POLICY "admin_insert_history"
ON public.pet_admin_history FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- =============================================================================
-- VERIFICAÇÃO FINAL: confirme que o veterinário agora é admin
-- =============================================================================
SELECT 
  au.email,
  p.full_name,
  p.organization_id,
  ur.role,
  public.is_admin() as is_admin_now
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id  
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE au.email = 'wesleimelo98@gmail.com';  -- ← SUBSTITUA
