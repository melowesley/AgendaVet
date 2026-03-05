import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Pet {
    id: string;
    name: string;
    type: string;
    breed: string | null;
    age: string | null;
    weight: string | null;
    notes: string | null;
    user_id: string;
    created_at: string;
    owner_name?: string | null;
    owner_phone?: string | null;
    hospitalization_status?: string | null;
}

async function fetchPetsList(): Promise<Pet[]> {
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

    const { data: hospitalizations } = await supabase
        .from('pet_hospitalizations')
        .select('pet_id, status')
        .in('status', ['internado', 'ativo', 'admitted']);

    const hospMap = new Map<string, string>();
    if (hospitalizations) {
        for (const h of hospitalizations) {
            hospMap.set(h.pet_id, h.status);
        }
    }

    return petsData.map((pet) => {
        const profile = profileMap.get(pet.user_id);
        const hospStatus = hospMap.get(pet.id);
        return {
            ...pet,
            owner_name: profile?.full_name || null,
            owner_phone: profile?.phone || null,
            hospitalization_status: hospStatus || null,
        };
    });
}

export function usePets() {
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
            (pet.breed && pet.breed.toLowerCase().includes(term))
        );
    });

    return {
        pets: filteredPets,
        allPets,
        loading: isLoading,
        searchTerm,
        setSearchTerm,
        refresh: refetch,
        addPet: async (petData: Partial<Pet>) => {
            // Implementation for adding pet if needed
            const { data, error } = await supabase
                .from('pets')
                .insert([petData])
                .select()
                .single();
            if (!error) refetch();
            return { data, error: error ? error.message : null };
        }
    };
}
