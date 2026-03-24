'use client'

import { useState } from 'react'
import { supabase } from '@/lib/data-store'

export interface AIResponse {
  sucesso: boolean
  resultado?: any
  erro?: string
}

export function useAISecretary() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const askSecretary = async (provedor: 'gemini' | 'deepseek' | 'kimi', dados: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ai_secretario', {
        body: {
          acao: 'consultar',
          provedor_ia: provedor,
          dados
        }
      })

      if (invokeError) {
        throw new Error(invokeError.message || 'Erro ao invocar função de IA')
      }

      const response = data as AIResponse
      if (!response.sucesso) {
        throw new Error(response.erro || 'Erro na resposta da IA')
      }

      return response.resultado
    } catch (err: any) {
      const msg = err.message || 'Erro ao consultar o Secretário IA'
      setError(msg)
      console.error('askSecretary error:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const memorizeCase = async (dados: any) => {
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ai_secretario', {
        body: {
          acao: 'memorizar',
          dados
        }
      })

      if (invokeError) throw invokeError
      return data
    } catch (err) {
      console.error('memorizeCase error:', err)
      // Não lançamos erro aqui para não travar o fluxo principal do usuário
    }
  }

  return {
    askSecretary,
    memorizeCase,
    isLoading,
    error
  }
}
