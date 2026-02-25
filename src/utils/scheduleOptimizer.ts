/**
 * scheduleOptimizer.ts
 *
 * Algoritmo inteligente de encaixe automático para o AgendaVet.
 *
 * Lógica principal:
 * 1. Recebe os agendamentos confirmados/pendentes do dia como entrada.
 * 2. Gera todos os slots possíveis dentro do horário de funcionamento (08h–18h),
 *    excluindo horário de almoço (12h–13h) e slots que conflitem com a agenda.
 * 3. Reserva 1 slot "coringa" por turno (último slot livre) para emergências.
 * 4. Calcula um score de eficiência (0–100) para cada slot candidato, penalizando
 *    lacunas > 2h e premiando compactação de atendimentos no mesmo turno.
 * 5. Retorna as 3 melhores sugestões ordenadas pelo score.
 */

// ─── Tipos públicos ───────────────────────────────────────────────────────────

/** Representa um agendamento já existente na agenda do dia. */
export interface ScheduledAppointment {
  id: string;
  /** Data no formato 'YYYY-MM-DD' */
  scheduled_date: string;
  /** Horário no formato 'HH:mm' */
  scheduled_time: string;
  /** Nome do veterinário responsável, se atribuído */
  veterinarian: string | null;
  /** Duração do serviço associado em minutos (padrão: 30) */
  duration_minutes: number;
}

/** Preferências do cliente para orientar o algoritmo. */
export interface ClientPreferences {
  /** Data preferida no formato 'YYYY-MM-DD' */
  preferredDate?: string;
  /** Nome do veterinário preferido */
  preferredVeterinarian?: string;
  /** Turno preferido: 'morning' = manhã, 'afternoon' = tarde */
  preferredTurn?: 'morning' | 'afternoon';
}

/** Uma sugestão de horário gerada pelo algoritmo. */
export interface SlotSuggestion {
  /** Data e hora no formato ISO 8601 (ex: '2026-02-25T09:00:00') */
  datetime: string;
  /** Score de eficiência de 0 a 100 (maior = melhor encaixe) */
  efficiencyScore: number;
  /** Explicação legível sobre por que este slot foi sugerido */
  reasoning: string;
  /** Lista de conflitos detectados (vazia se não houver) */
  conflicts: string[];
}

/** Resultado retornado pela função principal. */
export interface OptimizerResult {
  suggestions: SlotSuggestion[];
}

// ─── Constantes de configuração ───────────────────────────────────────────────

const CLINIC_START = '08:00';
const CLINIC_END = '18:00';
const LUNCH_START = '12:00';
const LUNCH_END = '13:00';

/** Buffer obrigatório entre atendimentos consecutivos (em minutos). */
const BUFFER_MINUTES = 15;

/** Lacuna máxima permitida entre dois atendimentos antes de penalizar. */
const MAX_GAP_MINUTES = 120; // 2 horas

/** Granularidade dos slots gerados (em minutos). */
const SLOT_INTERVAL_MINUTES = 15;

/** Número máximo de sugestões retornadas. */
const MAX_SUGGESTIONS = 3;

// ─── Funções auxiliares internas ──────────────────────────────────────────────

/** Converte 'HH:mm' para minutos desde meia-noite. */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Converte minutos desde meia-noite para string 'HH:mm'. */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Verifica se um slot candidato (início + duração) conflita com um agendamento existente.
 * O buffer é somado à duração do agendamento existente para garantir espaçamento.
 */
function hasTimeConflict(
  slotStartMin: number,
  slotDuration: number,
  appt: ScheduledAppointment,
): boolean {
  const slotEndMin = slotStartMin + slotDuration;
  const apptStartMin = timeToMinutes(appt.scheduled_time);
  // Considera o buffer após cada agendamento existente
  const apptEndMin = apptStartMin + appt.duration_minutes + BUFFER_MINUTES;
  return slotStartMin < apptEndMin && slotEndMin > apptStartMin;
}

