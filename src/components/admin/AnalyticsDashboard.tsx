import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, DollarSign, BarChart3, CalendarDays } from 'lucide-react';

interface AppointmentRow {
  id: string;
  status: string;
  created_at: string;
  preferred_date: string;
  scheduled_date: string | null;
  service_id: string | null;
}

interface ServiceRow {
  id: string;
  name: string;
  price: number;
}

const CHART_COLORS = [
  'hsl(168, 55%, 42%)',
  'hsl(35, 90%, 55%)',
  'hsl(200, 70%, 50%)',
  'hsl(280, 60%, 55%)',
  'hsl(145, 60%, 42%)',
  'hsl(0, 72%, 55%)',
  'hsl(45, 80%, 50%)',
  'hsl(220, 65%, 55%)',
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'hsl(40, 95%, 55%)',
  confirmed: 'hsl(168, 55%, 42%)',
  completed: 'hsl(145, 60%, 42%)',
  cancelled: 'hsl(0, 72%, 55%)',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

type Period = '7d' | '30d' | '90d' | '6m' | '12m';

export const AnalyticsDashboard = () => {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [apptRes, svcRes] = await Promise.all([
      supabase.from('appointment_requests').select('id, status, created_at, preferred_date, scheduled_date, service_id'),
      supabase.from('services').select('id, name, price'),
    ]);
    if (apptRes.data) setAppointments(apptRes.data);
    if (svcRes.data) setServices(svcRes.data);
    setLoading(false);
  };

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case '7d': return { start: subDays(now, 7), end: now };
      case '30d': return { start: subDays(now, 30), end: now };
      case '90d': return { start: subDays(now, 90), end: now };
      case '6m': return { start: subMonths(now, 6), end: now };
      case '12m': return { start: subMonths(now, 12), end: now };
    }
  }, [period]);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const d = new Date(a.preferred_date);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [appointments, dateRange]);

  const serviceMap = useMemo(() => {
    const m = new Map<string, ServiceRow>();
    services.forEach((s) => m.set(s.id, s));
    return m;
  }, [services]);

  // --- Consultas por período (line chart) ---
  const timeSeriesData = useMemo(() => {
    const useMonths = period === '6m' || period === '12m';
    if (useMonths) {
      const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
      return months.map((month) => {
        const count = filtered.filter((a) => isSameMonth(new Date(a.preferred_date), month)).length;
        return { label: format(month, 'MMM yy', { locale: ptBR }), consultas: count };
      });
    }
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    return days.map((day) => {
      const count = filtered.filter((a) => isSameDay(new Date(a.preferred_date), day)).length;
      return { label: format(day, 'dd/MM', { locale: ptBR }), consultas: count };
    });
  }, [filtered, dateRange, period]);

  // --- Status breakdown (pie chart) ---
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((a) => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_LABELS[status] || status,
      value,
      color: STATUS_COLORS[status] || CHART_COLORS[0],
    }));
  }, [filtered]);

  // --- Serviços mais usados (bar chart) ---
  const serviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((a) => {
      if (a.service_id) counts[a.service_id] = (counts[a.service_id] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([id, count]) => ({ name: serviceMap.get(id)?.name || 'Outros', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filtered, serviceMap]);

  // --- Faturamento estimado (bar chart) ---
  const revenueData = useMemo(() => {
    const useMonths = period === '6m' || period === '12m';
    const completedOrConfirmed = filtered.filter((a) => a.status === 'completed' || a.status === 'confirmed');

    if (useMonths) {
      const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
      return months.map((month) => {
        const monthAppts = completedOrConfirmed.filter((a) => isSameMonth(new Date(a.preferred_date), month));
        const total = monthAppts.reduce((sum, a) => {
          const svc = a.service_id ? serviceMap.get(a.service_id) : null;
          return sum + (svc?.price || 0);
        }, 0);
        return { label: format(month, 'MMM yy', { locale: ptBR }), faturamento: total };
      });
    }

    // For shorter periods, aggregate by week-ish chunks (every 7 days)
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    const chunkSize = period === '7d' ? 1 : 7;
    const result: { label: string; faturamento: number }[] = [];
    for (let i = 0; i < days.length; i += chunkSize) {
      const chunk = days.slice(i, i + chunkSize);
      const label = chunkSize === 1
        ? format(chunk[0], 'dd/MM', { locale: ptBR })
        : `${format(chunk[0], 'dd/MM', { locale: ptBR })}`;
      const total = completedOrConfirmed
        .filter((a) => chunk.some((d) => isSameDay(new Date(a.preferred_date), d)))
        .reduce((sum, a) => {
          const svc = a.service_id ? serviceMap.get(a.service_id) : null;
          return sum + (svc?.price || 0);
        }, 0);
      result.push({ label, faturamento: total });
    }
    return result;
  }, [filtered, dateRange, period, serviceMap]);

  // --- Summary stats ---
  const summary = useMemo(() => {
    const total = filtered.length;
    const completed = filtered.filter((a) => a.status === 'completed').length;
    const totalRevenue = filtered
      .filter((a) => a.status === 'completed' || a.status === 'confirmed')
      .reduce((sum, a) => {
        const svc = a.service_id ? serviceMap.get(a.service_id) : null;
        return sum + (svc?.price || 0);
      }, 0);
    return { total, completed, totalRevenue };
  }, [filtered, serviceMap]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold">Visão Geral</h3>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="12m">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-sm text-muted-foreground">Consultas no período</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.completed}</p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">R$ {summary.totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Faturamento estimado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consultas por período */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Consultas por Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(160, 20%, 88%)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="consultas"
                  stroke="hsl(168, 55%, 42%)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Consultas"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sem dados no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Serviços mais usados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Serviços Mais Usados</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sem dados de serviços no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={serviceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(160, 20%, 88%)" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Quantidade" radius={[0, 4, 4, 0]}>
                    {serviceData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Faturamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Faturamento Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(160, 20%, 88%)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']} />
                <Bar dataKey="faturamento" name="Faturamento" fill="hsl(168, 55%, 42%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
