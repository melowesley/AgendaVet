import { aiChat } from '../ai';
import { DIAGNOSIS_ASSISTANT_PROMPT } from '../prompts/diagnosis_assistant';

export const assistDiagnosis = async (signs: string, history: string) => {
    const prompt = DIAGNOSIS_ASSISTANT_PROMPT(signs, history);

    return await aiChat(prompt, {
        model: 'deepseek', // Preferir DeepSeek para raciocínio diagnóstico
        temperature: 0.2,
        maxTokens: 1536
    });
};