/** Verifica se um slot conflita com o horário de almoço. */
function conflictsWithLunch(slotStartMin: number, duration: number): boolean {
  const slotEndMin = slotStartMin + duration;
  const lunchStartMin = timeToMinutes(LUNCH_START);
  const lunchEndMin = timeToMinutes(LUNCH_END);
  return slotStartMin < lunchEndMin && slotEndMin > lunchStartMin;
}

/** Retorna o turno de um horário em minutos. */
function getTurn(timeMin: number): 'morning' | 'afternoon' {
  return timeMin < timeToMinutes(LUNCH_START) ? 'morning' : 'afternoon';
}

// ─── Slots coringa ────────────────────────────────────────────────────────────

/**
 * Identifica e reserva 1 slot coringa por turno (manhã e tarde).
 *
 * O slot coringa é o *último slot livre* de cada turno. Ele é reservado
 * para encaixes urgentes/emergências, garantindo sempre uma "válvula de
 * escape" na agenda. Os slots coringa nunca são sugeridos pelo optimizer.
 */
function getWildcardSlots(
  dayAppointments: ScheduledAppointment[],
  duration: number,
): number[] {
  const clinicStartMin = timeToMinutes(CLINIC_START);
  const clinicEndMin = timeToMinutes(CLINIC_END);
  const lunchStartMin = timeToMinutes(LUNCH_START);
  const lunchEndMin = timeToMinutes(LUNCH_END);

  const wildcards: number[] = [];

  // Define os intervalos de cada turno
  const turns = [
    { start: clinicStartMin, end: lunchStartMin },
    { start: lunchEndMin, end: clinicEndMin },
  ];

  for (const turn of turns) {
    let lastFreeSlot: number | null = null;

    for (
      let slotMin = turn.start;
      slotMin + duration <= turn.end;
      slotMin += SLOT_INTERVAL_MINUTES
    ) {
      const occupied = dayAppointments.some((a) =>
        hasTimeConflict(slotMin, duration, a),
      );
      if (!occupied) {
        lastFreeSlot = slotMin;
      }
    }

    if (lastFreeSlot !== null) {
      wildcards.push(lastFreeSlot);
    }
  }

  return wildcards;
}

// ─── Cálculo de score ─────────────────────────────────────────────────────────

interface ScoreResult {
  value: number;
  reasoning: string;
}

/**
 * Calcula o score de eficiência (0–100) de um slot candidato.
 *
 * Critérios positivos (+):
 *   - Adjacente a outro atendimento existente (compactação)     → +20
 *   - Primeiro atendimento do turno (abre o turno)             → +10
 *   - Corresponde ao turno preferido do cliente                → +15
 *   - Corresponde à data preferida do cliente                  → +5
 *
 * Critérios negativos (−):
 *   - Lacuna > 2h antes do slot                                → -30
 *   - Lacuna > 2h depois do slot                               → -30
 *   - Slot nos últimos 30 min do expediente                    → -10
 */
