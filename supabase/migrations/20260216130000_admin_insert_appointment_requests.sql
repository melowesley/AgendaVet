-- Permitir que admins criem appointment_requests (ex: ao iniciar atendimento pela ficha do pet)
CREATE POLICY "Admins can insert appointment requests"
ON public.appointment_requests FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));
