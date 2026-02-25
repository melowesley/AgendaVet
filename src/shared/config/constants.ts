/**
 * constants.ts
 *
 * Fonte única de verdade para todas as configurações da clínica.
 * Antes, valores como horário de funcionamento e buffer estavam
 * hardcoded em múltiplos arquivos (scheduleOptimizer, CalendarView, etc.).
 *
 * Ao centralizar aqui, uma única mudança reflete em todo o sistema.
 */

// ─── Horário de funcionamento ─────────────────────────────────────────────────

export const CLINIC_HOURS = {
  /** Abertura da clínica (HH:mm) */
  OPEN: '08:00',
  /** Encerramento da clínica (HH:mm) */
  CLOSE: '18:00',
  /** Início do intervalo de almoço (HH:mm) */
  LUNCH_START: '12:00',
  /** Fim do intervalo de almoço (HH:mm) */
  LUNCH_END: '13:00',
} as const;

// ─── Regras de agendamento ────────────────────────────────────────────────────

export const SCHEDULING_RULES = {
  /** Buffer obrigatório entre atendimentos (minutos) */
  BUFFER_MINUTES: 15,
  /** Lacuna máxima tolerada entre atendimentos antes de penalizar (minutos) */
  MAX_GAP_MINUTES: 120,
  /** Granularidade dos slots gerados pelo optimizer (minutos) */
  SLOT_INTERVAL_MINUTES: 15,
  /** Duração padrão quando o serviço não tem duração definida (minutos) */
  DEFAULT_SERVICE_DURATION_MINUTES: 30,
  /** Com quantas horas de antecedência enviar o lembrete */
  REMINDER_HOURS_BEFORE: 24,
} as const;

// ─── Status do agendamento ────────────────────────────────────────────────────

/**
 * AppointmentStatus — enum como objeto imutável.
 *
 * Uso: `AppointmentStatus.CONFIRMED` em vez de strings soltas,
 * evitando typos e facilitando refatoração.
 *
 * Os valores correspondem às strings aceitas pela coluna `status`
 * na tabela `appointment_requests` do Supabase.
 */
export const AppointmentStatus = {
  /** Aguardando confirmação do admin */
  PENDING: 'pending',
  /** Confirmado pelo admin, data/hora definidos */
  CONFIRMED: 'confirmed',
  /** Lembrete de 24h enviado ao cliente */
  REMINDER_SENT: 'reminder_sent',
  /** Cliente realizou check-in na clínica */
  CHECKED_IN: 'checked_in',
  /** Atendimento iniciado pelo veterinário */
  IN_PROGRESS: 'in_progress',
  /** Atendimento concluído e histórico registrado */
  COMPLETED: 'completed',
  /** Retorno agendado após conclusão (cria novo PENDING) */
  RETURN_SCHEDULED: 'return_scheduled',
  /** Cancelado em qualquer etapa */
  CANCELLED: 'cancelled',
  /** Cliente não compareceu */
  NO_SHOW: 'no_show',
} as const;

export type AppointmentStatusValue = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

/**
 * Transições de status permitidas pela máquina de estados.
 *
 * Regra: antes de atualizar o status no banco, validar contra ALLOWED_TRANSITIONS.
 */
export const ALLOWED_TRANSITIONS: Record<AppointmentStatusValue, AppointmentStatusValue[]> = {
  [AppointmentStatus.PENDING]:          [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.CONFIRMED]:        [AppointmentStatus.REMINDER_SENT, AppointmentStatus.CHECKED_IN, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  [AppointmentStatus.REMINDER_SENT]:    [AppointmentStatus.CHECKED_IN, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  [AppointmentStatus.CHECKED_IN]:       [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED],
  [AppointmentStatus.IN_PROGRESS]:      [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.COMPLETED]:        [AppointmentStatus.RETURN_SCHEDULED],
  [AppointmentStatus.RETURN_SCHEDULED]: [],
  [AppointmentStatus.CANCELLED]:        [],
  [AppointmentStatus.NO_SHOW]:          [],
};

/** Status que indicam que o agendamento ainda está ativo (não terminal) */
export const ACTIVE_STATUSES: AppointmentStatusValue[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.REMINDER_SENT,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.IN_PROGRESS,
];

/** Status terminais — não permitem mais transições */
export const TERMINAL_STATUSES: AppointmentStatusValue[] = [
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
  AppointmentStatus.RETURN_SCHEDULED,
];

// ─── Labels e cores para UI ───────────────────────────────────────────────────

export const STATUS_LABELS: Record<AppointmentStatusValue, string> = {
  [AppointmentStatus.PENDING]:          'Pendente',
  [AppointmentStatus.CONFIRMED]:        'Confirmado',
  [AppointmentStatus.REMINDER_SENT]:    'Lembrete Enviado',
  [AppointmentStatus.CHECKED_IN]:       'Check-in Realizado',
  [AppointmentStatus.IN_PROGRESS]:      'Em Atendimento',
  [AppointmentStatus.COMPLETED]:        'Concluído',
  [AppointmentStatus.RETURN_SCHEDULED]: 'Retorno Agendado',
  [AppointmentStatus.CANCELLED]:        'Cancelado',
  [AppointmentStatus.NO_SHOW]:          'Não Compareceu',
};

export const STATUS_COLORS: Record<AppointmentStatusValue, string> = {
  [AppointmentStatus.PENDING]:          'bg-yellow-100 text-yellow-800 border-yellow-200',
  [AppointmentStatus.CONFIRMED]:        'bg-blue-100 text-blue-800 border-blue-200',
  [AppointmentStatus.REMINDER_SENT]:    'bg-indigo-100 text-indigo-800 border-indigo-200',
  [AppointmentStatus.CHECKED_IN]:       'bg-cyan-100 text-cyan-800 border-cyan-200',
  [AppointmentStatus.IN_PROGRESS]:      'bg-violet-100 text-violet-800 border-violet-200',
  [AppointmentStatus.COMPLETED]:        'bg-green-100 text-green-800 border-green-200',
  [AppointmentStatus.RETURN_SCHEDULED]: 'bg-teal-100 text-teal-800 border-teal-200',
  [AppointmentStatus.CANCELLED]:        'bg-red-100 text-red-800 border-red-200',
  [AppointmentStatus.NO_SHOW]:          'bg-gray-100 text-gray-800 border-gray-200',
};

// ─── Paginação e limites ──────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ─── Métricas ─────────────────────────────────────────────────────────────────

export const METRICS_CONFIG = {
  /** Total de slots possíveis por dia (considera almoço e buffer) */
  TOTAL_DAILY_SLOTS: 18, // ~08h-18h com slots de ~30 min, excluindo almoço
  /** Horas de expediente por dia (excluindo almoço) */
  WORKING_HOURS_PER_DAY: 9,
} as const;
