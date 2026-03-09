import { createServiceSupabaseClient } from '@/lib/supabase/service'
import type { ClinicalActionPreview } from './types'
import { observability } from './observability'

const ACTION_HANDLERS: Record<
  string,
  (preview: Record<string, any>) => Promise<any>
> = {
  create_prescription: async (preview) => {
    const supabase = createServiceSupabaseClient()
    const { data, error } = await (supabase
      .from('pet_prescriptions') as any)
      .insert({
        pet_id: preview.petId,
        medication: preview.medication,
        dosage: preview.dosage,
        frequency: preview.frequency,
        notes: `Duracao: ${preview.duration}. ${preview.notes || ''}`.trim(),
      })
      .select('id')
      .single()

    if (error) throw new Error(`Falha ao criar prescricao: ${error.message}`)
    return { id: data.id, type: 'prescription', success: true }
  },

  create_observation: async (preview) => {
    const supabase = createServiceSupabaseClient()
    const { data, error } = await (supabase
      .from('pet_observations') as any)
      .insert({
        pet_id: preview.petId,
        observation: preview.observation,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Falha ao criar observacao: ${error.message}`)
    return { id: data.id, type: 'observation', success: true }
  },

  create_clinical_summary: async (preview) => {
    const supabase = createServiceSupabaseClient()
    const { data, error } = await (supabase
      .from('pet_observations') as any)
      .insert({
        pet_id: preview.petId,
        observation: preview.formattedSummary,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Falha ao criar resumo: ${error.message}`)
    return { id: data.id, type: 'clinical_summary', success: true }
  },
}

export const actionsModule = {
  async confirmAction(
    action: ClinicalActionPreview,
    userId: string,
    clinicId: string
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const handler = ACTION_HANDLERS[action.actionType]
    if (!handler) {
      return { success: false, error: `Acao desconhecida: ${action.actionType}` }
    }

    try {
      const result = await handler(action.preview)

      await observability.logClinicalAudit({
        clinicId,
        userId,
        action: action.actionType,
        petId: action.preview.petId,
        details: { preview: action.preview, result },
      })

      return { success: true, result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  isWriteAction(action: any): action is ClinicalActionPreview {
    return (
      action?.status === 'pending_confirmation' &&
      action?.confirmationRequired === true
    )
  },
}
