import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logVetAIInteraction, recordVetAction, recordOutcome } from '@/lib/vetai/logger'

/**
 * POST /api/vetai/interactions
 * Logs a new VetAI interaction.
 * Body: { queryText, queryType, patientContext, suggestions, modelVersion, confidenceScore, sessionId }
 */
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('clinic_members')
      .select('clinic_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return Response.json({ error: 'No clinic membership' }, { status: 403 })
    }

    const body = await req.json()
    const { queryText, queryType, patientContext, suggestions, modelVersion, confidenceScore, sessionId } = body

    if (!queryText || !suggestions) {
      return Response.json({ error: 'queryText and suggestions are required' }, { status: 400 })
    }

    const interactionId = await logVetAIInteraction({
      vetId: user.id,
      clinicId: membership.clinic_id,
      query: {
        text: queryText,
        type: queryType || 'duvida_geral',
        patientContext: patientContext || {},
      },
      response: {
        suggestions: Array.isArray(suggestions)
          ? suggestions
          : [{ text: String(suggestions) }],
        modelVersion: modelVersion || 'unknown',
        confidenceScore: confidenceScore ?? undefined,
      },
      sessionId,
    })

    return Response.json({ id: interactionId })
  } catch (error: any) {
    console.error('[VetAI] Failed to log interaction:', error)
    return Response.json({ error: 'Failed to log interaction' }, { status: 500 })
  }
}

/**
 * PATCH /api/vetai/interactions
 * Updates an interaction with vet action feedback or outcome.
 * Body: { id, type: 'feedback' | 'outcome', ... }
 */
export async function PATCH(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, type } = body

    if (!id || !type) {
      return Response.json({ error: 'id and type are required' }, { status: 400 })
    }

    if (type === 'feedback') {
      const { feedback, followedSuggestion, actionTaken } = body
      await recordVetAction(id, {
        taken: actionTaken,
        followedSuggestion: followedSuggestion ?? (feedback >= 4),
        feedback,
      })
    } else if (type === 'outcome') {
      const { status, notes } = body
      if (!['melhorou', 'piorou', 'neutro', 'sem_followup'].includes(status)) {
        return Response.json({ error: 'Invalid outcome status' }, { status: 400 })
      }
      await recordOutcome(id, { status, notes })
    } else {
      return Response.json({ error: 'Invalid type. Use "feedback" or "outcome"' }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch (error: any) {
    console.error('[VetAI] Failed to update interaction:', error)
    return Response.json({ error: 'Failed to update interaction' }, { status: 500 })
  }
}
