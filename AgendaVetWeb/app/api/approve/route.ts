// app/api/approve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateApprovalToken, consumeApprovalToken } from '@/lib/auth/tokens'

export async function POST(request: NextRequest) {
  const { token } = await request.json()

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }

  const validation = await validateApprovalToken(token)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 400 })
  }

  await consumeApprovalToken(token, validation.data!.user_id)

  return NextResponse.json({ success: true })
}
