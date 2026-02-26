import { AppointmentStatus, APPOINTMENT_STATUS } from '@/types/appointment';

/**
 * Define as transições de status permitidas no fluxo clínico do AgendaVet.
 */
const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
    [APPOINTMENT_STATUS.PENDING]: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.CANCELLED],
    [APPOINTMENT_STATUS.CONFIRMED]: [
        APPOINTMENT_STATUS.REMINDER_SENT,
        APPOINTMENT_STATUS.CHECKED_IN,
        APPOINTMENT_STATUS.CANCELLED,
        APPOINTMENT_STATUS.NO_SHOW,
    ],
    [APPOINTMENT_STATUS.REMINDER_SENT]: [
        APPOINTMENT_STATUS.CHECKED_IN,
        APPOINTMENT_STATUS.CANCELLED,
        APPOINTMENT_STATUS.NO_SHOW,
    ],
    [APPOINTMENT_STATUS.CHECKED_IN]: [APPOINTMENT_STATUS.IN_PROGRESS, APPOINTMENT_STATUS.CANCELLED],
    [APPOINTMENT_STATUS.IN_PROGRESS]: [APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED],
    [APPOINTMENT_STATUS.COMPLETED]: [APPOINTMENT_STATUS.RETURN_SCHEDULED],
    [APPOINTMENT_STATUS.RETURN_SCHEDULED]: [], // Estado final para este agendamento específico
    [APPOINTMENT_STATUS.CANCELLED]: [],         // Estado terminal
    [APPOINTMENT_STATUS.NO_SHOW]: [],           // Estado terminal
};

/**
 * Verifica se uma transição de status é válida.
 */
export const isValidTransition = (currentStatus: AppointmentStatus, nextStatus: AppointmentStatus): boolean => {
    const allowed = STATUS_TRANSITIONS[currentStatus];
    return allowed.includes(nextStatus);
};

/**
 * Retorna as próximas ações possíveis para um determinado status.
 */
export const getNextPossibleActions = (currentStatus: AppointmentStatus): AppointmentStatus[] => {
    return STATUS_TRANSITIONS[currentStatus];
};

/**
 * Helper para tradução/label de botões de ação baseados no status.
 */
export const getActionLabel = (status: AppointmentStatus): string => {
    switch (status) {
        case APPOINTMENT_STATUS.CONFIRMED: return 'Confirmar Agendamento';
        case APPOINTMENT_STATUS.REMINDER_SENT: return 'Enviar Lembrete';
        case APPOINTMENT_STATUS.CHECKED_IN: return 'Registrar Check-in';
        case APPOINTMENT_STATUS.IN_PROGRESS: return 'Iniciar Atendimento';
        case APPOINTMENT_STATUS.COMPLETED: return 'Concluir Atendimento';
        case APPOINTMENT_STATUS.RETURN_SCHEDULED: return 'Agendar Retorno';
        case APPOINTMENT_STATUS.CANCELLED: return 'Cancelar';
        case APPOINTMENT_STATUS.NO_SHOW: return 'Marcar como Não Compareceu';
        default: return status;
    }
};
