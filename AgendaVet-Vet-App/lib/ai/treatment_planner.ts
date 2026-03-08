import { aiChat } from '../ai';
import { TREATMENT_PLANNER_PROMPT } from '../prompts/treatment_planner';

export const planTreatment = async (diagnosis: string, patientInfo: string) => {
    const prompt = TREATMENT_PLANNER_PROMPT(diagnosis, patientInfo);

    return await aiChat(prompt, {
        model: 'deepseek',
        temperature: 0.3,
        maxTokens: 1536
    });
};
