import { supabase } from '../supabase';

export const submitAIFeedback = async (responseId: string, rating: 1 | -1, comment?: string) => {
    try {
        const { error } = await supabase
            .from('ai_feedback')
            .insert([{
                response_id: responseId,
                rating,
                comment,
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error submitting AI feedback:', error);
        return false;
    }
};
