/**
 * usePetTimeline
 *
 * Hook unificado que agrega todos os registros do pet em uma única timeline.
 *
 * FONTES DE DADOS (em ordem de prioridade):
 * 1. pet_admin_history  → fonte principal; inclui todos os módulos que passam por logPetAdminHistory()
 * 2. appointment_requests → agendamentos que ainda não possuem entrada no histórico admin
 * 3-10. Tabelas específicas (peso, exame, receita, vacina, internação, observação, patologia,
 *       documento) → fallback para registros legados sem entrada no histórico admin
 *
 * DEDUPLICAÇÃO:
 * Cada entrada de history carrega `source_id` (coluna da tabela pet_admin_history).
 * Ao buscar nas tabelas específicas, se já existe uma entrada de history com o mesmo
 * source_id, o registro direto é ignorado.
 *
 * Para agendamentos, a deduplicação usa o campo `details.appointment_id` que é gravado
 * pelo ConsultaDialog / AvaliacaoCirurgicaDialog / CirurgiaDialog / RetornoDialog.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getResourceCache, setResourceCache } from '@/lib/local-first/state';
import { isNetworkOnline } from '@/lib/local-first/sync';

export interface TimelineEntry {
  id: string;
  type:
    | 'appointment'
    | 'exam'
    | 'weight'
    | 'prescription'
    | 'vaccine'
    | 'hospitalization'
    | 'observation'
    | 'pathology'
    | 'document'
    | 'photo'
    | 'video'
    | 'history';
  title: string;
  description?: string;
  date: string;
  time: string;
  veterinarian?: string | null;
  status?: string;
  module?: string;
  /** sourceId vem da coluna source_id do pet_admin_history; usado para deduplicação */
  sourceId?: string | null;
  details?: Record<string, unknown> | null;
}

const MODULE_LABELS: Record<string, string> = {
  consulta: 'Consulta',
  avaliacao_cirurgica: 'Aval. Cirúrgica',
  cirurgia: 'Cirurgia',
  retorno: 'Retorno',
  peso: 'Peso',
  patologia: 'Patologia',
  documento: 'Documento',
  exame: 'Exame',
  fotos: 'Fotos',
  vacina: 'Aplicações',
  receita: 'Receituário',
  observacoes: 'Observações',
  video: 'Vídeo',
  internacao: 'Internação',
  diagnostico: 'Diagnóstico',
  banho_tosa: 'Banho e Tosa',
  obito: 'Óbito',
  servico: 'Serviço',
};

export const getModuleLabel = (module: string): string =>
  MODULE_LABELS[module] || module;

