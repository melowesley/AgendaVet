import { supabase } from '../supabase';

export interface APILog {
    model: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    latencyMs: number;
    status: 'success' | 'error';
    errorMessage?: string;
    timestamp: string;
}

export const logAPIUsage = async (log: APILog) => {
    try {
        const { error } = await supabase
            .from('ai_usage_logs')
            .insert([log]);

        if (error) throw error;
    } catch (error) {
        console.error('Failed to log AI usage:', error);
        // Não travar a execução se o log falhar
    }
};
