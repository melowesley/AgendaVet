-- =============================================================================
-- Migration: Fluxo completo Tutor → Pet → Agendamento → Veterinário
-- Data: 2026-02-26
-- =============================================================================
-- Esta migration:
--  1. Garante que novos usuários (tutores) recebam role 'user' automaticamente
--  2. Validação: pet deve pertencer ao user_id ao criar appointment
-- =============================================================================

-- Garantir que profiles tenha coluna address (compatibilidade)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- ─── 1. Atribuir role 'user' a novos usuários (tutores) ao se cadastrarem ─────
-- Modifica handle_new_user para também inserir em user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar/atualizar perfil (compatível com tabelas com ou sem address)
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

  -- Atribuir role 'user' (tutor) a novos usuários
  -- Admins são criados manualmente via UserManagement ou edge function
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Garantir que usuários existentes sem role recebam 'user'
-- (útil para ambientes que já tinham tutores cadastrados antes desta migration)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ─── 2. Política: tutores só podem criar appointment para seus próprios pets ───
-- A política "Users can insert their own appointment requests" já exige auth.uid() = user_id.
-- Adicionamos uma constraint de validação no aplicativo (pet.user_id = auth.uid()).
-- O RLS com WITH CHECK (auth.uid() = user_id) já garante que o user_id seja do usuário.
-- Para garantir que o pet pertence ao tutor, usamos uma função de validação.

-- Validação: ao inserir como tutor (não-admin), o pet deve pertencer ao user_id
CREATE OR REPLACE FUNCTION public.check_pet_belongs_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins podem inserir para qualquer tutor/pet
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RETURN NEW;
  END IF;
  -- Tutores: user_id deve ser o próprio e o pet deve ser dele
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'user_id deve ser o usuário autenticado';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pets WHERE id = NEW.pet_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'O pet selecionado não pertence ao tutor';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_pet_owner_on_appointment_insert ON public.appointment_requests;
CREATE TRIGGER check_pet_owner_on_appointment_insert
  BEFORE INSERT ON public.appointment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_pet_belongs_to_user();

-- ─── 3. Comentário: status default 'pending' já está na tabela ───────────────
-- appointment_requests.status DEFAULT 'pending' já está definido em migrations anteriores.
-- Quando o tutor agenda, o status é 'pending'. O admin confirma e define scheduled_date e scheduled_time.
