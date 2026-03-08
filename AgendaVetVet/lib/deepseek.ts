import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

export const deepseekChat = async (prompt: string, options?: {
  model?: 'deepseek-chat' | 'deepseek-reasoner';
  temperature?: number;
  maxTokens?: number;
}) => {
  try {
    const response = await deepseek.chat.completions.create({
      model: options?.model || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 1024,
      stream: false
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw new Error('Falha na comunicação com DeepSeek API');
  }
};
