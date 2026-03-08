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

// Funções específicas exportadas dos módulos especializados
export * from './ai/symptom_analyzer';
export * from './ai/diagnosis_assistant';
export * from './ai/exam_interpreter';
export * from './ai/treatment_planner';

// Retrocompatibilidade (opcional, se houver chamadas antigas)
export { analyzeSymptoms as analyzePetSymptoms } from './ai/symptom_analyzer';
export { planTreatment as generateTreatmentPlan } from './ai/treatment_planner';
export { interpretExam as interpretExams } from './ai/exam_interpreter';
export { assistDiagnosis as suggestDifferentialDiagnosis } from './ai/diagnosis_assistant';
