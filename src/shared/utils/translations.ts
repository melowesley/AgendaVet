/**
 * translations.ts — Utilitário centralizado de tradução PT-BR
 *
 * Centraliza todas as traduções de labels, tipos e status
 * para evitar strings duplicadas ou em inglês no frontend.
 */

/** Traduz o tipo de pet para PT-BR */
export function translatePetType(type: string | null | undefined): string {
    if (!type) return 'Desconhecido';
    const map: Record<string, string> = {
        dog: 'Cão',
        cat: 'Gato',
        bird: 'Ave',
        fish: 'Peixe',
        rabbit: 'Coelho',
        hamster: 'Hamster',
        reptile: 'Réptil',
        horse: 'Cavalo',
        other: 'Outro',
    };
    return map[type.toLowerCase()] || type;
}

/** Traduz o status do agendamento para PT-BR */
export function translateAppointmentStatus(status: string | null | undefined): string {
    if (!status) return 'Desconhecido';
    const map: Record<string, string> = {
        pending: 'Pendente',
        confirmed: 'Confirmado',
        reminder_sent: 'Lembrete Enviado',
        checked_in: 'Check-in',
        in_progress: 'Em Atendimento',
        completed: 'Concluído',
        cancelled: 'Cancelado',
        no_show: 'Não Compareceu',
    };
    return map[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

/** Traduz a role do usuário para PT-BR */
export function translateRole(role: string | null | undefined): string {
    if (!role) return 'Desconhecido';
    const map: Record<string, string> = {
        admin: 'Administrador',
        tutor: 'Tutor',
        vet: 'Veterinário',
        user: 'Usuário',
    };
    return map[role.toLowerCase()] || role;
}

/** Traduz módulos clínicos para PT-BR */
export function translateModule(module: string | null | undefined): string {
    if (!module) return 'Geral';
    const map: Record<string, string> = {
        consulta: 'Consulta',
        receita: 'Receita',
        vacina: 'Vacina',
        exame: 'Exame',
        cirurgia: 'Cirurgia',
        internacao: 'Internação',
        observacoes: 'Observações',
        retorno: 'Retorno',
        peso: 'Pesagem',
        avaliacao_cirurgica: 'Avaliação Cirúrgica',
    };
    return map[module.toLowerCase()] || module;
}

/** Texto padrão para valores ausentes (substitui 'N/A') */
export const NA_TEXT = 'N/D';
