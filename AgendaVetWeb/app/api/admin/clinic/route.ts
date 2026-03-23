/**
 * GET  /api/admin/clinic?id=xxx  → busca prompt da clínica
 * POST /api/admin/clinic          → salva prompt { clinicId, prompt }
 */

import { requireAdmin } from '@/lib/admin'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const serviceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function GET(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const clinicId = req.nextUrl.searchParams.get('id')
  if (!clinicId) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('clinics')
    .select('id, name, settings')
    .eq('id', clinicId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({
    clinicId: data.id,
    name: data.name,
    customPrompt: (data.settings as Record<string, unknown>)?.custom_prompt ?? '',
  })
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { clinicId, prompt } = await req.json()
  if (!clinicId) return NextResponse.json({ error: 'clinicId obrigatório' }, { status: 400 })

  const supabase = serviceClient()

  // Lê settings atual para não sobrescrever outros campos
  const { data: existing } = await supabase
    .from('clinics')
    .select('settings')
    .eq('id', clinicId)
    .single()

  const currentSettings = (existing?.settings as Record<string, unknown>) || {}
  const newSettings = { ...currentSettings, custom_prompt: prompt || null }

  const { error } = await supabase
    .from('clinics')
    .update({ settings: newSettings, updated_at: new Date().toISOString() })
    .eq('id', clinicId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, clinicId, saved: true })
}
