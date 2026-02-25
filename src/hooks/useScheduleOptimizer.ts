/**
 * useScheduleOptimizer.ts
 *
 * Hook React que integra o algoritmo de encaixe inteligente (scheduleOptimizer)
 * com o Supabase, seguindo o mesmo padrão de useAppointmentRequests.ts.
 *
 * Responsabilidades:
 * 1. Buscar a duração do serviço na tabela `services`.
 * 2. Buscar os agendamentos confirmados/pendentes da data alvo em `appointment_requests`.
 * 3. Enriquecer cada agendamento com a duração do seu serviço associado.
 * 4. Executar o algoritmo suggestBestTimeSlot com os dados coletados.
 * 5. Expor o estado (suggestions, loading, error) para o componente consumidor.
 *
 * Uso dentro do ManageRequestDialog:
 *
 *   const { suggestions, loading, getSuggestions } = useScheduleOptimizer();
 *
 *   // Ao selecionar serviço + data:
 *   await getSuggestions({
 *     serviceId: formData.service_id,
 *     targetDate: formData.scheduled_date,
 *     preferences: { preferredTurn: 'morning' },
 *   });
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  suggestBestTimeSlot,
  ScheduledAppointment,
  ClientPreferences,
  OptimizerResult,
} from '@/utils/scheduleOptimizer';

// ─── Tipos públicos do hook ───────────────────────────────────────────────────

export interface GetSuggestionsOptions {
  /** ID do serviço a ser agendado (tabela `services`) */
  serviceId: string;
  /** Data alvo no formato 'YYYY-MM-DD' */
  targetDate: string;
  /** Preferências do cliente para orientar o algoritmo (opcional) */
  preferences?: ClientPreferences;
  /** ID do agendamento atual — exclui ele próprio do cálculo de conflitos */
  excludeRequestId?: string;
}

export interface UseScheduleOptimizerReturn {
  /** Resultado com até 3 sugestões ordenadas por eficiência */
  suggestions: OptimizerResult | null;
  /** Indica que a busca está em andamento */
  loading: boolean;
  /** Mensagem de erro, se houver */
  error: string | null;
  /** Função para acionar a busca de sugestões */
  getSuggestions: (options: GetSuggestionsOptions) => Promise<void>;
  /** Limpa as sugestões e o erro atual */
  clearSuggestions: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useScheduleOptimizer = (): UseScheduleOptimizerReturn => {
  const [suggestions, setSuggestions] = useState<OptimizerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearSuggestions = useCallback(() => {
    setSuggestions(null);
    setError(null);
  }, []);

  /**
   * getSuggestions
   *
   * Executa o pipeline completo:
   * Supabase → enrichment → algoritmo → estado do hook.
   */
  const getSuggestions = useCallback(
    async ({
      serviceId,
      targetDate,
      preferences = {},
      excludeRequestId,
    }: GetSuggestionsOptions) => {
      if (!serviceId || !targetDate) {
        setError('Selecione um serviço e uma data para obter sugestões.');
        return;
      }

      setLoading(true);
      setError(null);
      setSuggestions(null);

      try {
        // ── Passo 1: busca a duração do serviço a ser agendado ──────────────
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('duration_minutes, name')
          .eq('id', serviceId)
          .single();

        if (serviceError || !serviceData) {
          throw new Error('Não foi possível encontrar o serviço selecionado.');
        }

        // Usa 30 min como padrão se o serviço não tiver duração definida
        const serviceDuration = serviceData.duration_minutes ?? 30;

        // ── Passo 2: busca agendamentos confirmados/pendentes na data alvo ──
        let query = supabase
          .from('appointment_requests')
          .select('id, scheduled_date, scheduled_time, veterinarian, service_id, status')
          .eq('scheduled_date', targetDate)
          .in('status', ['confirmed', 'pending'])
          .not('scheduled_time', 'is', null);

        // Exclui o próprio agendamento (evita conflito consigo mesmo ao reagendar)
        if (excludeRequestId) {
          query = query.neq('id', excludeRequestId);
        }

        const { data: appointmentsData, error: appointmentsError } = await query;

        if (appointmentsError) {
          throw new Error('Não foi possível carregar os agendamentos do dia.');
        }

        // ── Passo 3: enriquece cada agendamento com a duração do seu serviço ─
        const uniqueServiceIds = [
          ...new Set(
            (appointmentsData ?? [])
              .map((a) => a.service_id)
              .filter((id): id is string => id !== null),
          ),
        ];

        const serviceDurationsMap = new Map<string, number>();

        if (uniqueServiceIds.length > 0) {
          const { data: servicesData } = await supabase
            .from('services')
            .select('id, duration_minutes')
            .in('id', uniqueServiceIds);

          (servicesData ?? []).forEach((s) => {
            serviceDurationsMap.set(s.id, s.duration_minutes ?? 30);
          });
        }

        // ── Passo 4: monta o array no formato esperado pelo algoritmo ────────
        const existingAppointments: ScheduledAppointment[] = (
          appointmentsData ?? []
        )
          .filter((a) => a.scheduled_date && a.scheduled_time)
          .map((a) => ({
            id: a.id,
            scheduled_date: a.scheduled_date as string,
            scheduled_time: a.scheduled_time as string,
            veterinarian: a.veterinarian,
            duration_minutes: a.service_id
              ? (serviceDurationsMap.get(a.service_id) ?? 30)
              : 30,
          }));

        // ── Passo 5: executa o algoritmo de otimização ───────────────────────
        const result = suggestBestTimeSlot(
          existingAppointments,
          serviceDuration,
          targetDate,
          preferences,
        );

        setSuggestions(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro desconhecido ao calcular sugestões.';
        setError(message);
        setSuggestions(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { suggestions, loading, error, getSuggestions, clearSuggestions };
};
