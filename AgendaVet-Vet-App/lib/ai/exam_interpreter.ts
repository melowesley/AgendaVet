import { aiChat } from '../ai';
import { BASE_PROMPT_TEMPLATE } from '../prompts/veterinary_prompts';

export const interpretExam = async (examData: string) => {
    const prompt = BASE_PROMPT_TEMPLATE(
        "Interprete os seguintes resultados de exame laboratorial ou de imagem. Identifique alterações, possíveis causas e sugira explorações adicionais.",
        examData
    );

    return await aiChat(prompt, {
        model: 'auto',
        temperature: 0.1, // Mais técnico e determinístico
        maxTokens: 2048
    });
};
