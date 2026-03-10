'use client'

import { usePets, useOwners, useAppointments } from '@/lib/data-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PawPrint, Users, Calendar, Clock, CheckCircle, AlertCircle, Search, Plus, FileText } from 'lucide-react'
import Link from 'next/link'

export function DashboardContent() {
  const { pets, isLoading: petsLoading } = usePets()
  const { owners, isLoading: ownersLoading } = useOwners()
  const { appointments, isLoading: appointmentsLoading } = useAppointments()

  const isLoading = petsLoading || ownersLoading || appointmentsLoading

  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter((a) => a.date === today)
  const upcomingAppointments = appointments
    .filter((a) => a.date >= today && a.status !== 'completed' && a.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="p-3 md:p-6 flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Pacientes',
      value: pets.length,
      icon: PawPrint,
      href: '/pets',
    },
    {
      title: 'Tutores',
      value: owners.length,
      icon: Users,
      href: '/owners',
    },
    {
      title: 'Hoje',
      value: todayAppointments.length,
      icon: Calendar,
      href: '/appointments',
    },
    {
      title: 'Pendentes',
      value: appointments.filter((a) => a.status === 'scheduled').length,
      icon: Clock,
      href: '/appointments',
    },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      scheduled: { variant: 'secondary', label: 'Agendado' },
      confirmed: { variant: 'default', label: 'Confirmado' },
      'in-progress': { variant: 'outline', label: 'Em Andamento' },
      completed: { variant: 'secondary', label: 'Concluído' },
      cancelled: { variant: 'destructive', label: 'Cancelado' },
    }
    const config = variants[status] || { variant: 'secondary' as const, label: status }
    return <Badge variant={config.variant} className={status === 'in-progress' ? "border-emerald-500 text-emerald-500" : ""}>{config.label}</Badge>
  }

  const getAppointmentTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      checkup: 'Consulta',
      vaccination: 'Vacina',
      surgery: 'Cirurgia',
      grooming: 'Banho/Tosa',
      emergency: 'Emergência',
      'follow-up': 'Retorno',
    }
    return <Badge variant="outline" className="bg-background/50">{labels[type] || type}</Badge>
  }

  const getPetById = (petId: string) => pets.find((p) => p.id === petId)
  const getOwnerById = (ownerId: string) => owners.find((o) => o.id === ownerId)

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Quick Actions - Mobile First */}
      <div className="grid grid-cols-4 gap-2 md:hidden">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border/50 transition-colors active:bg-muted font-mono">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 mb-1">
                <stat.icon className="size-5 text-emerald-500" />
              </div>
              <span className="text-xs font-medium text-center truncate w-full">{stat.title}</span>
              <span className="text-lg font-bold">{stat.value}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Action Buttons - Mobile */}
      <div className="flex gap-2 md:hidden">
        <Button asChild className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20">
          <Link href="/appointments">
            <Plus className="size-4 mr-2" />
            Novo Agendamento
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 h-12 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
          <Link href="/assistant">
            <Search className="size-4 mr-2" />
            Buscar Info
          </Link>
        </Button>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-balance">Visão Geral</h1>
            <p className="text-muted-foreground">Bem-vindo de volta! Aqui está o panorama da sua clínica.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 border-0 hover:from-emerald-400 hover:to-teal-400 transition-all">
              <Link href="/appointments">
                <Plus className="size-4 mr-2" />
                Novo Agendamento
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-border/50 bg-transparent hover:bg-muted/50 dark:hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all">
              <Link href="/assistant">
                <Search className="size-4 mr-2" />
                Buscar Info
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Stats */}
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-all hover:bg-muted/30 cursor-pointer border-border/50 bg-card/40 backdrop-blur-sm group hover:border-emerald-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground group-hover:text-foreground transition-colors">{stat.title}</CardTitle>
                <div className="p-2 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                  <stat.icon className="size-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono group-hover:text-emerald-500 transition-colors">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-3 border-b border-border/30 mb-4">
            <div className="flex items-center justify-between mt-1">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Calendar className="size-5 text-emerald-500" />
                Agendamentos
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-emerald-500">
                <Link href="/appointments">Ver Todos</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10 rounded-xl border border-dashed border-border/50">
                <CheckCircle className="size-10 text-emerald-500/50 mb-3" />
                <p className="text-sm font-medium">Tudo livre por enquanto</p>
                <p className="text-xs text-muted-foreground mt-1">Você não possui agendamentos hoje.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 4).map((appointment) => {
                  const pet = getPetById(appointment.petId)
                  return (
                    <Link
                      key={appointment.id}
                      href="/appointments"
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/50 p-3.5 transition-all hover:bg-muted/40 hover:border-emerald-500/30 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 shrink-0 group-hover:bg-emerald-500/20 transition-colors border-2 border-transparent group-hover:border-emerald-500/30">
                          <PawPrint className="size-4 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate group-hover:text-emerald-500 transition-colors">{pet?.name || 'Vazio/Inconsistente'}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                            <Clock className="size-3" />
                            {new Date(appointment.date).toLocaleDateString('pt-BR', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            às {appointment.time}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto ml-12 sm:ml-0">
                        {getAppointmentTypeBadge(appointment.type)}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-3 border-b border-border/30 mb-4">
            <div className="flex items-center justify-between mt-1">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <FileText className="size-5 text-emerald-500" />
                Pacientes Recentes
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-emerald-500">
                <Link href="/pets">Ver Todos</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {pets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertCircle className="size-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum paciente cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pets.slice(0, 4).map((pet) => {
                  const owner = pet.ownerId ? getOwnerById(pet.ownerId) : null
                  return (
                    <Link
                      key={pet.id}
                      href={`/pets/${pet.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3 transition-all hover:bg-muted/40 hover:border-emerald-500/30 group"
                    >
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-background shadow-sm transition-colors group-hover:border-emerald-500/50 ${pet.species === 'dog' ? 'border-emerald-500/30 text-emerald-500' :
                        pet.species === 'cat' ? 'border-indigo-500/30 text-indigo-500' :
                          'border-orange-500/30 text-orange-500'
                        }`}>
                        {pet.species === 'dog' || pet.species === 'cat' ? <PawPrint className="size-4" /> : <span className="font-bold text-xs uppercase">{pet.name.charAt(0)}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-emerald-500 transition-colors">{pet.name}</p>
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {pet.breed} • {owner ? `${owner.firstName} ${owner.lastName[0]}.` : 'Desconhecido'}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px] uppercase bg-background/50">
                        {pet.species}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
