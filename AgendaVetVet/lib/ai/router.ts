import { generateText } from 'ai'
import { aiGateway } from '../vet-copilot/ai-gateway'

export async function routeAIRequest(prompt: string, context?: any): Promise<string> {
  const { model } = aiGateway.selectModel(context?.model)
  const { text } = await generateText({ model, prompt })
  return text
}