function calculateEfficiencyScore(
  slotMin: number,
  duration: number,
  dayAppointments: ScheduledAppointment[],
  preferences: ClientPreferences,
): ScoreResult {
  let score = 100;
  const reasons: string[] = [];
  const slotEnd = slotMin + duration;
  const turn = getTurn(slotMin);
  const clinicEndMin = timeToMinutes(CLINIC_END);

  // ── Compactação: slot está imediatamente após outro atendimento ──────────
  const isAdjacentAfterPrev = dayAppointments.some((a) => {
    const apptEnd = timeToMinutes(a.scheduled_time) + a.duration_minutes + BUFFER_MINUTES;
    return apptEnd === slotMin || (slotMin - apptEnd >= 0 && slotMin - apptEnd <= BUFFER_MINUTES);
  });

  // ── Compactação: slot termina imediatamente antes do próximo ────────────
  const isAdjacentBeforeNext = dayAppointments.some((a) => {
    const apptStart = timeToMinutes(a.scheduled_time);
    const gap = apptStart - (slotEnd + BUFFER_MINUTES);
    return gap >= 0 && gap <= BUFFER_MINUTES;
  });

  if (isAdjacentAfterPrev || isAdjacentBeforeNext) {
    score += 20;
    reasons.push('Compacta o turno — encaixa adjacente a outro atendimento');
  }

  // ── Penalidade por lacuna > 2h antes do slot ─────────────────────────────
  const prevAppts = dayAppointments
    .filter((a) => timeToMinutes(a.scheduled_time) + a.duration_minutes <= slotMin)
    .sort((a, b) => timeToMinutes(b.scheduled_time) - timeToMinutes(a.scheduled_time));

  if (prevAppts.length > 0) {
    const prev = prevAppts[0];
    const prevEndMin = timeToMinutes(prev.scheduled_time) + prev.duration_minutes;
    const gapBefore = slotMin - prevEndMin;
    if (gapBefore > MAX_GAP_MINUTES) {
      score -= 30;
      const gapHours = (gapBefore / 60).toFixed(1);
      reasons.push(`Cria lacuna de ${gapHours}h antes deste horário`);
    }
  }

  // ── Penalidade por lacuna > 2h depois do slot ────────────────────────────
  const nextAppts = dayAppointments
    .filter((a) => timeToMinutes(a.scheduled_time) >= slotEnd + BUFFER_MINUTES)
    .sort((a, b) => timeToMinutes(a.scheduled_time) - timeToMinutes(b.scheduled_time));

  if (nextAppts.length > 0) {
    const next = nextAppts[0];
    const gapAfter = timeToMinutes(next.scheduled_time) - slotEnd - BUFFER_MINUTES;
    if (gapAfter > MAX_GAP_MINUTES) {
      score -= 30;
      const gapHours = (gapAfter / 60).toFixed(1);
      reasons.push(`Cria lacuna de ${gapHours}h após este horário`);
    }
  }

  // ── Bonus: primeiro atendimento do turno ─────────────────────────────────
  const turnAppts = dayAppointments.filter(
    (a) => getTurn(timeToMinutes(a.scheduled_time)) === turn,
  );
  if (turnAppts.length === 0) {
    score += 10;
    const turnLabel = turn === 'morning' ? 'matutino' : 'vespertino';
    reasons.push(`Primeiro atendimento do turno ${turnLabel}`);
  }

  // ── Bonus: turno preferido pelo cliente ──────────────────────────────────
  if (preferences.preferredTurn && preferences.preferredTurn === turn) {
    score += 15;
    const turnLabel = turn === 'morning' ? 'manhã' : 'tarde';
    reasons.push(`Corresponde ao turno preferido do cliente (${turnLabel})`);
  }

  // ── Bonus: data preferida do cliente ─────────────────────────────────────
  if (preferences.preferredDate) {
    score += 5;
    reasons.push('Na data preferida pelo cliente');
  }

  // ── Penalidade: próximo ao fim do expediente ──────────────────────────────
  if (slotEnd > clinicEndMin - 30) {
    score -= 10;
    reasons.push('Próximo ao encerramento do expediente');
  }

  // Scores são mantidos acima de 100 internamente para preservar a ordenação correta;
  // a exibição é normalizada entre 0 e 100 apenas no resultado final (veja abaixo).
  return {
    value: Math.max(0, score),
    reasoning:
      reasons.length > 0
        ? reasons.join('. ') + '.'
        : 'Horário disponível dentro do expediente.',
  };
}

// ─── Função pública principal ─────────────────────────────────────────────────

