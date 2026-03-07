import { supabase } from '@/core/integrations/supabase/client';

export interface WeightRecordInput {
  petId: string;
  weight: number;
  date: string;
  notes?: string;
  organizationId?: string;
}

export interface ExamRecordInput {
  petId: string;
  examType: string;
  examDate: string;
  results?: string;
  veterinarian?: string;
}

/**
 * Pet Data Service
 * 
 * Camada unificada para Web App e Vet App interagirem com os registros diretos do Pet.
 * Graças as triggers de banco (TRIGGERS_HISTORICO), não é mais necessário registrar o log
 * na tabela `pet_admin_history` manualmente aqui. O Banco faz isso por nós.
 */
export const PetDataService = {

  // ---- PESOS ---- //
  async createWeight(data: WeightRecordInput) {
    const { data: userData } = await supabase.auth.getUser();
    return supabase.from('pet_weight_records').insert({
      pet_id: data.petId,
      user_id: userData.user?.id,
      weight: data.weight,
      date: data.date,
      notes: data.notes || null,
      organization_id: data.organizationId || null
    }).select().single();
  },

  async updateWeight(id: string, data: Partial<WeightRecordInput>) {
    return supabase.from('pet_weight_records').update({
      weight: data.weight,
      date: data.date,
      notes: data.notes || null,
    }).eq('id', id).select().single();
  },

  async deleteWeight(id: string) {
    return supabase.from('pet_weight_records').delete().eq('id', id);
  },

  async getWeights(petId: string) {
    return supabase
      .from('pet_weight_records')
      .select('*')
      .eq('pet_id', petId)
      .order('date', { ascending: false });
  },

  // ---- EXAMES ---- //
  async createExam(data: ExamRecordInput) {
    const { data: userData } = await supabase.auth.getUser();
    return supabase.from('pet_exams').insert({
      pet_id: data.petId,
      user_id: userData.user?.id,
      exam_type: data.examType,
      exam_date: data.examDate,
      results: data.results || null,
      veterinarian: data.veterinarian || null,
    }).select().single();
  },

  // Você pode expandir este serviço para Vacinas, Patologias, Observações, Receitas, etc.
  // Utilizando o mesmo padrão CRUD.
};
