import { createServiceSupabaseClient } from '@/lib/supabase/service'
import { VET_COPILOT_SYSTEM_PROMPT } from './system-prompt'

export const promptRegistry = {
  async getActivePrompt(slug: string, clinicId?: string): Promise<string> {
    const supabase = createServiceSupabaseClient()

    if (clinicId) {
      const { data: clinicPrompt } = await (supabase
        .from('ai_prompt_versions') as any)
        .select('content')
        .eq('slug', slug)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single()

      if (clinicPrompt) return clinicPrompt.content
    }

    const { data: globalPrompt } = await (supabase
      .from('ai_prompt_versions') as any)
      .select('content')
      .eq('slug', slug)
      .is('clinic_id', null)
      .eq('is_active', true)
      .single()

    if (globalPrompt) return globalPrompt.content

    return VET_COPILOT_SYSTEM_PROMPT
  },

  async createVersion(
    slug: string,
    content: string,
    opts?: { clinicId?: string; metadata?: Record<string, any> }
  ): Promise<void> {
    const supabase = createServiceSupabaseClient()

    const { data: latest } = await (supabase
      .from('ai_prompt_versions') as any)
      .select('version')
      .eq('slug', slug)
      .eq('clinic_id', opts?.clinicId || null)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = (latest?.version || 0) + 1

    await (supabase.from('ai_prompt_versions') as any).insert({
      slug,
      version: nextVersion,
      content,
      is_active: false,
      clinic_id: opts?.clinicId || null,
      metadata: opts?.metadata || {},
    })
  },

  async activateVersion(
    slug: string,
    version: number,
    clinicId?: string
  ): Promise<void> {
    const supabase = createServiceSupabaseClient()

    await (supabase
      .from('ai_prompt_versions') as any)
      .update({ is_active: false })
      .eq('slug', slug)
      .eq('clinic_id', clinicId || null)

    await (supabase
      .from('ai_prompt_versions') as any)
      .update({ is_active: true })
      .eq('slug', slug)
      .eq('version', version)
      .eq('clinic_id', clinicId || null)
  },
}
