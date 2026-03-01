import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

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
}

export function usePets() {
    const { session } = useAuth();
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchPets() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pets')
                .select('*')
                .order('name');

            if (error) throw error;
            setPets(data || []);
        } catch (err: any) {
            console.error('Error fetching pets:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function addPet(petData: Partial<Pet>) {
        try {
            if (!session?.user?.id) throw new Error('Não autenticado');

            const { data, error } = await supabase
                .from('pets')
                .insert([{ ...petData, user_id: session.user.id }])
                .select()
                .single();

            if (error) throw error;
            setPets(prev => [data, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
            return { data, error: null };
        } catch (err: any) {
            console.error('Error adding pet:', err);
            return { data: null, error: err.message };
        }
    }

    useEffect(() => {
        if (session) {
            fetchPets();
        }
    }, [session]);

    return { pets, loading, error, refresh: fetchPets, addPet };
}
