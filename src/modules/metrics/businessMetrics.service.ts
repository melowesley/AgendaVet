import { supabase } from '@/integrations/supabase/client';

export interface BusinessMetrics {
    totalRevenue: number;
    averageTicket: number;
    occupancyRate: number;
    cancellationRate: number;
    totalAppointments: number;
    completedAppointments: number;
}

/**
 * Calcula métricas de desempenho do negócio para um determinado período.
 */
export const fetchBusinessMetrics = async (startDate: Date, endDate: Date): Promise<BusinessMetrics> => {
    const { data: appointments, error } = await supabase
        .from('appointment_requests')
        .select(`
      id,
      status,
      service_id,
      services (price)
    `)
        .gte('scheduled_date', startDate.toISOString().split('T')[0])
        .lte('scheduled_date', endDate.toISOString().split('T')[0]);

    if (error) throw error;

    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed');
    const cancelled = appointments.filter(a => a.status === 'cancelled' || a.status === 'no_show');

    // Cálculo de receita (baseado em snapshots de preços ou serviço atual)
    const totalRevenue = completed.reduce((sum, a) => {
        const servicePrice = (a.services as any)?.price || 0;
        return sum + servicePrice;
    }, 0);

    const averageTicket = completed.length > 0 ? totalRevenue / completed.length : 0;
    const cancellationRate = total > 0 ? (cancelled.length / total) * 100 : 0;

    // Taxa de ocupação (simplificada: agendamentos confirmados/concluídos vs capacidade teórica)
    // Assumindo 8 horas por dia, 2 slots por hora = 16 slots/dia
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    const theoreticalCapacity = daysDiff * 16;
    const occupancyRate = total > 0 ? (appointments.filter(a => a.status !== 'cancelled').length / theoreticalCapacity) * 100 : 0;

    return {
        totalRevenue,
        averageTicket,
        occupancyRate: Math.min(occupancyRate, 100),
        cancellationRate,
        totalAppointments: total,
        completedAppointments: completed.length
    };
};
