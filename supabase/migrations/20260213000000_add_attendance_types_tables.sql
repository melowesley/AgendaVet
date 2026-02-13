-- Create table for weight records
CREATE TABLE public.pet_weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_request_id UUID UNIQUE REFERENCES public.appointment_requests(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for exam records
CREATE TABLE public.pet_exam_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_request_id UUID UNIQUE REFERENCES public.appointment_requests(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  request_details TEXT,
  results TEXT,
  exam_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for documents
CREATE TABLE public.pet_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_request_id UUID UNIQUE REFERENCES public.appointment_requests(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for vaccine records
CREATE TABLE public.pet_vaccine_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_request_id UUID UNIQUE REFERENCES public.appointment_requests(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  laboratory TEXT,
  batch_number TEXT,
  next_dose_date DATE,
  notes TEXT,
  administered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for prescriptions
CREATE TABLE public.pet_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_request_id UUID UNIQUE REFERENCES public.appointment_requests(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medications TEXT NOT NULL,
  dosage TEXT,
  duration TEXT,
  notes TEXT,
  prescribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.pet_weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_exam_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_vaccine_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pet_weight_records
CREATE POLICY "Users can view their pet weight records"
ON public.pet_weight_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = pet_weight_records.pet_id
    AND pets.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all weight records"
ON public.pet_weight_records FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert weight records"
ON public.pet_weight_records FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update weight records"
ON public.pet_weight_records FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for pet_exam_records
CREATE POLICY "Users can view their pet exam records"
ON public.pet_exam_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = pet_exam_records.pet_id
    AND pets.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all exam records"
ON public.pet_exam_records FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert exam records"
ON public.pet_exam_records FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update exam records"
ON public.pet_exam_records FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for pet_documents
CREATE POLICY "Users can view their pet documents"
ON public.pet_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = pet_documents.pet_id
    AND pets.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all documents"
ON public.pet_documents FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert documents"
ON public.pet_documents FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update documents"
ON public.pet_documents FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for pet_vaccine_records
CREATE POLICY "Users can view their pet vaccine records"
ON public.pet_vaccine_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = pet_vaccine_records.pet_id
    AND pets.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all vaccine records"
ON public.pet_vaccine_records FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert vaccine records"
ON public.pet_vaccine_records FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update vaccine records"
ON public.pet_vaccine_records FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for pet_prescriptions
CREATE POLICY "Users can view their pet prescriptions"
ON public.pet_prescriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = pet_prescriptions.pet_id
    AND pets.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all prescriptions"
ON public.pet_prescriptions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert prescriptions"
ON public.pet_prescriptions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update prescriptions"
ON public.pet_prescriptions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_pet_weight_records_pet_id ON public.pet_weight_records(pet_id);
CREATE INDEX idx_pet_weight_records_appointment_id ON public.pet_weight_records(appointment_request_id);

CREATE INDEX idx_pet_exam_records_pet_id ON public.pet_exam_records(pet_id);
CREATE INDEX idx_pet_exam_records_appointment_id ON public.pet_exam_records(appointment_request_id);

CREATE INDEX idx_pet_documents_pet_id ON public.pet_documents(pet_id);
CREATE INDEX idx_pet_documents_appointment_id ON public.pet_documents(appointment_request_id);

CREATE INDEX idx_pet_vaccine_records_pet_id ON public.pet_vaccine_records(pet_id);
CREATE INDEX idx_pet_vaccine_records_appointment_id ON public.pet_vaccine_records(appointment_request_id);

CREATE INDEX idx_pet_prescriptions_pet_id ON public.pet_prescriptions(pet_id);
CREATE INDEX idx_pet_prescriptions_appointment_id ON public.pet_prescriptions(appointment_request_id);
