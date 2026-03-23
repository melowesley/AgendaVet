import { requireAdmin } from '@/lib/admin'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const serviceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  const supabase = serviceClient()

  // Busca todas as clínicas
  const { data: clinics, error: clinicsError } = await supabase
    .from('clinics')
    .select('id, name, slug, plan, settings, created_at')
    .order('created_at', { ascending: false })

  if (clinicsError) {
    return NextResponse.json({ error: clinicsError.message }, { status: 500 })
  }

  // Busca membros de cada clínica (usuários)
  const { data: members } = await supabase
    .from('clinic_members')
    .select('clinic_id, user_id, role')

  // Busca uso de tokens hoje por clínica (via ai_usage_logs se disponível)
  const today = new Date().toISOString().split('T')[0]
  const { data: logs } = await supabase
    .from('ai_usage_logs')
    .select('user_id, tokens_used, cost_estimate, created_at')
    .gte('created_at', `${today}T00:00:00`)

  // Monta mapa user_id → clinic_id
  const userToClinic = new Map<string, string>()
  for (const m of members || []) {
    userToClinic.set(m.user_id, m.clinic_id)
  }

  // Agrega tokens/custo por clínica
  const clinicTokens = new Map<string, { tokens: number; cost: number }>()
  for (const log of logs || []) {
    const clinicId = userToClinic.get(log.user_id)
    if (!clinicId) continue
    const existing = clinicTokens.get(clinicId) || { tokens: 0, cost: 0 }
    existing.tokens += log.tokens_used || 0
    existing.cost += log.cost_estimate || 0
    clinicTokens.set(clinicId, existing)
  }

  const result = (clinics || []).map((clinic) => ({
    id: clinic.id,
    name: clinic.name,
    slug: clinic.slug,
    plan: clinic.plan,
    customPrompt: (clinic.settings as Record<string, unknown>)?.custom_prompt ?? null,
    membersCount: (members || []).filter((m) => m.clinic_id === clinic.id).length,
    tokensToday: clinicTokens.get(clinic.id)?.tokens ?? 0,
    costToday: parseFloat((clinicTokens.get(clinic.id)?.cost ?? 0).toFixed(4)),
    createdAt: clinic.created_at,
  }))

  return NextResponse.json({ clients: result })
}