async function fetchPetTimeline(petId: string): Promise<TimelineEntry[]> {
  const cacheKey = `admin:pet-timeline:${petId}`;
  const cached = await getResourceCache<TimelineEntry[]>(cacheKey);

  if (!isNetworkOnline() && cached) {
    return cached.data;
  }

  try {
    const entries: TimelineEntry[] = [];

  // ─── 1. Histórico administrativo (fonte principal) ─────────────────────────
  const { data: historyData } = await supabase
    .from('pet_admin_history')
    .select('id, module, action, title, details, source_id, created_at')
    .eq('pet_id', petId)
    .neq('action', 'delete')
    .order('created_at', { ascending: false });

  const coveredSourceIds = new Set<string>();

  if (historyData) {
    for (const h of historyData) {
      const details = h.details as Record<string, unknown> | null;
      const vet =
        details?.veterinario ||
        details?.veterinarian ||
        details?.responsavel ||
        null;
      const dateObj = new Date(h.created_at);

      if (h.source_id) coveredSourceIds.add(h.source_id);

      entries.push({
        id: `history-${h.id}`,
        type: 'history',
        title: h.title,
        description: h.module ? getModuleLabel(h.module) : undefined,
        date: dateObj.toISOString().split('T')[0],
        time: dateObj.toTimeString().substring(0, 5),
        veterinarian: typeof vet === 'string' ? vet : null,
        module: h.module,
        sourceId: h.source_id ?? null,
        details,
      });
    }
  }

  // ─── 2. Agendamentos sem entrada no histórico ──────────────────────────────
  const { data: apptData } = await supabase
    .from('appointment_requests')
    .select(
      'id, reason, status, preferred_date, preferred_time, scheduled_date, scheduled_time, veterinarian, admin_notes, service:services(name)'
    )
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });

  if (apptData) {
    for (const raw of apptData) {
      const a = raw as {
        id: string;
        reason: string;
        status: string;
        preferred_date: string;
        preferred_time: string;
        scheduled_date: string | null;
        scheduled_time: string | null;
        veterinarian: string | null;
        admin_notes: string | null;
        service: { name?: string | null } | null;
      };

      let attendanceType: string | null = null;
      let parsedDetails: Record<string, unknown> | null = null;
      try {
        const parsed = a.admin_notes ? JSON.parse(a.admin_notes) : null;
        attendanceType = parsed?.tipo_atendimento || null;
        parsedDetails = parsed && typeof parsed === 'object' ? parsed : null;
      } catch {
        /* ignore */
      }

      const alreadyInHistory = entries.some(
        (e) =>
          e.type === 'history' &&
          e.details &&
          (e.details as Record<string, unknown>).appointment_id === a.id
      );

      if (!alreadyInHistory) {
        const details: Record<string, unknown> = {
          ...(parsedDetails || {}),
          motivo: a.reason,
        };
        entries.push({
          id: `appt-${a.id}`,
          type: 'appointment',
          title:
            a.service?.name ||
            (attendanceType
              ? getModuleLabel(attendanceType) || 'Consulta'
              : 'Consulta'),
          description: a.reason,
          date: a.scheduled_date || a.preferred_date,
          time: a.scheduled_time || a.preferred_time,
          veterinarian: a.veterinarian,
          status: a.status,
          module: attendanceType || 'consulta',
          details: Object.keys(details).length > 0 ? details : null,
        });
      }
    }
  }

  const isCovered = (rowId: string) => coveredSourceIds.has(rowId);

  // ─── 3. Peso ───────────────────────────────────────────────────────────────
  const { data: weightData } = await supabase
    .from('pet_weight_records')
    .select('id, weight, date, notes, created_at')
    .eq('pet_id', petId)
    .order('date', { ascending: false });

  if (weightData) {
    for (const w of weightData) {
      if (isCovered(w.id)) continue;
      const dateObj = new Date(w.created_at);
      entries.push({
        id: `weight-${w.id}`,
        type: 'weight',
        title: `${Number(w.weight).toLocaleString('pt-BR', {
          minimumFractionDigits: 3,
        })} kg`,
        date: w.date,
        time: dateObj.toTimeString().substring(0, 5),
        module: 'peso',
      });
    }
  }

  // ─── 4. Exames ─────────────────────────────────────────────────────────────
  const { data: examData } = await supabase
    .from('pet_exams')
    .select('id, exam_type, exam_date, veterinarian, notes, created_at')
    .eq('pet_id', petId)
    .order('exam_date', { ascending: false });

  if (examData) {
    for (const e of examData) {
      if (isCovered(e.id)) continue;
      const dateObj = new Date(e.created_at);
      entries.push({
        id: `exam-${e.id}`,
        type: 'exam',
        title: e.exam_type,
        description: e.notes || undefined,
        date: e.exam_date,
        time: dateObj.toTimeString().substring(0, 5),
        veterinarian: e.veterinarian,
        module: 'exame',
      });
    }
  }

  // ─── 5. Prescrições ────────────────────────────────────────────────────────
  const { data: prescData } = await supabase
    .from('pet_prescriptions')
    .select('id, medication_name, prescription_date, veterinarian, notes, created_at')
    .eq('pet_id', petId)
    .order('prescription_date', { ascending: false });

  if (prescData) {
    for (const p of prescData) {
      if (isCovered(p.id)) continue;
      const dateObj = new Date(p.created_at);
      entries.push({
        id: `presc-${p.id}`,
        type: 'prescription',
        title: 'Receituário',
        description: p.medication_name,
        date: p.prescription_date,
        time: dateObj.toTimeString().substring(0, 5),
        veterinarian: p.veterinarian,
        module: 'receita',
      });
    }
  }

  // ─── 6. Vacinas ────────────────────────────────────────────────────────────
  const { data: vaccineData } = await supabase
    .from('pet_vaccines')
    .select('id, vaccine_name, application_date, veterinarian, created_at')
    .eq('pet_id', petId)
    .order('application_date', { ascending: false });

  if (vaccineData) {
    for (const v of vaccineData) {
      if (isCovered(v.id)) continue;
      const dateObj = new Date(v.created_at);
      entries.push({
        id: `vaccine-${v.id}`,
        type: 'vaccine',
        title: v.vaccine_name,
        date: v.application_date,
        time: dateObj.toTimeString().substring(0, 5),
        veterinarian: v.veterinarian,
        module: 'vacina',
      });
    }
  }

  // ─── 7. Internações ────────────────────────────────────────────────────────
  const { data: hospData } = await supabase
    .from('pet_hospitalizations')
    .select('id, reason, admission_date, status, veterinarian, created_at')
    .eq('pet_id', petId)
    .order('admission_date', { ascending: false });

  if (hospData) {
    for (const h of hospData) {
      if (isCovered(h.id)) continue;
      const dateObj = new Date(h.created_at);
      entries.push({
        id: `hosp-${h.id}`,
        type: 'hospitalization',
        title: 'Internação',
        description: h.reason,
        date: new Date(h.admission_date).toISOString().split('T')[0],
        time: dateObj.toTimeString().substring(0, 5),
        veterinarian: h.veterinarian,
        status: h.status,
        module: 'internacao',
      });
    }
  }

  // ─── 8. Observações ────────────────────────────────────────────────────────
  const { data: obsData } = await supabase
    .from('pet_observations')
    .select('id, title, observation, observation_date, created_at')
    .eq('pet_id', petId)
    .order('observation_date', { ascending: false });

  if (obsData) {
    for (const o of obsData) {
      if (isCovered(o.id)) continue;
      const dateObj = new Date(o.created_at);
      entries.push({
        id: `obs-${o.id}`,
        type: 'observation',
        title: o.title || 'Observação',
        description: o.observation,
        date: o.observation_date,
        time: dateObj.toTimeString().substring(0, 5),
        module: 'observacoes',
      });
    }
  }

  // ─── 9. Patologias ─────────────────────────────────────────────────────────
  const { data: pathData } = await supabase
    .from('pet_pathologies')
    .select('id, name, diagnosis_date, status, created_at')
    .eq('pet_id', petId)
    .order('diagnosis_date', { ascending: false });

  if (pathData) {
    for (const p of pathData) {
      if (isCovered(p.id)) continue;
      const dateObj = new Date(p.created_at);
      entries.push({
        id: `path-${p.id}`,
        type: 'pathology',
        title: p.name,
        date: p.diagnosis_date,
        time: dateObj.toTimeString().substring(0, 5),
        status: p.status,
        module: 'patologia',
      });
    }
  }

  // ─── 10. Documentos (fallback) ─────────────────────────────────────────────
  const { data: docData } = await supabase
    .from('pet_documents')
    .select('id, title, document_type, description, date, created_at')
    .eq('pet_id', petId)
    .order('date', { ascending: false });

  if (docData) {
    for (const d of docData) {
      if (isCovered(d.id)) continue;
      const dateObj = new Date(d.created_at);
      entries.push({
        id: `doc-${d.id}`,
        type: 'document',
        title: d.title,
        description: d.description || d.document_type || undefined,
        date: d.date,
        time: dateObj.toTimeString().substring(0, 5),
        module: 'documento',
      });
    }
  }

    // ─── Ordenar por data + hora descendente ───────────────────────────────────
    entries.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateB.getTime() - dateA.getTime();
    });

    await setResourceCache(cacheKey, entries);
    return entries;
  } catch (error) {
    if (cached) return cached.data;
    throw error;
  }
}

export const usePetTimeline = (petId: string | undefined) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pet-timeline', petId],
    queryFn: () => fetchPetTimeline(petId!),
    enabled: !!petId,
  });

  return {
    timeline: data ?? [],
    loading: isLoading,
    refetch,
  };
};
