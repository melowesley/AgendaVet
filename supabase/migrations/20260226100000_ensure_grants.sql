-- ============================================================================
-- Ambiente de teste: destravar auth + grants sem abrir mão do RLS.
-- Aplica:
--   1) bootstrap de role "user" para novos usuários + backfill existentes
--   2) grants explícitos para evitar "permission denied for table ..."
-- ============================================================================

-- 1) Garantir função/trigger de criação de perfil + role padrão "user"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Backfill: garante ao menos role "user" para todas as contas já criadas
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.user_roles ur
  WHERE ur.user_id = u.id
    AND ur.role = 'user'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Grants explícitos para evitar bloqueios no PostgREST
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Tabelas acessadas no portal do tutor (RLS continua aplicando filtros)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.appointment_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT SELECT ON TABLE public.services TO anon, authenticated;

-- Tabelas clínicas e histórico usadas pelos fluxos de teste
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.anamnesis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pet_admin_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pet_weight_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pet_pathologies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pet_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pet_exams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pet_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pet_vaccines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pet_prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pet_observations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pet_videos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pet_hospitalizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pet_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mortes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.audit_logs TO authenticated;
