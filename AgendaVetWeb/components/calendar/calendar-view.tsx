'use client'

import { useState, useMemo } from 'react'
import { useAppointments, usePets, useOwners } from '@/lib/data-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, PawPrint, CheckCircle2, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface CalendarViewProps {
  onWeekSelect?: (weekStart: Date, weekEnd: Date) => void
  selectedWeek?: { start: Date; end: Date } | null
  onDayDoubleClick?: (day: Date) => void
}

export function CalendarView({ onWeekSelect, selectedWeek, onDayDoubleClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDayForDetails, setSelectedDayForDetails] = useState<Date | null>(null)

  const { appointments, isLoading: appointmentsLoading } = useAppointments()
  const { pets, isLoading: petsLoading } = usePets()
  const { owners, isLoading: ownersLoading } = useOwners()

  const isLoading = appointmentsLoading || petsLoading || ownersLoading

  // Calculate calendar days nested in weeks
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const chunks = []
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7))
    }
    return chunks
  }, [currentMonth])

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, typeof appointments> = {}
    appointments.forEach(appointment => {
      const date = appointment.date
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(appointment)
    })

    // Sort arrays inside grouped by time ensuring safe comparisons
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    })

    return grouped
  }, [appointments])

  const getAppointmentsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return appointmentsByDate[dateStr] || []
  }

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const handleDayClick = (day: Date) => {
    if (selectedDayForDetails && isSameDay(selectedDayForDetails, day)) {
      setSelectedDayForDetails(null)
    } else {
      setSelectedDayForDetails(day)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500'
      case 'cancelled': return 'bg-red-500'
      case 'no_show': return 'bg-orange-500'
      default: return 'bg-blue-500'
    }
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-sm">
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold capitalize text-slate-700 dark:text-slate-200">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2 border-b border-border/50 pb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-bold text-slate-900 dark:text-slate-300">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex flex-col gap-1 overflow-visible">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="relative flex flex-col">
              <div className="grid grid-cols-7 gap-1 z-10">
                {week.map((day) => {
                  const dayAppointments = getAppointmentsForDay(day)
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isCurrentDay = isToday(day)
                  const isSelected = selectedDayForDetails && isSameDay(day, selectedDayForDetails)

                  return (
                    <div
                      key={day.toString()}
                      className={`
                        relative min-h-[80px] sm:min-h-[100px] p-2 border transition-all cursor-pointer rounded-sm
                        ${!isCurrentMonth ? 'bg-muted/10 text-muted-foreground/50 border-transparent' : 'bg-background border-border/40 hover:border-slate-300'}
                        ${isCurrentDay && !isSelected ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : ''}
                        ${isSelected ? 'bg-slate-100 dark:bg-slate-800 border-emerald-400 shadow-md ring-1 ring-emerald-400' : ''}
                      `}
                      onClick={() => handleDayClick(day)}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        onDayDoubleClick?.(day)
                      }}
                    >
                      {/* Day number */}
                      <div className={`
                        text-sm font-medium mb-2 w-6 h-6 flex items-center justify-center rounded-full
                        ${isCurrentDay ? 'bg-emerald-600 text-white' : ''}
                        ${isSelected && !isCurrentDay ? 'text-emerald-700 font-bold' : ''}
                      `}>
                        {format(day, 'd')}
                      </div>

                      {/* Appointments indicator dots */}
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {dayAppointments.slice(0, 12).map((apt) => (
                          <div
                            key={apt.id}
                            className={`w-2.5 h-2.5 rounded-full shadow-sm ${getStatusColor(apt.status)}`}
                            title={`${apt.time} - ${apt.type}`}
                          />
                        ))}
                        {dayAppointments.length > 12 && (
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" title={`+${dayAppointments.length - 12} mais`} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Floating Details Panel for Selected Day */}
              {selectedDayForDetails && week.some(d => isSameDay(d, selectedDayForDetails)) && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-[#374151] border border-emerald-500/40 text-white rounded-xl p-4 shadow-2xl z-50 backdrop-blur-sm"
                  style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)' }}>
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="size-4 text-emerald-400" />
                      <h4 className="font-semibold text-emerald-50 capitalize">
                        {format(selectedDayForDetails, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </h4>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedDayForDetails(null) }}
                      className="text-white/40 hover:text-white/80 transition-colors rounded-full p-0.5 hover:bg-white/10"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {getAppointmentsForDay(selectedDayForDetails).length === 0 ? (
                      <p className="text-slate-300 text-sm py-4 text-center">Sem agendamentos neste dia</p>
                    ) : (
                      getAppointmentsForDay(selectedDayForDetails).map(apt => {
                        const pet = pets.find(p => p.id === apt.petId)
                        const owner = owners.find(o => o.id === pet?.profileId)
                        return (
                          <div key={apt.id} className="flex items-center gap-3 text-sm hover:bg-white/10 p-2 rounded transition-colors group cursor-pointer" onClick={() => {
                            // Can add details linking later
                          }}>
                            <div className={`w-3 h-3 rounded-full border border-white/20 shadow-sm ${getStatusColor(apt.status)}`} />
                            <span className="font-mono text-emerald-200 font-bold">{apt.time || 'HH:mm'}</span>
                            <span className="font-medium truncate border-l border-white/30 pl-3 ml-2 flex items-center flex-wrap gap-1.5 flex-1">
                              <Link
                                href={`/owners/${owner?.id}`}
                                className="text-emerald-50 hover:text-emerald-300 hover:underline transition-colors font-semibold shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {owner?.fullName || 'Tutor Desconhecido'}
                              </Link>
                              <span className="text-white/40">|</span>
                              <Link
                                href={`/pets/${pet?.id}`}
                                className="text-emerald-300 hover:text-emerald-400 hover:underline transition-colors font-bold shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {pet?.name || 'Pet'}
                              </Link>
                              <span className="text-white/40 mx-1">|</span>
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide bg-emerald-500/20 text-emerald-50 px-2 py-0.5 rounded border border-emerald-500/30">
                                <CheckCircle2 className="size-3 text-emerald-400" />
                                {apt.veterinarian || apt.type}
                              </span>
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 p-3 bg-muted/30 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
            <span>Agendado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
            <span>Cancelado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div>
            <span>Faltou</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 border-l border-border/50 pl-4 ml-2">
            <span>Dica: 1 clique para ver detalhes | 2 cliques no quadrado para novo agendamento</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
