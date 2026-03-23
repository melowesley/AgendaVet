import { streamText } from 'ai'
import { aiGateway } from '@/lib/vet-copilot/ai-gateway'
import { allTools } from '@/lib/vet-copilot/tools/index'
import { promptRegistry } from '@/lib/vet-copilot/prompt-registry'
import { memoryManager } from '@/lib/vet-copilot/memory-manager'
import { contextBuilder } from '@/lib/vet-copilot/context-builder'
import { costController } from '@/lib/vet-copilot/cost-controller'
import { observability } from '@/lib/vet-copilot/observability'
import { sanitizeUserInput, validateMessages } from '@/lib/vet-copilot/security'
import { PROMPT_SLUGS } from '@/lib/vet-copilot/prompts'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('clinic_members')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return Response.json({ error: 'No clinic membership' }, { status: 403 })
    }

    const clinicId = membership.clinic_id

    const body = await req.json()
    const {
      messages: rawMessages,
      petId,
      conversationId: existingConversationId,
      model: preferredModel,
    } = body

    if (!validateMessages(rawMessages)) {
      return Response.json({ error: 'Invalid messages' }, { status: 400 })
    }

    // AI SDK v6 uses parts[], legacy uses content string — sanitize either format
    const messages = rawMessages.map((m: any) => {
      if (m.role !== 'user') return m
      if (Array.isArray(m.parts)) {
        return {
          ...m,
          parts: m.parts.map((p: any) =>
            p.type === 'text' ? { ...p, text: sanitizeUserInput(p.text ?? '') } : p
          ),
        }
      }
      return { ...m, content: sanitizeUserInput(m.content ?? '') }
    })

    const [hasQuota, withinRate] = await Promise.all([
      costController.checkQuota(clinicId),
      costController.checkRateLimit(clinicId, user.id),
    ])

    if (!hasQuota) {
      return Response.json(
        { error: 'Quota de tokens mensal excedida' },
        { status: 429 }
      )
    }
    if (!withinRate) {
      return Response.json(
        { error: 'Rate limit excedido. Aguarde um momento.' },
        { status: 429 }
      )
    }

    const modelKey =
      preferredModel || (await costController.selectModelByBudget(clinicId))
    const { model, providerName, config, fallbackFrom } =
      await aiGateway.selectModelWithRetry(modelKey)

    const conversationId =
      existingConversationId ||
      (await memoryManager.createConversation(clinicId, user.id, petId))

    const [systemPrompt, clinicalContext, previousMessages] = await Promise.all(
      [
        promptRegistry.getActivePrompt(PROMPT_SLUGS.SYSTEM, clinicId),
        petId
          ? contextBuilder.build(
              petId,
              clinicId,
              messages[messages.length - 1]?.content
            )
          : Promise.resolve(''),
        existingConversationId
          ? memoryManager.loadMessages(existingConversationId)
          : Promise.resolve([]),
      ]
    )

    const fullSystemPrompt = systemPrompt.replace(
      '{clinical_context}',
      clinicalContext || 'Nenhum paciente selecionado.'
    )

    const allMessages = [
      ...previousMessages.filter((m) => m.role !== 'system'),
      ...messages,
    ]

    const lastUserMsg = messages[messages.length - 1]
    if (lastUserMsg?.role === 'user') {
      await memoryManager.saveMessage(conversationId, clinicId, {
        role: 'user',
        content: lastUserMsg.content,
      })
    }

    const result = streamText({
      model,
      system: fullSystemPrompt,
      messages: allMessages,
      temperature: 0.3,
      tools: allTools as any,
      toolChoice: 'auto',
      onFinish: async ({ text, usage }) => {
        const latencyMs = Date.now() - startTime
        const promptTk = (usage as any)?.promptTokens ?? (usage as any)?.prompt_tokens ?? 0
        const completionTk = (usage as any)?.completionTokens ?? (usage as any)?.completion_tokens ?? 0

        await memoryManager.saveMessage(conversationId, clinicId, {
          role: 'assistant',
          content: text,
          model: providerName,
          token_count: promptTk + completionTk,
          latency_ms: latencyMs,
        })

        if (!existingConversationId && text) {
          const title =
            text.substring(0, 60).replace(/[#*\n]/g, '').trim() + '...'
          await memoryManager.updateConversationTitle(conversationId, title)
        }

        await observability.logUsage({
          clinicId,
          userId: user.id,
          conversationId,
          model: providerName,
          provider: config.provider,
          promptTokens: promptTk,
          completionTokens: completionTk,
          latencyMs,
          fallbackFrom,
        })
      },
    })

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error('[VetCopilot] API Error:', error)

    return Response.json(
      {
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed. Use POST.' }, { status: 405 })
}
