'use client'

import { useEffect, useState } from 'react'
import { TutorLayout } from '@/components/tutor/tutor-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { PawPrint, Calendar, DollarSign, MessageSquare, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalPets: number
  upcomingAppointments: number
  pendingPayments: number
}

interface RecentAppointment {
  id: string
  service_type: string
  scheduled_date: string
  status: string
  pets?: { name: string } | null
}

export default function TutorDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({ totalPets: 0, upcomingAppointments: 0, pendingPayments: 0 })
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [tutorName, setTutorName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/tutor/login')
        return
      }

      const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Tutor'
      setTutorName(name)

      const userId = session.user.id

      // Buscar pets do tutor
      const { data: pets } = await supabase
        .from('pets')
        .select('id')
        .eq('owner_id', userId)

      // Buscar agendamentos futuros
      const { data: appointments } = await supabase
        .from('appointment_requests')
        .select('id, service_type, scheduled_date, status, pets(name)')
        .eq('owner_id', userId)
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(5)

      // Buscar pendências financeiras
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('owner_id', userId)
        .eq('status', 'pending')

      setStats({
        totalPets: pets?.length || 0,
        upcomingAppointments: appointments?.length || 0,
        pendingPayments: invoices?.length || 0,
      })

      setRecentAppointments((appointments || []) as RecentAppointment[])
      setLoading(false)
    }

    fetchData()
  }, [router])

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      confirmed: { label: 'Confirmado', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
      pending: { label: 'Pendente', className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30' },
      cancelled: { label: 'Cancelado', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
      completed: { label: 'Concluído', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
    }
    const s = map[status] || { label: status, className: 'bg-muted text-muted-foreground' }
    return <Badge variant="outline" className={`text-xs ${s.className}`}>{s.label}</Badge>
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <TutorLayout breadcrumbs={[{ label: 'Início' }]}>
      <div className="p-4 md:p-6 space-y-6">

        {/* Saudação */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {greeting}, {tutorName.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Aqui está um resumo da sua conta</p>
          </div>
          <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white w-fit">
            <Link href="/tutor/agendamentos">
              <Plus className="size-4 mr-2" />
              Novo Agendamento
            </Link>
          </Button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PawPrint className="size-4 text-emerald-500" />
                Meus Pets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{loading ? '—' : stats.totalPets}</p>
              <Link href="/tutor/pets" className="text-xs text-emerald-500 hover:underline mt-1 block">
                Ver todos →
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="size-4 text-emerald-500" />
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{loading ? '—' : stats.upcomingAppointments}</p>
              <Link href="/tutor/agendamentos" className="text-xs text-emerald-500 hover:underline mt-1 block">
                Ver agenda →
              </Link>
            </CardContent>
          </Card>

          <Card className={`border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow ${stats.pendingPayments > 0 ? 'border-yellow-500/30' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="size-4 text-emerald-500" />
                Pagamentos Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${stats.pendingPayments > 0 ? 'text-yellow-500' : 'text-foreground'}`}>
                {loading ? '—' : stats.pendingPayments}
              </p>
              <Link href="/tutor/financeiro" className="text-xs text-emerald-500 hover:underline mt-1 block">
                Ver financeiro →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Próximos agendamentos */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Próximos Agendamentos</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 text-xs">
              <Link href="/tutor/agendamentos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-muted/40 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="size-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum agendamento futuro</p>
                <Button asChild variant="outline" size="sm" className="mt-3 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
                  <Link href="/tutor/agendamentos">
                    <Plus className="size-3 mr-1" />
                    Agendar agora
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
                        <Clock className="size-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{apt.service_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {apt.pets?.name || 'Pet'} · {formatDate(apt.scheduled_date)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(apt.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atalho para Chat IA */}
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 backdrop-blur-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                <MessageSquare className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Chat IA AgendaVet</p>
                <p className="text-xs text-muted-foreground">Tire dúvidas sobre a saúde do seu pet</p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Link href="/tutor/chat">Conversar</Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </TutorLayout>
  )
}
