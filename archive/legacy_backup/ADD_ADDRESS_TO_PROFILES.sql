-- Adiciona coluna de endereço na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Atualiza a função handle_new_user para salvar endereço e telefone do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, address)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'address'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone     = EXCLUDED.phone,
    address   = EXCLUDED.address;
  RETURN NEW;
END;
$$;
