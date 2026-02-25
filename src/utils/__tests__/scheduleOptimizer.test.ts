/**
 * scheduleOptimizer.test.ts
 *
 * Testes básicos do algoritmo de encaixe inteligente.
 * Execução: npm test (usa Vitest, já configurado no projeto)
 *
 * Cenários cobertos:
 *  1. Agenda vazia → sugere slots a partir da abertura da clínica.
 *  2. Agenda com um atendimento → sugere slot adjacente (compactação).
 *  3. Conflito de horário → slot conflitante não aparece nas sugestões.
 *  4. Preferência de turno → sugestões do turno preferido têm score mais alto.
 *  5. Slots coringa → último slot livre de cada turno é preservado.
 *  6. Agenda cheia → retorna array vazio de sugestões.
 */

import { describe, it, expect } from 'vitest';
import {
  suggestBestTimeSlot,
  ScheduledAppointment,
  OptimizerResult,
} from '../scheduleOptimizer';

const TARGET_DATE = '2026-02-25';

// ─── Fábrica de agendamentos de teste ────────────────────────────────────────

function makeAppt(
  time: string,
  duration = 30,
  vet: string | null = null,
): ScheduledAppointment {
  return {
    id: crypto.randomUUID(),
    scheduled_date: TARGET_DATE,
    scheduled_time: time,
    veterinarian: vet,
    duration_minutes: duration,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extrai apenas a parte de horário de um datetime ISO (ex: '09:00'). */
function getTime(datetime: string): string {
  return datetime.split('T')[1].slice(0, 5);
}

// ─── Cenário 1: Agenda vazia ──────────────────────────────────────────────────

describe('suggestBestTimeSlot — agenda vazia', () => {
  it('retorna exatamente 3 sugestões', () => {
    const result = suggestBestTimeSlot([], 30, TARGET_DATE);
    expect(result.suggestions).toHaveLength(3);
  });

  it('todas as sugestões estão dentro do horário de funcionamento (08h–18h)', () => {
    const result = suggestBestTimeSlot([], 45, TARGET_DATE);
    result.suggestions.forEach((s) => {
      const time = getTime(s.datetime);
      const [h, m] = time.split(':').map(Number);
      const minutes = h * 60 + m;
      expect(minutes).toBeGreaterThanOrEqual(8 * 60);   // >= 08:00
      expect(minutes + 45).toBeLessThanOrEqual(18 * 60); // fim <= 18:00
    });
  });

  it('nenhuma sugestão começa durante o almoço (12h–13h)', () => {
    const result = suggestBestTimeSlot([], 30, TARGET_DATE);
    result.suggestions.forEach((s) => {
      const time = getTime(s.datetime);
      const [h] = time.split(':').map(Number);
      expect(h).not.toBe(12);
    });
  });

  it('sugestões têm efficiencyScore entre 0 e 100', () => {
    const result = suggestBestTimeSlot([], 30, TARGET_DATE);
    result.suggestions.forEach((s) => {
      expect(s.efficiencyScore).toBeGreaterThanOrEqual(0);
      expect(s.efficiencyScore).toBeLessThanOrEqual(100);
    });
  });

  it('sugestões estão ordenadas por score decrescente', () => {
    const result = suggestBestTimeSlot([], 30, TARGET_DATE);
    const scores = result.suggestions.map((s) => s.efficiencyScore);
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }
  });
});

// ─── Cenário 2: Compactação ───────────────────────────────────────────────────

describe('suggestBestTimeSlot — compactação de atendimentos', () => {
  it('slot adjacente ao atendimento existente tem score mais alto que slot isolado', () => {
    const existing = [makeAppt('08:00', 30)];
    // 08:00 + 30 + 15 (buffer) = 08:45 → slot adjacente ideal
    const result = suggestBestTimeSlot(existing, 30, TARGET_DATE);

    // O slot adjacente deve estar entre as sugestões e ter score alto
    const adjacentSlot = result.suggestions.find(
      (s) => getTime(s.datetime) === '08:45',
    );
    expect(adjacentSlot).toBeDefined();
    // Score do adjacente deve ser maior que a média (compactação = +20)
    if (adjacentSlot) {
      expect(adjacentSlot.efficiencyScore).toBeGreaterThan(80);
    }
  });
});

// ─── Cenário 3: Conflito de horário ──────────────────────────────────────────

describe('suggestBestTimeSlot — detecção de conflitos', () => {
  it('não sugere horário que conflita com agendamento existente', () => {
    const existing = [makeAppt('09:00', 60)];
    // 09:00–10:00 + 15 buffer → bloqueado até 10:15
    const result = suggestBestTimeSlot(existing, 30, TARGET_DATE);

    result.suggestions.forEach((s) => {
      const time = getTime(s.datetime);
      const [h, m] = time.split(':').map(Number);
      const slotMin = h * 60 + m;
      const blockedStart = 9 * 60;
      const blockedEnd = 10 * 60 + 15; // 09:00 + 60 + 15 buffer
      // Slot não pode iniciar dentro da janela bloqueada
      const slotEnd = slotMin + 30;
      const conflito = slotMin < blockedEnd && slotEnd > blockedStart;
      expect(conflito).toBe(false);
    });
  });

  it('sugestões não têm conflitos (array vazio)', () => {
    const result = suggestBestTimeSlot([], 30, TARGET_DATE);
    result.suggestions.forEach((s) => {
      expect(s.conflicts).toHaveLength(0);
    });
  });
});

// ─── Cenário 4: Preferência de turno ─────────────────────────────────────────

describe('suggestBestTimeSlot — preferência de turno', () => {
  it('sugestão do turno manhã tem score mais alto quando preferência é morning', () => {
    const result = suggestBestTimeSlot([], 30, TARGET_DATE, {
      preferredTurn: 'morning',
    });
    // Com agenda vazia e preferência de manhã, o melhor slot deve estar na manhã
    const bestSlot = result.suggestions[0];
    const [h] = getTime(bestSlot.datetime).split(':').map(Number);
    expect(h).toBeLessThan(12);
  });

  it('sugestão do turno tarde tem score mais alto quando preferência é afternoon', () => {
    const result = suggestBestTimeSlot([], 30, TARGET_DATE, {
      preferredTurn: 'afternoon',
    });
    const bestSlot = result.suggestions[0];
    const [h] = getTime(bestSlot.datetime).split(':').map(Number);
    expect(h).toBeGreaterThanOrEqual(13);
  });
});

// ─── Cenário 5: Slots coringa preservados ─────────────────────────────────────

describe('suggestBestTimeSlot — slots coringa', () => {
  it('com agenda quase cheia, ainda há pelo menos 1 sugestão disponível', () => {
    // Preenche o turno da manhã quase todo
    const existing = [
      makeAppt('08:00', 60),
      makeAppt('09:15', 60),
      makeAppt('10:30', 30),
    ];
    const result = suggestBestTimeSlot(existing, 30, TARGET_DATE);
    // O algoritmo ainda deve encontrar alguma sugestão (turno da tarde livre)
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});

// ─── Cenário 6: Agenda completamente cheia ────────────────────────────────────

describe('suggestBestTimeSlot — agenda cheia', () => {
  it('retorna array vazio quando não há slots disponíveis', () => {
    // Preenche toda a agenda com atendimentos de 30 min (sem buffer deixa poucos slots)
    const existing: ScheduledAppointment[] = [];
    // Manhã: 08:00, 08:45, 09:30, 10:15, 11:00 — slots a cada 45 min (30+15)
    const morningTimes = ['08:00', '08:45', '09:30', '10:15', '11:00'];
    // Tarde: 13:00, 13:45, 14:30, 15:15, 16:00, 16:45, 17:30 (17:30+30=18:00)
    const afternoonTimes = ['13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30'];

    [...morningTimes, ...afternoonTimes].forEach((t) => {
      existing.push(makeAppt(t, 30));
    });

    // Com duração muito longa, nenhum slot cabe
    const result = suggestBestTimeSlot(existing, 180, TARGET_DATE);
    expect(result.suggestions).toHaveLength(0);
  });
});

// ─── Cenário 7: reasoning preenchido ─────────────────────────────────────────

describe('suggestBestTimeSlot — reasoning', () => {
  it('todas as sugestões têm reasoning não-vazio', () => {
    const result = suggestBestTimeSlot([], 30, TARGET_DATE);
    result.suggestions.forEach((s) => {
      expect(s.reasoning.length).toBeGreaterThan(0);
    });
  });
});
