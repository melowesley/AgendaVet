import { createServiceSupabaseClient } from '@/lib/supabase/service'

export interface VetAIQuery {
  text: string
  type: 'diagnostico' | 'tratamento' | 'protocolo' | 'duvida_geral' | 'calculo_dose' | 'interacoes' | 'historico'
  patientContext?: {
    especie?: string
    raca?: string
    idade?: number
    sintomas?: string[]
    petId?: string
  }
}

export interface VetAISuggestion {
  text: string
  reasoning?: string
  confidence?: number
  sources?: string[]
}

export interface VetAIResponse {
  suggestions: VetAISuggestion[]
  modelVersion: string
  confidenceScore?: number
}

export interface VetAIInteractionInput {
  vetId: string
  clinicId: string
  query: VetAIQuery
  response: VetAIResponse
  sessionId?: string
}

/**
 * Logs a VetAI interaction to the database.
 * Returns the interaction ID for subsequent feedback/outcome recording.
 */
export async function logVetAIInteraction(
  interaction: VetAIInteractionInput
): Promise<string> {
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .from('vet_ai_interactions' as any)
    .insert({
      vet_id: interaction.vetId,
      clinic_id: interaction.clinicId,
      query_text: interaction.query.text,
      query_type: interaction.query.type,
      patient_context: interaction.query.patientContext || {},
      ai_suggestions: interaction.response.suggestions,
      model_version: interaction.response.modelVersion,
      confidence_score: interaction.response.confidenceScore ?? null,
      session_id: interaction.sessionId || crypto.randomUUID(),
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to log VetAI interaction: ${error.message}`)
  return (data as any).id as string
}

/**
 * Records what the veterinarian actually did after receiving AI suggestions.
 */
export async function recordVetAction(
  interactionId: string,
  action: {
    taken?: any
    followedSuggestion: boolean
    feedback?: number
  }
): Promise<void> {
  const supabase = createServiceSupabaseClient()

  const { error } = await supabase
    .from('vet_ai_interactions' as any)
    .update({
      action_taken: action.taken ?? null,
      followed_suggestion: action.followedSuggestion,
      immediate_feedback: action.feedback ?? null,
    })
    .eq('id', interactionId)

  if (error) throw new Error(`Failed to record vet action: ${error.message}`)
}

/**
 * Records the clinical outcome of an interaction (on follow-up visit).
 */
export async function recordOutcome(
  interactionId: string,
  outcome: {
    status: 'melhorou' | 'piorou' | 'neutro' | 'sem_followup'
    notes?: string
  }
): Promise<void> {
  const supabase = createServiceSupabaseClient()

  const { error } = await supabase
    .from('vet_ai_interactions' as any)
    .update({
      outcome: outcome.status,
      outcome_notes: outcome.notes ?? null,
      outcome_recorded_at: new Date().toISOString(),
    })
    .eq('id', interactionId)

  if (error) throw new Error(`Failed to record outcome: ${error.message}`)
}
