import { deepseekChat } from './deepseek';
import { geminiChat } from './gemini';

export type AIModel = 'deepseek' | 'gemini' | 'auto';

export interface AIChatOptions {
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
}

export const aiChat = async (prompt: string, options: AIChatOptions = {}) => {
  const { model = 'auto' } = options;

  try {
    switch (model) {
      case 'deepseek':
        return await deepseekChat(prompt, {
          model: 'deepseek-chat',
          temperature: options.temperature,
          maxTokens: options.maxTokens
        });

      case 'gemini':
        return await geminiChat(prompt, {
          temperature: options.temperature,
          maxTokens: options.maxTokens
        });

      case 'auto':
      default:
        // Estratégia: usar Gemini para respostas rápidas e econômicas
        // DeepSeek para tarefas que precisam de raciocínio avançado
        const isReasoningTask = prompt.toLowerCase().includes('analisar') ||
                               prompt.toLowerCase().includes('diagnosticar') ||
                               prompt.toLowerCase().includes('explicar') ||
                               prompt.length > 500;

        if (isReasoningTask) {
          return await deepseekChat(prompt, {
            model: 'deepseek-reasoner', // R1 para tarefas complexas
            temperature: options.temperature || 0.3, // Mais determinístico
            maxTokens: options.maxTokens
          });
        } else {
          return await geminiChat(prompt, {
            temperature: options.temperature,
            maxTokens: options.maxTokens
          });
        }
    }
  } catch (error) {
    console.error('AI Chat error:', error);

    // Fallback: tentar com a outra API se uma falhar
    try {
      if (model === 'deepseek') {
        return await geminiChat(prompt, options);
      } else {
        return await deepseekChat(prompt, {
          model: 'deepseek-chat',
          temperature: options.temperature,
          maxTokens: options.maxTokens
        });
      }
    } catch (fallbackError) {
      console.error('Fallback AI also failed:', fallbackError);
      throw new Error('Todas as APIs de IA estão indisponíveis no momento');
    }
  }
};

// Funções específicas para veterinária
export const analyzePetSymptoms = async (symptoms: string) => {
  const prompt = `Como veterinário experiente, analise os seguintes sintomas em um animal de estimação: ${symptoms}. Forneça possíveis causas, gravidade e recomendações imediatas.`;

  return await aiChat(prompt, {
    model: 'auto', // Usará DeepSeek R1 para análise complexa
    temperature: 0.3,
    maxTokens: 2048
  });
};

export const generateTreatmentPlan = async (diagnosis: string, petInfo: string) => {
  const prompt = `Baseado no diagnóstico "${diagnosis}" e informações do pet: ${petInfo}, crie um plano de tratamento veterinário detalhado incluindo medicações, cuidados e acompanhamento.`;

  return await aiChat(prompt, {
    model: 'deepseek', // Preferir DeepSeek para planejamento médico
    temperature: 0.2,
    maxTokens: 1536
  });
};
