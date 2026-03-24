import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceSupabaseClient } from '@/lib/supabase/service'
import { createApprovalToken } from '@/lib/auth/tokens'
import { sendApprovalEmail } from '@/lib/auth/email'

export async function POST(request: NextRequest) {
  // Verify the request comes from the authenticated user themselves
  const sessionClient = await createServerSupabaseClient()
  const { data: { session } } = await sessionClient.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  // Ensure userId matches the authenticated session
  if (userId !== session.user.id) {
    return NextResponse.json({ error: 'Operação não permitida' }, { status: 403 })
  }

  const service = createServiceSupabaseClient()

  const { data: role } = await service
    .from('user_roles')
    .select('role, status')
    .eq('user_id', userId)
    .single()

  if (!role || role.role !== 'vet' || role.status !== 'pending') {
    return NextResponse.json({ error: 'Operação não permitida' }, { status: 403 })
  }

  const { data: authUser } = await service.auth.admin.getUserById(userId)
  const { data: profile } = await service.from('profiles').select('full_name').eq('user_id', userId).single()

  const token = await createApprovalToken(userId)

  await sendApprovalEmail({
    ownerEmail: process.env.OWNER_EMAIL!,
    secretarioNome: profile?.full_name ?? 'Secretário',
    secretarioEmail: authUser.user?.email ?? '',
    approvalToken: token,
    appUrl: process.env.NEXT_PUBLIC_APP_URL!,
  })

  return NextResponse.json({ success: true })
}
