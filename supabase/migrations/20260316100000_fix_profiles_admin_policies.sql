-- Fix: Add admin policies for INSERT/UPDATE/DELETE on profiles table
-- Without these, vets cannot create tutor profiles (clients) because
-- the existing INSERT policy requires auth.uid() = user_id,
-- but tutors don't have auth accounts (user_id is NULL).

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
