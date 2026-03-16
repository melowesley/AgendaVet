import { google } from '@ai-sdk/google'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import type { ModelConfig, ProviderName } from './types'

// DeepSeek provider (OpenAI-compatible) — baseURL must include /v1
const deepseekProvider = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  baseURL: 'https://api.deepseek.com/v1',
})

export const MODEL_CATALOG: Record<string, ModelConfig> = {
  'gemini-2.0-flash': {
    provider: 'google',
    modelId: 'gemini-2.0-flash',
    inputCostPer1k: 0.000075,
    outputCostPer1k: 0.0003,
    maxTokens: 1048576,
    tier: 'standard',
  },
  'gemini-1.5-pro': {
    provider: 'google',
    modelId: 'gemini-1.5-pro',
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.005,
    maxTokens: 2097152,
    tier: 'premium',
  },
  'gpt-4o': {
    provider: 'openai',
    modelId: 'gpt-4o',
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01,
    maxTokens: 128000,
    tier: 'premium',
  },
  'gpt-4o-mini': {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
    maxTokens: 128000,
    tier: 'economy',
  },
  'claude-sonnet': {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    maxTokens: 200000,
    tier: 'premium',
  },
  'deepseek-chat': {
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    inputCostPer1k: 0.00014,
    outputCostPer1k: 0.00028,
    maxTokens: 65536,
    tier: 'standard',
  },
}

const MODEL_EQUIVALENTS: Record<string, string[]> = {
  'gemini-1.5-pro': ['gpt-4o', 'claude-sonnet', 'deepseek-chat'],
  'gemini-2.0-flash': ['gpt-4o-mini', 'deepseek-chat'],
  'gpt-4o': ['gemini-1.5-pro', 'claude-sonnet'],
  'gpt-4o-mini': ['gemini-2.0-flash', 'deepseek-chat'],
  'claude-sonnet': ['gemini-1.5-pro', 'gpt-4o'],
  'deepseek-chat': ['gemini-2.0-flash', 'gpt-4o-mini'],
}

function createProviderInstance(config: ModelConfig) {
  switch (config.provider) {
    case 'google':
      return google(config.modelId)
    case 'openai':
      return openai(config.modelId)
    case 'anthropic':
      return anthropic(config.modelId)
    case 'deepseek':
      return deepseekProvider(config.modelId)
    default:
      throw new Error(`Provider ${config.provider} not supported`)
  }
}

export const aiGateway = {
  selectModel(preferredModel?: string) {
    const modelKey = preferredModel || 'gemini-2.0-flash'
    const config = MODEL_CATALOG[modelKey]

    if (!config) {
      const fallbackConfig = MODEL_CATALOG['gemini-2.0-flash']
      return {
        model: createProviderInstance(fallbackConfig),
        providerName: 'gemini-2.0-flash',
        config: fallbackConfig,
      }
    }

    try {
      const model = createProviderInstance(config)
      return { model, providerName: modelKey, config }
    } catch {
      const equivalents = MODEL_EQUIVALENTS[modelKey] || []
      for (const eqKey of equivalents) {
        try {
          const eqConfig = MODEL_CATALOG[eqKey]
          const model = createProviderInstance(eqConfig)
          console.warn(`[AI Gateway] Fallback: ${modelKey} -> ${eqKey}`)
          return {
            model,
            providerName: eqKey,
            config: eqConfig,
            fallbackFrom: modelKey,
          }
        } catch {
          continue
        }
      }
      throw new Error('All AI providers unavailable')
    }
  },

  async selectModelWithRetry(preferredModel?: string, maxRetries = 2) {
    const modelKey = preferredModel || 'gemini-2.0-flash'
    const equivalents = [modelKey, ...(MODEL_EQUIVALENTS[modelKey] || [])]

    for (let i = 0; i < Math.min(equivalents.length, maxRetries + 1); i++) {
      try {
        const config = MODEL_CATALOG[equivalents[i]]
        if (!config) continue
        const model = createProviderInstance(config)
        return {
          model,
          providerName: equivalents[i],
          config,
          fallbackFrom: i > 0 ? modelKey : undefined,
        }
      } catch (error: any) {
        if (error?.status === 429 && i < equivalents.length - 1) {
          await new Promise((r) => setTimeout(r, 2000 * (i + 1)))
          continue
        }
        if (i === equivalents.length - 1) throw error
      }
    }
    throw new Error('All providers exhausted')
  },

  getProviderName(modelKey: string): ProviderName {
    return MODEL_CATALOG[modelKey]?.provider || 'google'
  },

  getModelConfig(modelKey: string): ModelConfig | undefined {
    return MODEL_CATALOG[modelKey]
  },
}
