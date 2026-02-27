-- =============================================================================
-- REGULARIZAR ACESSO ADMIN — AgendaVet
-- Se você perdeu o acesso ao painel, siga estes passos:
-- 1. Entre no Supabase → Authentication → Users
-- 2. Copie o ID (UUID) do seu usuário
-- 3. Cole o ID no lugar de 'SEU_ID_AQUI' abaixo e rode este script
-- =============================================================================

DO $$ 
DECLARE 
    target_user_id UUID := 'e51f6817-4016-44d5-b5d8-af7cff89c4a5'; -- <--- COLE SEU ID AQUI
BEGIN
    -- 1. Garante que o tipo app_role existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    END IF;

    -- 2. Limpa qualquer papel existente para este usuário
    DELETE FROM public.user_roles WHERE user_id = target_user_id;

    -- 3. Insere o novo papel de admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin');

    -- 3. Se por algum motivo o insert falhar ou o usuário já tiver outro papel,
    -- forçamos a atualização para admin
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = target_user_id;

    RAISE NOTICE 'Acesso admin concedido para o usuário %', target_user_id;
END $$;
