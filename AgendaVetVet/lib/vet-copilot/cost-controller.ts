import { createServiceSupabaseClient } from '../supabase/service'
import type { ClinicPlan, PlanQuota } from './types'
import { MODEL_CATALOG } from './ai-gateway'

const PLAN_QUOTAS: Record<ClinicPlan, PlanQuota> = {
  basic: {
    tokensPerMonth: 500_000,
    conversationsPerMonth: 100,
    ragDocuments: 10,
    allowedModels: ['gemini-2.0-flash'],
    requestsPerMinute: 10,
  },
  pro: {
    tokensPerMonth: 5_000_000,
    conversationsPerMonth: 1000,
    ragDocuments: 100,
    allowedModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gpt-4o-mini'],
    requestsPerMinute: 30,
  },
  enterprise: {
    tokensPerMonth: 50_000_000,
    conversationsPerMonth: -1,
    ragDocuments: -1,
    allowedModels: [
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gpt-4o',
      'gpt-4o-mini',
      'claude-sonnet',
    ],
    requestsPerMinute: 100,
  },
}

export const costController = {
  async checkQuota(clinicId: string): Promise<boolean> {
    const supabase = createServiceSupabaseClient()

    const { data: clinic } = await (supabase
      .from('clinics') as any)
      .select('plan')
      .eq('id', clinicId)
      .single()

    const plan =
      PLAN_QUOTAS[(clinic?.plan as ClinicPlan) || 'basic']

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: usage } = await (supabase
      .from('ai_usage_logs') as any)
      .select('total_tokens')
      .eq('clinic_id', clinicId)
      .gte('created_at', startOfMonth.toISOString())

    const totalUsed = (usage || []).reduce(
      (sum: number, u: any) => sum + (u.total_tokens || 0),
      0
    )

    return totalUsed < plan.tokensPerMonth
  },

  async checkRateLimit(clinicId: string, userId: string): Promise<boolean> {
    const supabase = createServiceSupabaseClient()
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { count } = await (supabase
      .from('ai_usage_logs') as any)
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('user_id', userId)
      .gte('created_at', fiveMinAgo)

    return (count || 0) < 20
  },

  async selectModelByBudget(clinicId: string): Promise<string> {
    const supabase = createServiceSupabaseClient()
    const { data: clinic } = await (supabase
      .from('clinics') as any)
      .select('plan')
      .eq('id', clinicId)
      .single()

    const plan = (clinic?.plan as ClinicPlan) || 'basic'

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: usage } = await (supabase
      .from('ai_usage_logs') as any)
      .select('total_tokens')
      .eq('clinic_id', clinicId)
      .gte('created_at', startOfMonth.toISOString())

    const totalUsed = (usage || []).reduce(
      (sum: number, u: any) => sum + (u.total_tokens || 0),
      0
    )
    const quota = PLAN_QUOTAS[plan]?.tokensPerMonth || 500_000
    const usagePercent = totalUsed / quota

    if (usagePercent > 0.8) return 'gemini-2.0-flash'
    if (plan === 'enterprise') return 'gemini-1.5-pro'
    if (plan === 'pro') return 'gemini-2.0-flash'
    return 'gemini-2.0-flash'
  },

  estimateCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    const config = MODEL_CATALOG[model] || MODEL_CATALOG['gemini-2.0-flash']
    return (
      (promptTokens / 1000) * config.inputCostPer1k +
      (completionTokens / 1000) * config.outputCostPer1k
    )
  },

  getQuota(plan: ClinicPlan): PlanQuota {
    return PLAN_QUOTAS[plan] || PLAN_QUOTAS.basic
  },
}
