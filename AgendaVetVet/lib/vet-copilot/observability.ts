import { createServiceSupabaseClient } from '../../../supabase/service'
import { costController } from './cost-controller'
import type { UsageEvent } from './types'

export const observability = {
  async logUsage(event: UsageEvent): Promise<void> {
    try {
      const supabase = createServiceSupabaseClient()
      const cost = costController.estimateCost(
        event.model,
        event.promptTokens,
        event.completionTokens
      )

      await (supabase.from('ai_usage_logs') as any).insert({
        clinic_id: event.clinicId,
        user_id: event.userId,
        conversation_id: event.conversationId || null,
        model: event.model,
        provider: event.provider,
        prompt_tokens: event.promptTokens,
        completion_tokens: event.completionTokens,
        total_tokens: event.promptTokens + event.completionTokens,
        cost_usd: cost,
        latency_ms: event.latencyMs,
        fallback_from: event.fallbackFrom || null,
        error: event.error ? event.error : null,
      })

      console.log(
        JSON.stringify({
          type: 'ai_usage',
          clinic_id: event.clinicId,
          model: event.model,
          tokens: event.promptTokens + event.completionTokens,
          cost_usd: cost,
          latency_ms: event.latencyMs,
          fallback: event.fallbackFrom || null,
          tools: event.toolsUsed || [],
          clinical_action: event.clinicalAction || null,
          timestamp: new Date().toISOString(),
        })
      )
    } catch (error) {
      console.error('[Observability] Failed to log usage:', error)
    }
  },

  async logClinicalAudit(params: {
    clinicId: string
    userId: string
    action: string
    petId: string
    details: any
  }): Promise<void> {
    console.log(
      JSON.stringify({
        type: 'clinical_audit',
        ...params,
        timestamp: new Date().toISOString(),
      })
    )
  },

  async getUsageReport(
    clinicId: string,
    period: 'day' | 'week' | 'month'
  ) {
    const supabase = createServiceSupabaseClient()
    const since = new Date()
    if (period === 'day') since.setDate(since.getDate() - 1)
    if (period === 'week') since.setDate(since.getDate() - 7)
    if (period === 'month') since.setMonth(since.getMonth() - 1)

    const { data } = await (supabase
      .from('ai_usage_logs') as any)
      .select('model, total_tokens, cost_usd, latency_ms, created_at')
      .eq('clinic_id', clinicId)
      .gte('created_at', since.toISOString())

    const items: any[] = data || []

    return {
      totalRequests: items.length,
      totalTokens: items.reduce((s: number, d: any) => s + (d.total_tokens || 0), 0),
      totalCost: items.reduce(
        (s: number, d: any) => s + parseFloat(d.cost_usd || '0'),
        0
      ),
      avgLatency: items.length
        ? items.reduce((s: number, d: any) => s + (d.latency_ms || 0), 0) / items.length
        : 0,
      byModel: groupBy(items, 'model'),
    }
  },
}

function groupBy(
  arr: any[],
  key: string
): Record<string, { count: number; tokens: number; cost: number }> {
  return arr.reduce((acc, item) => {
    const k = item[key]
    acc[k] = acc[k] || { count: 0, tokens: 0, cost: 0 }
    acc[k].count++
    acc[k].tokens += item.total_tokens || 0
    acc[k].cost += parseFloat(item.cost_usd || '0')
    return acc
  }, {})
}
