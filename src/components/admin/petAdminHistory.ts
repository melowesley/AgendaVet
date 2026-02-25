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
    details: cleanDetails(details),    source_table: sourceTable ?? null,
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

  return true;};
