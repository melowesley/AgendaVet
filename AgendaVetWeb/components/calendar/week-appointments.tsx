'use client'

import { useMemo } from 'react'
import { useAppointments, usePets, useOwners } from '@/lib/data-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PawPrint, Clock, Calendar, User, MoreHorizontal } from 'lucide-react'
import { format, eachDayOfInterval, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateAppointment } from '@/lib/data-store'
import type { Appointment } from '@/lib/types'

interface WeekAppointmentsProps {
  weekStart: Date
  weekEnd: Date
}

export function WeekAppointments({ weekStart, weekEnd }: WeekAppointmentsProps) {
  const { appointments, isLoading: appointmentsLoading } = useAppointments()
  const { pets, isLoading: petsLoading } = usePets()
  const { owners, isLoading: ownersLoading } = useOwners()

  const isLoading = appointmentsLoading || petsLoading || ownersLoading

  // Filter appointments for the selected week
  const weekAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date)
      return appointmentDate >= weekStart && appointmentDate <= weekEnd
    }).sort((a, b) => {
      const dateCompare = (a.date || '').localeCompare(b.date || '')
      if (dateCompare !== 0) return dateCompare
      return (a.time || '').localeCompare(b.time || '')
    })
  }, [appointments, weekStart, weekEnd])

  // Group appointments by day
  const appointmentsByDay = useMemo(() => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    return days.map(day => ({
      day,
      appointments: weekAppointments.filter(apt => isSameDay(new Date(apt.date), day))
    }))
  }, [weekStart, weekEnd, weekAppointments])

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

  const handleStatusChange = (id: string, newStatus: string) => {
    updateAppointment(id, { status: newStatus as Appointment['status'] })
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-500" />
          Atendimentos da Semana
          <span className="text-sm font-normal text-muted-foreground">
            {format(weekStart, 'd MMM', { locale: ptBR })} - {format(weekEnd, 'd MMM', { locale: ptBR })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {weekAppointments.length === 0 ? (
          <div className="text-center py-8">
            <PawPrint className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum atendimento agendado nesta semana</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointmentsByDay.map(({ day, appointments: dayAppointments }) => (
              <div key={day.toString()}>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-sm">
                    {format(day, 'EEEE, d MMMM', { locale: ptBR })}
                  </h4>
                  {dayAppointments.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayAppointments.length} atendimento{dayAppointments.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {dayAppointments.length > 0 && (
                  <div className="space-y-2">
                    {dayAppointments.map((appointment) => {
                      const pet = pets.find(p => p.id === appointment.petId)
                      const owner = owners.find(o => o.id === appointment.ownerId)

                      return (
                        <div
                          key={appointment.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/50 p-3.5 transition-all hover:bg-muted/40 hover:border-emerald-500/30 group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 shrink-0 group-hover:bg-emerald-500/20 transition-colors border-2 border-transparent group-hover:border-emerald-500/30">
                              <PawPrint className="size-4 text-emerald-500" />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/pets/${appointment.petId}`}
                                className="font-semibold text-sm truncate group-hover:text-emerald-500 transition-colors hover:underline"
                              >
                                {pet?.name || 'Desconhecido'}
                              </Link>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                                <Clock className="size-3" />
                                {appointment.time}
                                <span>•</span>
                                <User className="size-3" />
                                {owner ? `${owner.firstName} ${owner.lastName}` : 'Tutor não encontrado'}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto ml-12 sm:ml-0">
                            {getAppointmentTypeBadge(appointment.type)}
                            {getStatusBadge(appointment.status)}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">Ações</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                  disabled={appointment.status === 'confirmed'}
                                >
                                  Confirmar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(appointment.id, 'in-progress')}
                                  disabled={appointment.status === 'in-progress'}
                                >
                                  Iniciar Atendimento
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(appointment.id, 'completed')}
                                  disabled={appointment.status === 'completed'}
                                >
                                  Concluir
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                  disabled={appointment.status === 'cancelled'}
                                  className="text-destructive"
                                >
                                  Cancelar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
