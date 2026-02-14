/**
 * petAdminHistory.ts
 *
 * Utilitário central para registrar ações administrativas na tabela
 * `pet_admin_history`.
 *
 * FLUXO:
 *  1. Cada diálogo (DocumentoDialog, VacinaDialog, ExameDialog, etc.) chama
 *     logPetAdminHistory() após salvar com sucesso em sua tabela primária.
 *  2. O registro é inserido com: pet_id, user_id, module, action, title,
 *     details (JSONB), source_table e source_id.
 *  3. O source_id é utilizado pelo usePetTimeline para deduplificar registros
 *     quando a mesma entidade existe tanto na tabela primária quanto no histórico.
 *
 * TRATAMENTO DE ERROS:
 *  - Falhas no log NÃO devem interromper o fluxo principal de salvamento.
 *  - O erro é registrado no console e retornado para que o chamador possa
 *    opcionalmente exibir um aviso ao usuário (sem bloquear a operação).
 */

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

/**
 * Remove campos vazios, nulos, traços e valores "não" de um objeto details
 * antes de salvar, para que o histórico exiba apenas informações significativas.
 */
const cleanDetails = (details: Json | undefined): Json | null => {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return details ?? null;
  }
  const EMPTY_STRINGS = new Set(['', '—', '-', 'nao', 'não', 'n/a']);
  const cleaned: Record<string, Json> = {};
  for (const [key, value] of Object.entries(details as Record<string, Json>)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && EMPTY_STRINGS.has(value.trim().toLowerCase())) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    cleaned[key] = value;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : null;
};

/**
 * Registra uma ação no histórico administrativo do pet.
 *
 * @returns `true` se o registro foi criado com sucesso, `false` em caso de falha.
 *          A falha é apenas logada no console — não lança exceção.
 */
export const logPetAdminHistory = async ({
  petId,
  module,
  action,
  title,
  details,
  sourceTable,
  sourceId,
}: LogPetAdminHistoryInput): Promise<boolean> => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    console.warn('[petAdminHistory] Usuário não autenticado — log ignorado.');
    return false;
  }

  const { error } = await supabase.from('pet_admin_history').insert({
    pet_id: petId,
    user_id: userId,
    module,
    action,
    title,
    details: cleanDetails(details),
    source_table: sourceTable ?? null,
    source_id: sourceId ?? null,
  });

  if (error) {
    // Não bloqueia o fluxo principal, mas registra o problema.
    console.error(
      `[petAdminHistory] Erro ao registrar histórico (module=${module}, action=${action}):`,
      error.message
    );
    return false;
  }

  return true;
};
