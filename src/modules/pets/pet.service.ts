import { supabase } from '@/integrations/supabase/client';

export interface Pet {
    id: string;
    name: string;
    type: string;
    breed: string | null;
    age: string | null;
    weight: string | null;
    notes: string | null;
    user_id: string;
}

export const PetService = {
    async getById(id: string): Promise<Pet | null> {
        const { data, error } = await supabase
            .from('pets')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching pet:', error);
            return null;
        }
        return data as Pet;
    },

    async getOwnerProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('full_name, phone, address')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error fetching owner profile:', error);
            return null;
        }
        return data;
    },

    async listServices(petId: string) {
        const { data, error } = await supabase
            .from('pet_services')
            .select('id, service_name, price_snapshot, quantity, created_at')
            .eq('pet_id', petId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pet services:', error);
            return [];
        }
        return data;
    },

    async logHistory(params: {
        petId: string;
        module: string;
        action: string;
        title: string;
        details: any;
        sourceId: string | null;
    }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        return await supabase.from('pet_admin_history').insert({
            pet_id: params.petId,
            user_id: user.id,
            module: params.module,
            action: params.action,
            title: params.title,
            details: params.details,
            source_id: params.sourceId,
        });
    }
};
