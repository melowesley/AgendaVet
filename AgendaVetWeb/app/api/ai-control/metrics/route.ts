import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Try to fetch real metrics from ai_usage_logs
    const today = new Date().toISOString().split('T')[0]
    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select('tokens_used, cost_estimate, model, user_id, created_at')
      .gte('created_at', `${today}T00:00:00`)

    if (error || !logs) {
      // Return mock data if table doesn't exist or query fails
      return NextResponse.json({
        totalAgents: 0,
        activeAgents: 0,
        tokensToday: 0,
        estimatedCost: 0,
        source: 'mock',
      })
    }

    const tokensToday = logs.reduce((sum, l) => sum + (l.tokens_used || 0), 0)
    const estimatedCost = logs.reduce((sum, l) => sum + (l.cost_estimate || 0), 0)
    const uniqueUsers = new Set(logs.map((l) => l.user_id)).size

    return NextResponse.json({
      totalAgents: uniqueUsers,
      activeAgents: uniqueUsers,
      tokensToday,
      estimatedCost: parseFloat(estimatedCost.toFixed(4)),
      source: 'live',
    })
  } catch {
    return NextResponse.json({
      totalAgents: 0,
      activeAgents: 0,
      tokensToday: 0,
      estimatedCost: 0,
      source: 'error',
    })
  }
}
