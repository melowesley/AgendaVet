import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const today = new Date().toISOString().split('T')[0]
    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select('user_id, tokens_used, model, created_at')
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false })

    if (error || !logs || logs.length === 0) {
      return NextResponse.json({ agents: [], source: 'empty' })
    }

    // Aggregate by user_id
    const agentMap = new Map<string, { tokensToday: number; model: string; lastSeen: string }>()
    for (const log of logs) {
      const existing = agentMap.get(log.user_id)
      if (existing) {
        existing.tokensToday += log.tokens_used || 0
      } else {
        agentMap.set(log.user_id, {
          tokensToday: log.tokens_used || 0,
          model: log.model || 'unknown',
          lastSeen: log.created_at,
        })
      }
    }

    const agents = Array.from(agentMap.entries()).map(([userId, data]) => ({
      id: userId,
      userId,
      status: 'online' as const,
      tokensToday: data.tokensToday,
      model: data.model,
      lastSeen: data.lastSeen,
    }))

    return NextResponse.json({ agents, source: 'live' })
  } catch {
    return NextResponse.json({ agents: [], source: 'error' })
  }
}
