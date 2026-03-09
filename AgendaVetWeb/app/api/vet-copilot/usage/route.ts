import { createServerSupabaseClient } from '@/lib/supabase/server'
import { observability } from '@/lib/vet-copilot/observability'

export async function GET(req: Request) {
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

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return Response.json({ error: 'Admin only' }, { status: 403 })
  }

  const url = new URL(req.url)
  const period = (url.searchParams.get('period') || 'month') as
    | 'day'
    | 'week'
    | 'month'

  const report = await observability.getUsageReport(
    membership.clinic_id,
    period
  )

  return Response.json(report)
}
