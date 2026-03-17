import { supabase } from '@/lib/supabase/supabase'

export const contextBuilder = {
    async build(petId: string): Promise<string> {
        try {
            const [petRes, recordsRes] = await Promise.all([
                supabase.from('pets').select('*').eq('id', petId).single(),
                supabase.from('medical_records').select('*').eq('pet_id', petId).order('created_at', { ascending: false }).limit(10),
            ])

            const pet = petRes.data
            const records = recordsRes.data || []

            if (!pet) return ''

            const petInfo = `Paciente: ${pet.name}, Espécie: ${pet.species}, Raça: ${pet.breed || 'SRD'}, Sexo: ${pet.gender || 'N/I'}, Peso: ${pet.weight || 'N/I'} kg`

            const historyLines = records.map((r: any) =>
                `- [${r.type}] ${r.title} (${r.date || r.created_at})`
            ).join('\n')

            return `\n--- Contexto Clínico ---\n${petInfo}\n\nHistórico recente:\n${historyLines}\n--- Fim do Contexto ---\n`
        } catch {
            return ''
        }
    }
}
