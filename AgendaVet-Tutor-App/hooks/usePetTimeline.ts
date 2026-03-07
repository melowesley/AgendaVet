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
    | 'invoice'
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
    vacina: 'Vacina(s)',
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

    // 1. Histórico administrativo (apenas leitura e não sensível: vacina, peso, banho_tosa, receita, documento)
    const { data: historyData } = await supabase
        .from('pet_admin_history')
        .select('id, module, action, title, details, source_id, created_at')
        .eq('pet_id', petId)
        .in('module', ['vacina', 'peso', 'banho_tosa', 'receita', 'documento'])
        .neq('action', 'delete')
        .order('created_at', { ascending: false });

    if (historyData) {
        for (const h of historyData) {
            const details = h.details as Record<string, unknown> | null;
            const vet = details?.veterinario || details?.veterinarian || details?.responsavel || null;
            const dateObj = new Date(h.created_at);

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

    // 2. Cobranças (Invoices)
    const { data: invoicesData } = await supabase
        .from('invoices')
        .select(`
            id,
            total_amount,
            status,
            payment_method,
            created_at,
            invoice_items ( description, quantity, unit_price )
        `)
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });

    if (invoicesData) {
        for (const inv of invoicesData) {
            const dateObj = new Date(inv.created_at);

            // Format details for display
            let descStr = '';
            if (inv.invoice_items && inv.invoice_items.length > 0) {
                descStr = inv.invoice_items.map((i: any) => `${i.quantity}x ${i.description}`).join(', ');
            } else {
                descStr = 'Serviços Diversos';
            }

            entries.push({
                id: `invoice-${inv.id}`,
                type: 'invoice',
                title: `Cobrança - R$ ${Number(inv.total_amount).toFixed(2)}`,
                description: descStr,
                date: dateObj.toISOString().split('T')[0],
                time: dateObj.toTimeString().substring(0, 5),
                status: inv.status,
                module: 'financeiro',
                sourceId: inv.id,
                details: { ...inv },
            });
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
