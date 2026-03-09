import { createOpenAI } from '@ai-sdk/openai'

// DeepSeek provider using OpenAI-compatible API
export const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  baseURL: 'https://api.deepseek.com/v1',
})