/**
 * suggestBestTimeSlot
 *
 * Analisa a agenda de um dia específico e retorna as 3 melhores sugestões
 * de horário para encaixar um novo atendimento.
 *
 * @param existingAppointments  Agendamentos já confirmados/pendentes na data.
 * @param serviceDuration       Duração do serviço a ser agendado (em minutos).
 * @param targetDate            Data alvo no formato 'YYYY-MM-DD'.
 * @param preferences           Preferências do cliente (opcional).
 * @returns                     Objeto com array de até 3 sugestões ordenadas.
 *
 * @example
 * // Dentro de um hook ou componente admin:
 * const result = suggestBestTimeSlot(existingAppointments, 45, '2026-02-25', {
 *   preferredTurn: 'morning',
 *   preferredVeterinarian: 'Dr. Silva',
 * });
 * console.log(result.suggestions[0].datetime);        // '2026-02-25T08:00:00'
 * console.log(result.suggestions[0].efficiencyScore); // 95
 * console.log(result.suggestions[0].reasoning);       // 'Primeiro atendimento do turno matutino...'
 */
export function suggestBestTimeSlot(
  existingAppointments: ScheduledAppointment[],
  serviceDuration: number,
  targetDate: string,
  preferences: ClientPreferences = {},
): OptimizerResult {
  const clinicStartMin = timeToMinutes(CLINIC_START);
  const clinicEndMin = timeToMinutes(CLINIC_END);

  // Filtra e ordena os agendamentos da data alvo
  const dayAppointments = existingAppointments
    .filter((a) => a.scheduled_date === targetDate)
    .sort(
      (a, b) =>
        timeToMinutes(a.scheduled_time) - timeToMinutes(b.scheduled_time),
    );

  // Identifica slots coringa para reservar (1 por turno)
  const wildcardSlots = getWildcardSlots(dayAppointments, serviceDuration);

  const candidates: SlotSuggestion[] = [];

  // Itera cada slot possível dentro do horário de funcionamento
  for (
    let slotMin = clinicStartMin;
    slotMin + serviceDuration <= clinicEndMin;
    slotMin += SLOT_INTERVAL_MINUTES
  ) {
    // Descarta slots que colidem com o almoço
    if (conflictsWithLunch(slotMin, serviceDuration)) continue;

    // Descarta slots que conflitam com agendamentos existentes
    const conflicts: string[] = [];
    let hasConflict = false;

    for (const appt of dayAppointments) {
      if (hasTimeConflict(slotMin, serviceDuration, appt)) {
        hasConflict = true;
        conflicts.push(
          `Conflito com atendimento já agendado para ${appt.scheduled_time}`,
        );
      }

      // Conflito de veterinário: mesmo profissional, horário sobreposto
      if (
        preferences.preferredVeterinarian &&
        appt.veterinarian === preferences.preferredVeterinarian &&
        hasTimeConflict(slotMin, serviceDuration, appt)
      ) {
        conflicts.push(
          `${preferences.preferredVeterinarian} já possui atendimento às ${appt.scheduled_time}`,
        );
      }
    }

    if (hasConflict) continue;

    // Preserva os slots coringa — não os sugere para agendamentos normais
    if (wildcardSlots.includes(slotMin)) continue;

    // Calcula o score e gera o candidato
    const score = calculateEfficiencyScore(
      slotMin,
      serviceDuration,
      dayAppointments,
      preferences,
    );

    candidates.push({
      datetime: `${targetDate}T${minutesToTime(slotMin)}:00`,
      efficiencyScore: score.value,
      reasoning: score.reasoning,
      conflicts,
    });
  }

  // Ordena pelos scores brutos (podem exceder 100) para preservar o ranking correto
  const sorted = candidates.sort((a, b) => b.efficiencyScore - a.efficiencyScore);

  // Normaliza os scores para 0–100 apenas após a ordenação
  const maxScore = sorted.length > 0 ? sorted[0].efficiencyScore : 100;
  const suggestions = sorted.slice(0, MAX_SUGGESTIONS).map((s) => ({
    ...s,
    efficiencyScore: Math.round(Math.min(100, (s.efficiencyScore / maxScore) * 100)),
  }));

  return { suggestions };
}
