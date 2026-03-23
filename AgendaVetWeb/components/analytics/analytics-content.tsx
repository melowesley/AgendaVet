'use client'

import { useMemo, useState } from 'react'
import { usePets, useOwners, useAppointments } from '@/lib/data-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  PawPrint, Users, Calendar, TrendingUp, DollarSign,
  BarChart3, PieChart as PieChartIcon, Activity, ArrowUpRight, ArrowDownRight,
  Download, Filter
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts'
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function AnalyticsContent() {
  const { pets, isLoading: petsLoading, error: petsError } = usePets()
  const { owners, isLoading: ownersLoading, error: ownersError } = useOwners()
  const { appointments, isLoading: appointmentsLoading, error: appointmentsError } = useAppointments()
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  const isLoading = petsLoading || ownersLoading || appointmentsLoading
  const loadError = petsError || ownersError || appointmentsError

  // NOTE: These are estimated prices used for revenue projections only.
  // They do not reflect actual prices charged. Update to use real prices from
  // the services/products table when available.
  const SERVICE_PRICE_ESTIMATES: Record<string, number> = {
    checkup: 150,
    vaccination: 80,
    surgery: 500,
  }
  const DEFAULT_PRICE_ESTIMATE = 120

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const startDate = subDays(new Date(), periodDays)

  const filteredAppointments = useMemo(() =>
    appointments.filter(a => {
      try {
        const d = parseISO(a.date)
        return d >= startDate
      } catch { return false }
    }),
    [appointments, startDate]
  )

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredAppointments.forEach(a => {
      const label = a.status === 'completed' ? 'Concluído'
        : a.status === 'confirmed' ? 'Confirmado'
        : a.status === 'cancelled' ? 'Cancelado'
        : 'Agendado'
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredAppointments])

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredAppointments.forEach(a => {
      const label = a.type === 'vaccination' ? 'Vacina'
        : a.type === 'surgery' ? 'Cirurgia'
        : a.type === 'checkup' ? 'Consulta'
        : a.type || 'Outro'
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredAppointments])

  const dailyData = useMemo(() => {
    const map: Record<string, number> = {}
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      map[d] = 0
    }
    filteredAppointments.forEach(a => {
      if (map[a.date] !== undefined) map[a.date]++
    })
    const entries = Object.entries(map)
    if (period === '90d') {
      const weekly: { date: string; consultas: number }[] = []
      for (let i = 0; i < entries.length; i += 7) {
        const chunk = entries.slice(i, i + 7)
        const total = chunk.reduce((s, [, v]) => s + v, 0)
        weekly.push({ date: format(parseISO(chunk[0][0]), 'dd/MM'), consultas: total })
      }
      return weekly
    }
    return entries.map(([d, v]) => ({
      date: format(parseISO(d), period === '7d' ? 'EEE' : 'dd/MM', { locale: ptBR }),
      consultas: v,
    }))
  }, [filteredAppointments, periodDays, period])

  const revenueData = useMemo(() => {
    const monthStart = startOfMonth(new Date())
    const monthEnd = endOfMonth(new Date())
    const prevMonthStart = startOfMonth(subDays(monthStart, 1))
    const prevMonthEnd = endOfMonth(subDays(monthStart, 1))

    let currentRevenue = 0
    let prevRevenue = 0

    appointments.forEach(a => {
      if (a.status !== 'completed' && a.status !== 'confirmed') return
      const price = SERVICE_PRICE_ESTIMATES[a.type] ?? DEFAULT_PRICE_ESTIMATE
      try {
        const d = parseISO(a.date)
        if (isWithinInterval(d, { start: monthStart, end: monthEnd })) currentRevenue += price
        if (isWithinInterval(d, { start: prevMonthStart, end: prevMonthEnd })) prevRevenue += price
      } catch {}
    })

    const change = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0

    return { currentRevenue, prevRevenue, change }
  }, [appointments])

  const completedCount = filteredAppointments.filter(a => a.status === 'completed').length
  const cancelledCount = filteredAppointments.filter(a => a.status === 'cancelled').length
  const completionRate = filteredAppointments.length > 0
    ? Math.round((completedCount / filteredAppointments.length) * 100) : 0

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="p-4 rounded-full bg-red-500/10 mb-4">
          <Activity className="size-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar dados</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Não foi possível carregar os dados de analytics. Verifique sua conexão e tente novamente.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-primary underline underline-offset-2"
        >
          Recarregar
        </button>
      </div>
    )
  }

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="p-3 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics & Faturamento</h1>
          <p className="text-muted-foreground">Visão geral do desempenho da clínica</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueData.currentRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {revenueData.change >= 0
                ? <><ArrowUpRight className="h-3 w-3 text-emerald-500" /><span className="text-emerald-500">+{revenueData.change.toFixed(1)}%</span></>
                : <><ArrowDownRight className="h-3 w-3 text-red-500" /><span className="text-red-500">{revenueData.change.toFixed(1)}%</span></>
              }
              {' '}vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas no Período</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAppointments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{completedCount} concluídas, {cancelledCount} canceladas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completionRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes / Tutores</CardTitle>
            <PawPrint className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pets.length} / {owners.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total cadastrado</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="finance">Faturamento</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Consultas por Período</CardTitle>
                <CardDescription>Fluxo de atendimentos nos últimos {periodDays} dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="consultas" stroke="#10b981" fill="url(#colorConsultas)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição por Status</CardTitle>
                <CardDescription>Status dos agendamentos no período</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Evolução da Receita</CardTitle>
                <CardDescription>Receita estimada baseada nos atendimentos concluídos/confirmados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="consultas" fill="#10b981" radius={[4, 4, 0, 0]} name="Atendimentos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Receita do mês atual</p>
                  <p className="text-2xl font-bold text-emerald-500">{formatCurrency(revenueData.currentRevenue)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Receita do mês anterior</p>
                  <p className="text-xl font-semibold">{formatCurrency(revenueData.prevRevenue)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Ticket médio</p>
                  <p className="text-xl font-semibold">
                    {completedCount > 0 ? formatCurrency(revenueData.currentRevenue / completedCount) : 'R$ 0,00'}
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Valores estimados. Configure os preços reais na tela de Produtos & Serviços.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Serviços Mais Realizados</CardTitle>
              <CardDescription>Distribuição por tipo de serviço no período</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" name="Qtd" radius={[0, 4, 4, 0]}>
                    {typeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
