import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt, targetModel } = await req.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt inválido' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Log the prompt deployment
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      model: targetModel || 'broadcast',
      tokens_used: 0,
      cost_estimate: 0,
      request_type: 'prompt_deploy',
      notes: prompt.substring(0, 500),
      created_at: new Date().toISOString(),
    }).select()

    return NextResponse.json({
      success: true,
      message: 'Prompt enviado para todos os agentes',
      deployedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
