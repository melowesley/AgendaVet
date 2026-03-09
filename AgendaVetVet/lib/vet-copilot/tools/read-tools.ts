import { createServiceSupabaseClient } from '../../../supabase/service'
import { z } from 'zod'

const PetIdSchema = z.object({
  petId: z.string().uuid().describe('ID do pet no sistema'),
})

export const readTools = {
  get_pet_info: {
    description:
      'Busca informacoes basicas do pet: nome, especie, raca, idade, peso e tutor.',
    parameters: PetIdSchema,
    async execute({ petId }: { petId: string }) {
      const supabase = createServiceSupabaseClient()
      const { data, error } = await (supabase
        .from('pets') as any)
        .select('id, name, type, breed, age, weight, notes, profiles:user_id(full_name, phone)')
        .eq('id', petId)
        .single()

      if (error || !data) return { error: 'Pet nao encontrado' }
      return {
        id: data.id,
        name: data.name,
        species: data.type,
        breed: data.breed,
        age: data.age,
        weight: data.weight,
        notes: data.notes,
        owner: data.profiles,
      }
    },
  },

  get_medical_history: {
    description:
      'Retorna historico medico completo: observacoes, exames, vacinas e prescricoes.',
    parameters: PetIdSchema,
    async execute({ petId }: { petId: string }) {
      const supabase = createServiceSupabaseClient()
      const [obs, exams, vaccines, prescriptions] = await Promise.all([
        (supabase.from('pet_observations') as any)
          .select('*')
          .eq('pet_id', petId)
          .order('created_at', { ascending: false })
          .limit(15),
        (supabase.from('pet_exams') as any)
          .select('*')
          .eq('pet_id', petId)
          .order('created_at', { ascending: false })
          .limit(10),
        (supabase.from('pet_vaccines') as any)
          .select('*')
          .eq('pet_id', petId)
          .order('created_at', { ascending: false }),
        (supabase.from('pet_prescriptions') as any)
          .select('*')
          .eq('pet_id', petId)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      return {
        observations: obs.data || [],
        exams: exams.data || [],
        vaccines: vaccines.data || [],
        prescriptions: prescriptions.data || [],
        summary: `${(obs.data || []).length} obs, ${(exams.data || []).length} exames, ${(vaccines.data || []).length} vacinas, ${(prescriptions.data || []).length} prescricoes`,
      }
    },
  },

  get_vaccination_status: {
    description: 'Retorna status vacinal do pet com vacinas pendentes e atrasadas.',
    parameters: PetIdSchema,
    async execute({ petId }: { petId: string }) {
      const supabase = createServiceSupabaseClient()
      const { data: vaccines } = await (supabase
        .from('pet_vaccines') as any)
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })

      const list = vaccines || []
      const today = new Date()
      const pending = list.filter(
        (v: any) => v.next_dose_date && new Date(v.next_dose_date) < today
      )

      return {
        totalVaccines: list.length,
        pendingVaccines: pending.map((v: any) => v.vaccine_name || v.name),
        isUpToDate: pending.length === 0,
        vaccines: list.slice(0, 10).map((v: any) => ({
          name: v.vaccine_name || v.name,
          date: v.created_at,
          nextDose: v.next_dose_date,
        })),
      }
    },
  },

  get_current_medications: {
    description: 'Retorna medicacoes ativas do pet (ultimos 30 dias).',
    parameters: PetIdSchema,
    async execute({ petId }: { petId: string }) {
      const supabase = createServiceSupabaseClient()
      const { data } = await (supabase
        .from('pet_prescriptions') as any)
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })
        .limit(15)

      const meds = data || []
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const active = meds.filter((p: any) => {
        const created = new Date(p.created_at)
        const end = p.end_date ? new Date(p.end_date) : null
        return created > thirtyDaysAgo && (!end || end > new Date())
      })

      return {
        currentMedications: active.map((m: any) => ({
          medication: m.medication || m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          startDate: m.created_at,
        })),
        totalPrescriptions: meds.length,
      }
    },
  },

  get_recent_exams: {
    description: 'Retorna exames laboratoriais recentes do pet.',
    parameters: PetIdSchema,
    async execute({ petId }: { petId: string }) {
      const supabase = createServiceSupabaseClient()
      const { data } = await (supabase
        .from('pet_exams') as any)
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })
        .limit(10)

      return {
        recentExams: (data || []).map((e: any) => ({
          type: e.exam_type,
          name: e.name,
          date: e.exam_date || e.created_at,
          results: e.results,
          notes: e.notes,
        })),
        totalExams: data?.length || 0,
      }
    },
  },
}
