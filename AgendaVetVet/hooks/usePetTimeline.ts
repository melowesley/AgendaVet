import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
    const entries: TimelineEntry[] = [];

    // 1. Histórico administrativo
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
            const vet = details?.veterinario || details?.veterinarian || details?.responsavel || null;
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

    // 2. Agendamentos
    const { data: apptData } = await supabase
        .from('appointment_requests')
        .select('id, reason, status, preferred_date, preferred_time, scheduled_date, scheduled_time, veterinarian, admin_notes')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });

    if (apptData) {
        for (const a of apptData) {
            const alreadyInHistory = entries.some(
                (e) => e.type === 'history' && e.details && (e.details as any).appointment_id === a.id
            );

            if (!alreadyInHistory) {
                entries.push({
                    id: `appt-${a.id}`,
                    type: 'appointment',
                    title: 'Consulta/Agendamento',
                    description: a.reason,
                    date: a.scheduled_date || a.preferred_date,
                    time: a.scheduled_time || a.preferred_time,
                    veterinarian: a.veterinarian,
                    status: a.status,
                    module: 'consulta',
                });
            }
        }
    }

    // Ordenar descendente
    entries.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateB.getTime() - dateA.getTime();
    });

    return entries;
}

export function usePetTimeline(petId: string | undefined) {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['pet-timeline', petId],
        queryFn: () => fetchPetTimeline(petId!),
        enabled: !!petId,
    });

    return {
        timeline: data ?? [],
        loading: isLoading,
        refresh: refetch,
    };
}
