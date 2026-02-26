-- =============================================================================
-- Setup para ambiente de TESTE - AgendaVet
-- 1. Atribui role 'user' automaticamente a novos usuários ao se cadastrarem
-- 2. Garante que usuários autenticados possam acessar suas próprias tabelas
-- =============================================================================

-- Atualizar handle_new_user para também inserir role 'user' em user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (user_id, full_name, phone, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone     = COALESCE(EXCLUDED.phone, profiles.phone),
    address   = COALESCE(EXCLUDED.address, profiles.address);

  -- Garantir que todo novo usuário tenha role 'user' (para consistência e acesso)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Inserir role 'user' para usuários existentes que ainda não têm
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::public.app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'user')
ON CONFLICT (user_id, role) DO NOTHING;
