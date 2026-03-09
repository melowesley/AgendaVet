import { aiChat } from '../ai';
import { SYMPTOM_ANALYSIS_PROMPT } from '../prompts/symptom_analysis';

export const analyzeSymptoms = async (symptoms: string) => {
    const prompt = SYMPTOM_ANALYSIS_PROMPT(symptoms);

    return await aiChat(prompt, {
        model: 'auto',
        temperature: 0.3,
        maxTokens: 2048
    });
};
