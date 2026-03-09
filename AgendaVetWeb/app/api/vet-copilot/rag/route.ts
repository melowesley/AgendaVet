import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ragModule } from '@/lib/vet-copilot/rag'

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

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return Response.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await req.json()
  const { title, content, sourceType, sourceUrl, metadata } = body

  if (!title || !content || !sourceType) {
    return Response.json(
      { error: 'title, content, and sourceType are required' },
      { status: 400 }
    )
  }

  try {
    const docId = await ragModule.ingestDocument({
      clinicId: membership.clinic_id,
      title,
      content,
      sourceType,
      sourceUrl,
      metadata,
    })

    return Response.json({ success: true, documentId: docId })
  } catch (error: any) {
    return Response.json(
      { error: 'Ingestion failed', details: error.message },
      { status: 500 }
    )
  }
}

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

  const docs = await ragModule.listDocuments(membership?.clinic_id)
  return Response.json({ documents: docs })
}

export async function DELETE(req: Request) {
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
  const documentId = url.searchParams.get('id')
  if (!documentId) {
    return Response.json({ error: 'Document id required' }, { status: 400 })
  }

  await ragModule.deleteDocument(documentId)
  return Response.json({ success: true })
}
