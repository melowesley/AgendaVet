import { createServerSupabaseClient } from '@/lib/supabase/server'
import { actionsModule } from '@/lib/vet-copilot/actions'
import type { ClinicalActionPreview } from '@/lib/vet-copilot/types'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('clinic_members')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin', 'vet'].includes(membership.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { action, decision } = body as {
    action: ClinicalActionPreview
    decision: 'confirm' | 'reject'
  }

  if (!action || !decision) {
    return Response.json(
      { error: 'action and decision are required' },
      { status: 400 }
    )
  }

  if (!actionsModule.isWriteAction(action)) {
    return Response.json({ error: 'Invalid action format' }, { status: 400 })
  }

  if (decision === 'reject') {
    return Response.json({
      success: true,
      message: 'Acao rejeitada pelo veterinario.',
    })
  }

  const result = await actionsModule.confirmAction(
    action,
    user.id,
    membership.clinic_id
  )

  return Response.json(result)
}
