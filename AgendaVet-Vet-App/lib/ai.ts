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
                               prompt.toLowerCase().includes('prescrever') ||
                               prompt.toLowerCase().includes('tratamento') ||
                               prompt.length > 500;

        if (isReasoningTask) {
          return await deepseekChat(prompt, {
            model: 'deepseek-reasoner', // R1 para tarefas médicas complexas
            temperature: options.temperature || 0.3, // Mais determinístico para medicina
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

// Funções específicas para veterinária no App Vet
export const analyzePetSymptoms = async (symptoms: string, petInfo?: string) => {
  const context = petInfo ? `Informações do pet: ${petInfo}. ` : '';
  const prompt = `Como veterinário experiente, analise os seguintes sintomas em um animal de estimação: ${context}${symptoms}. Forneça possíveis causas, gravidade e recomendações imediatas. Seja específico e considere a urgência médica.`;

  return await aiChat(prompt, {
    model: 'auto',
    temperature: 0.3,
    maxTokens: 2048
  });
};

export const generateTreatmentPlan = async (diagnosis: string, petInfo: string) => {
  const prompt = `Baseado no diagnóstico "${diagnosis}" e informações do pet: ${petInfo}, crie um plano de tratamento veterinário detalhado incluindo medicações, cuidados e acompanhamento. Considere dosagens adequadas, frequência e possíveis efeitos colaterais.`;

  return await aiChat(prompt, {
    model: 'deepseek', // Preferir DeepSeek para planejamento médico detalhado
    temperature: 0.2,
    maxTokens: 2048
  });
};

export const interpretExams = async (examResults: string, petInfo: string) => {
  const prompt = `Como veterinário, interprete os resultados de exames: ${examResults}. Informações do pet: ${petInfo}. Explique o que significa cada resultado, valores normais vs alterados, e possíveis implicações clínicas.`;

  return await aiChat(prompt, {
    model: 'deepseek',
    temperature: 0.2,
    maxTokens: 1536
  });
};

export const suggestDifferentialDiagnosis = async (symptoms: string, history: string) => {
  const prompt = `Liste diagnósticos diferenciais para os sintomas: ${symptoms}. Histórico clínico: ${history}. Ordene por probabilidade e sugira próximos passos para investigação.`;

  return await aiChat(prompt, {
    model: 'deepseek',
    temperature: 0.3,
    maxTokens: 1536
  });
};
