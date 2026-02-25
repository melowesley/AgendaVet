import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PetListItem {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
  user_id: string;
  created_at: string;
  owner_name: string | null;
  owner_phone: string | null;
  prescriptions: PetPrescriptionSummary[];
  hospitalization_status: string | null;
  hospitalization_location: string | null;
}

export interface PetPrescriptionSummary {
  id: string;
  medication_name: string;
  prescription_date: string;
  veterinarian: string | null;
}

async function fetchPetsList(): Promise<PetListItem[]> {
  const { data: petsData, error: petsError } = await supabase
    .from('pets')
    .select('*')
    .order('name', { ascending: true });

  if (petsError || !petsData) throw petsError ?? new Error('Falha ao buscar pets');

  const userIds = [...new Set(petsData.map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, full_name, phone')
    .in('user_id', userIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.user_id, { full_name: p.full_name, phone: p.phone }]),
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: prescriptions } = await supabase
    .from('pet_prescriptions')
    .select('id, pet_id, medication_name, prescription_date, veterinarian')
    .gte('prescription_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('prescription_date', { ascending: false });

  const prescMap = new Map<string, PetPrescriptionSummary[]>();
  if (prescriptions) {
    for (const p of prescriptions) {
      const existing = prescMap.get(p.pet_id) || [];
      existing.push({
        id: p.id,
        medication_name: p.medication_name,
        prescription_date: p.prescription_date,
        veterinarian: p.veterinarian,
      });
      prescMap.set(p.pet_id, existing);
    }
  }

  const { data: hospitalizations } = await supabase
    .from('pet_hospitalizations')
    .select('pet_id, status, reason, notes')
    .in('status', ['internado', 'ativo', 'admitted']);

  const hospMap = new Map<string, { status: string; location: string | null }>();
  if (hospitalizations) {
    for (const h of hospitalizations) {
      hospMap.set(h.pet_id, { status: h.status, location: h.notes ?? null });
    }
  }

  return petsData.map((pet) => {
    const profile = profileMap.get(pet.user_id);
    const hosp = hospMap.get(pet.id);
    return {
      id: pet.id,
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      notes: pet.notes,
      user_id: pet.user_id,
      created_at: pet.created_at,
      owner_name: profile?.full_name || null,
      owner_phone: profile?.phone || null,
      prescriptions: prescMap.get(pet.id) || [],
      hospitalization_status: hosp?.status || null,
      hospitalization_location: hosp?.location || null,
    };
  });
}

export const usePetsList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pets-list'],
    queryFn: fetchPetsList,
  });

  const allPets = data ?? [];

  const filteredPets = allPets.filter((pet) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      pet.name.toLowerCase().includes(term) ||
      (pet.owner_name && pet.owner_name.toLowerCase().includes(term)) ||
      (pet.breed && pet.breed.toLowerCase().includes(term)) ||
      (pet.type && pet.type.toLowerCase().includes(term))
    );
  });

  return {
    pets: filteredPets,
    allPets,
    loading: isLoading,
    searchTerm,
    setSearchTerm,
    refetch,
  };
};
