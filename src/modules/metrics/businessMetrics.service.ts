import { supabase } from '@/integrations/supabase/client';

export interface BusinessMetrics {
    totalRevenue: number;
    averageTicket: number;
    occupancyRate: number;
    cancellationRate: number;
    totalAppointments: number;
    completedAppointments: number;
}

type ServiceRow = { price: number | null };
type AppointmentMetricsRow = {
  id: string;
  status: string | null;
  service_id: string | null;
  services: ServiceRow | ServiceRow[] | null;
};

function getServicePrice(services: AppointmentMetricsRow['services']): number {
  if (!services) return 0;
  if (Array.isArray(services)) return typeof services[0]?.price === 'number' ? services[0].price : 0;
  return typeof services.price === 'number' ? services.price : 0;
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

    const rows = (appointments ?? []) as AppointmentMetricsRow[];
    const total = rows.length;
    const completed = rows.filter((a) => a.status === 'completed');
    const cancelled = rows.filter((a) => a.status === 'cancelled' || a.status === 'no_show');

    // Cálculo de receita (baseado em snapshots de preços ou serviço atual)
    const totalRevenue = completed.reduce((sum, a) => {
        return sum + getServicePrice(a.services);
    }, 0);

    const averageTicket = completed.length > 0 ? totalRevenue / completed.length : 0;
    const cancellationRate = total > 0 ? (cancelled.length / total) * 100 : 0;

    // Taxa de ocupação (simplificada: agendamentos confirmados/concluídos vs capacidade teórica)
    // Assumindo 8 horas por dia, 2 slots por hora = 16 slots/dia
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    const theoreticalCapacity = daysDiff * 16;
    const occupancyRate = total > 0 ? (rows.filter((a) => a.status !== 'cancelled').length / theoreticalCapacity) * 100 : 0;

    return {
        totalRevenue,
        averageTicket,
        occupancyRate: Math.min(occupancyRate, 100),
        cancellationRate,
        totalAppointments: total,
        completedAppointments: completed.length
    };
};
