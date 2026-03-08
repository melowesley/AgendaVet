import { createServiceSupabaseClient } from '@/lib/supabase/service'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import type { ConversationMessage } from './types'

const MAX_CONTEXT_TOKENS = 4000

export const memoryManager = {
  async createConversation(
    clinicId: string,
    userId: string,
    petId?: string
  ): Promise<string> {
    const supabase = createServiceSupabaseClient()
    const { data } = await (supabase
      .from('ai_conversations') as any)
      .insert({
        clinic_id: clinicId,
        user_id: userId,
        pet_id: petId || null,
      })
      .select('id')
      .single()

    if (!data) throw new Error('Failed to create conversation')
    return data.id
  },

  async loadMessages(
    conversationId: string,
    opts: { maxTokens?: number } = {}
  ): Promise<Array<{ role: string; content: string }>> {
    const supabase = createServiceSupabaseClient()
    const maxTokens = opts.maxTokens || MAX_CONTEXT_TOKENS

    const { data: allMessages } = await (supabase
      .from('ai_messages') as any)
      .select('role, content, token_count, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!allMessages?.length) return []

    if (allMessages.length <= 10) {
      return allMessages.map((m: any) => ({ role: m.role, content: m.content }))
    }

    let tokenBudget = maxTokens
    const recentMessages: any[] = []

    for (let i = allMessages.length - 1; i >= 0; i--) {
      const tokens =
        allMessages[i].token_count || estimateTokens(allMessages[i].content)
      if (tokenBudget - tokens < 500) break
      recentMessages.unshift(allMessages[i])
      tokenBudget -= tokens
    }

    const excludedCount = allMessages.length - recentMessages.length
    if (excludedCount > 0) {
      const excludedMessages = allMessages.slice(0, excludedCount)
      const summary = await this.summarizeMessages(excludedMessages)
      return [
        {
          role: 'system',
          content: `[Resumo de ${excludedCount} mensagens anteriores]: ${summary}`,
        },
        ...recentMessages.map((m: any) => ({ role: m.role, content: m.content })),
      ]
    }

    return recentMessages.map((m: any) => ({ role: m.role, content: m.content }))
  },

  async summarizeMessages(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    const text = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')

    try {
      const { text: summary } = await generateText({
        model: google('gemini-2.0-flash'),
        system:
          'Resuma esta conversa clinica veterinaria em 3-5 frases, mantendo informacoes clinicas relevantes (diagnosticos, medicacoes, decisoes). Responda em portugues.',
        prompt: text.substring(0, 3000),
        maxOutputTokens: 300,
      } as any)
      return summary
    } catch {
      return messages
        .slice(-3)
        .map((m) => `${m.role}: ${m.content.substring(0, 100)}`)
        .join(' | ')
    }
  },

  async saveMessage(
    conversationId: string,
    clinicId: string,
    msg: ConversationMessage
  ): Promise<void> {
    const supabase = createServiceSupabaseClient()
    await (supabase.from('ai_messages') as any).insert({
      conversation_id: conversationId,
      clinic_id: clinicId,
      role: msg.role,
      content: msg.content,
      model: msg.model || null,
      token_count: msg.token_count || estimateTokens(msg.content),
      latency_ms: msg.latency_ms || null,
      tool_calls: msg.tool_calls || null,
      clinical_action: msg.clinical_action || null,
    })
  },

  async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<void> {
    const supabase = createServiceSupabaseClient()
    await (supabase
      .from('ai_conversations') as any)
      .update({ title })
      .eq('id', conversationId)
  },
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
