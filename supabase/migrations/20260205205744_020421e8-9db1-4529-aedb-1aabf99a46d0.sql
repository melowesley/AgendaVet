-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create services/prices table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Everyone can view active services
CREATE POLICY "Anyone can view active services"
ON public.services FOR SELECT
USING (active = true);

-- Admins can manage all services
CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at on services
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add status options and admin notes to appointment_requests
ALTER TABLE public.appointment_requests 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id),
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TEXT,
ADD COLUMN IF NOT EXISTS veterinarian TEXT;

-- Allow admins to view all appointment requests
CREATE POLICY "Admins can view all appointment requests"
ON public.appointment_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all appointment requests
CREATE POLICY "Admins can update all appointment requests"
ON public.appointment_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all pets (for request context)
CREATE POLICY "Admins can view all pets"
ON public.pets FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles (for client info)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Insert some default services
INSERT INTO public.services (name, description, price, duration_minutes) VALUES
('Consulta Geral', 'Consulta veterinária de rotina', 150.00, 30),
('Vacinação', 'Aplicação de vacinas', 80.00, 15),
('Exame de Sangue', 'Coleta e análise laboratorial', 120.00, 20),
('Ultrassonografia', 'Exame de ultrassom', 200.00, 45),
('Cirurgia Simples', 'Procedimentos cirúrgicos de baixa complexidade', 500.00, 60),
('Limpeza Dentária', 'Profilaxia dental completa', 350.00, 45);