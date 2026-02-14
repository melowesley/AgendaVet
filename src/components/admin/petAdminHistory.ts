import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface LogPetAdminHistoryInput {
  petId: string;
  module: string;
  action: string;
  title: string;
  details?: Json;
  sourceTable?: string;
  sourceId?: string;
}

export const logPetAdminHistory = async ({
  petId,
  module,
  action,
  title,
  details,
  sourceTable,
  sourceId,
}: LogPetAdminHistoryInput) => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  const { error } = await supabase.from('pet_admin_history').insert({
    pet_id: petId,
    user_id: userId,
    module,
    action,
    title,
    details: details ?? null,
    source_table: sourceTable ?? null,
    source_id: sourceId ?? null,
  });

  if (error) {
    // Histórico não pode quebrar o fluxo principal de salvamento.
    console.error('Erro ao registrar histórico administrativo:', error.message);
  }
};
