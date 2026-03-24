-- supabase/migrations/20260321_rpc_register.sql

CREATE OR REPLACE FUNCTION register_user_profile(
  p_user_id   uuid,
  p_full_name text,
  p_role      app_role,
  p_status    text,
  p_idade     int DEFAULT NULL,
  p_genero    text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Upsert em profiles
  INSERT INTO profiles (user_id, full_name, idade, genero, updated_at)
  VALUES (p_user_id, p_full_name, p_idade, p_genero, now())
  ON CONFLICT (user_id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        idade      = EXCLUDED.idade,
        genero     = EXCLUDED.genero,
        updated_at = now();

  -- Upsert em user_roles
  INSERT INTO user_roles (user_id, role, status)
  VALUES (p_user_id, p_role, p_status)
  ON CONFLICT (user_id) DO UPDATE
    SET role   = EXCLUDED.role,
        status = EXCLUDED.status;
END;
$$;
