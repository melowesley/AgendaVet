-- Ensure pet_prescriptions table exists
CREATE TABLE IF NOT EXISTS pet_prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  prescription_date DATE NOT NULL,
  veterinarian VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_prescriptions_pet_id ON pet_prescriptions(pet_id);

-- Ensure RLS is enabled
ALTER TABLE pet_prescriptions ENABLE ROW LEVEL SECURITY;

-- Ensure policies exist (drop first to avoid errors if they exist but need update)
DROP POLICY IF EXISTS "Admins can manage prescriptions" ON pet_prescriptions;
CREATE POLICY "Admins can manage prescriptions" ON pet_prescriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

DROP POLICY IF EXISTS "Users can view their pet prescriptions" ON pet_prescriptions;
CREATE POLICY "Users can view their pet prescriptions" ON pet_prescriptions FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
);
