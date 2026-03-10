'use client'

import { useState } from 'react'
import { useAppointments, usePets, useOwners, updateAppointment, deleteAppointment } from '@/lib/data-store'
import type { Appointment } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Check,
  X,
  Clock,
  Play,
  List,
  CalendarDays,
} from 'lucide-react'
import Link from 'next/link'
import { AppointmentFormDialog } from './appointment-form-dialog'
import { CalendarView } from '@/components/calendar/calendar-view'
import { WeekAppointments } from '@/components/calendar/week-appointments'

type StatusFilter = Appointment['status'] | 'all'
type TypeFilter = Appointment['type'] | 'all'

export function AppointmentsContent() {
  const { appointments, isLoading: appointmentsLoading } = useAppointments()
  const { pets, isLoading: petsLoading } = usePets()
  const { owners, isLoading: ownersLoading } = useOwners()
  const isLoading = appointmentsLoading || petsLoading || ownersLoading
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedWeek, setSelectedWeek] = useState<{ start: Date; end: Date } | null>(null)
  const [selectedDateForNew, setSelectedDateForNew] = useState<Date | undefined>(undefined)

  const getPetName = (petId: string) => pets.find((p) => p.id === petId)?.name || 'Unknown'
  const getOwnerName = (ownerId: string) => {
    const owner = owners.find((o) => o.id === ownerId)
    return owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown'
  }

  const filteredAppointments = appointments
    .filter((apt) => {
      const matchesStatus = statusFilter === 'all' || apt.status === statusFilter
      const matchesType = typeFilter === 'all' || apt.type === typeFilter
      return matchesStatus && matchesType
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Todos Status' },
    { value: 'scheduled', label: 'Agendado' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'in-progress', label: 'Em Andamento' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' },
  ]

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'Todos Tipos' },
    { value: 'checkup', label: 'Consulta' },
    { value: 'vaccination', label: 'Vacinação' },
    { value: 'surgery', label: 'Cirurgia' },
    { value: 'grooming', label: 'Banho e Tosa' },
    { value: 'emergency', label: 'Emergência' },
    { value: 'follow-up', label: 'Retorno' },
  ]

  const getStatusBadge = (status: Appointment['status']) => {
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

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setDialogOpen(true)
  }

  const handleStatusChange = (id: string, status: Appointment['status']) => {
    updateAppointment(id, { status })
  }

  const confirmDelete = () => {
    if (deletingAppointment) {
      deleteAppointment(deletingAppointment.id)
      setDeletingAppointment(null)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingAppointment(null)
    setSelectedDateForNew(undefined)
  }

  const handleDayDoubleClick = (day: Date) => {
    setSelectedDateForNew(day)
    setEditingAppointment(null)
    setDialogOpen(true)
  }

  const handleWeekSelect = (weekStart: Date, weekEnd: Date) => {
    setSelectedWeek({ start: weekStart, end: weekEnd })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const typeLabels: Record<string, string> = {
    checkup: 'Consulta',
    vaccination: 'Vacinação',
    surgery: 'Cirurgia',
    grooming: 'Banho e Tosa',
    emergency: 'Emergência',
    'follow-up': 'Retorno',
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">Agende e gerencie seus compromissos</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border/50 bg-background p-1">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="h-8 px-3"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendário
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 shadow-lg shadow-emerald-500/25 transition-all">
            <Plus className="size-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="space-y-6">
          <CalendarView
            onWeekSelect={handleWeekSelect}
            selectedWeek={selectedWeek}
            onDayDoubleClick={handleDayDoubleClick}
          />
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Cronograma de Atendimentos</CardTitle>
                <CardDescription>{filteredAppointments.length} agendamentos encontrados</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex gap-1 flex-wrap">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setStatusFilter(option.value === statusFilter ? 'all' : option.value)
                      }
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${statusFilter === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap mt-2">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTypeFilter(option.value === typeFilter ? 'all' : option.value)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${typeFilter === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="size-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Nenhum agendamento encontrado</h3>
                <p className="text-muted-foreground">
                  {statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Tente ajustar seus filtros'
                    : 'Agende seu primeiro atendimento'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data e Hora</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead className="hidden sm:table-cell">Tutor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="hidden md:table-cell">Veterinário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {new Date(apt.date).toLocaleDateString('pt-BR', {
                                month: 'short',
                                day: 'numeric',
                                weekday: 'short',
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground font-mono">{apt.time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/pets/${apt.petId}`}
                            className="font-medium hover:text-emerald-500 transition-colors"
                          >
                            {getPetName(apt.petId)}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Link
                            href={`/owners/${apt.ownerId}`}
                            className="hover:text-emerald-500 transition-colors"
                          >
                            {getOwnerName(apt.ownerId)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-background/50">
                            {typeLabels[apt.type] || apt.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{apt.veterinarian}</TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Ações</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(apt)}>
                                <Edit className="size-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(apt.id, 'confirmed')}
                                disabled={apt.status === 'confirmed'}
                              >
                                <Check className="size-4 mr-2" />
                                Confirmar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(apt.id, 'in-progress')}
                                disabled={apt.status === 'in-progress'}
                              >
                                <Play className="size-4 mr-2" />
                                Iniciar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(apt.id, 'completed')}
                                disabled={apt.status === 'completed'}
                              >
                                <Clock className="size-4 mr-2" />
                                Concluir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                disabled={apt.status === 'cancelled'}
                              >
                                <X className="size-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingAppointment(apt)}
                                className="text-destructive"
                              >
                                <Trash2 className="size-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        appointment={editingAppointment}
        initialDate={selectedDateForNew}
      />

      <AlertDialog open={!!deletingAppointment} onOpenChange={() => setDeletingAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
