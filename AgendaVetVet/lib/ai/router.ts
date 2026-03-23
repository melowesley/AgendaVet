import { Platform } from 'react-native'

export async function routeAIRequest(prompt: string, context?: any): Promise<string> {
    try {
        // Use the Supabase Edge Function or external API for AI processing
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, context }),
        })

        if (!response.ok) {
            throw new Error(`AI request failed: ${response.status}`)
        }

        const data = await response.json()
        return data.message || data.content || 'Sem resposta do assistente.'
    } catch (error) {
        console.warn('[AI Router] Fallback - AI service unavailable:', error)
        return 'Desculpe, o serviço de IA está temporariamente indisponível. Tente novamente em alguns instantes.'
    }
}
