import { createServerSupabaseClient } from '@/lib/supabase/server'

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
    .select('clinic_id')
    .eq('user_id', user.id)
    .single()

  const clinicId = membership?.clinic_id ?? null

  const url = new URL(req.url)
  const conversationId = url.searchParams.get('conversationId')

  if (conversationId) {
    const { data: messages } = await supabase
      .from('ai_messages')
      .select('id, role, content, model, token_count, latency_ms, tool_calls, clinical_action, created_at')
      .eq('conversation_id', conversationId)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: true })

    return Response.json({ messages: messages || [] })
  }

  const petId = url.searchParams.get('petId')
  const limit = parseInt(url.searchParams.get('limit') || '20')

  let query = supabase
    .from('ai_conversations')
    .select('id, title, pet_id, model_used, created_at, updated_at')
    .eq('clinic_id', clinicId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (petId) {
    query = query.eq('pet_id', petId)
  }

  const { data: conversations } = await query

  return Response.json({ conversations: conversations || [] })
}
