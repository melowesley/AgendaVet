import { createOpenAI } from '@ai-sdk/openai'

// Kimi/Moonshot provider usando API compatível com OpenAI
export const kimi = createOpenAI({
  apiKey: process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY || '',
  baseURL: 'https://api.moonshot.cn/v1',
})

// Modelos disponíveis do Kimi
export const KIMI_MODELS = {
  'kimi-k2': 'kimi-k2-071616',
  'kimi-k2.5': 'kimi-k2-5-071616', 
  'kimi-k1.5': 'kimi-k1-5-071616',
} as const
