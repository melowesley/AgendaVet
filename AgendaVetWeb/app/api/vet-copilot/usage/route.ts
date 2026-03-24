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

  const clinicId = membership?.clinic_id ?? null

  const url = new URL(req.url)
  const period = (url.searchParams.get('period') || 'month') as
    | 'day'
    | 'week'
    | 'month'

  const report = await observability.getUsageReport(
    clinicId,
    period
  )

  return Response.json(report)
}
