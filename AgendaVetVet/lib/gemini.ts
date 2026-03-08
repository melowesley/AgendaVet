import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1024,
  }
});

export const geminiChat = async (prompt: string, options?: {
  temperature?: number;
  maxTokens?: number;
}) => {
  try {
    if (options) {
      model.generationConfig = {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 1024,
      };
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Falha na comunicação com Gemini API');
  }
};
