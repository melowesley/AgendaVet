'use client'

import { useState, useMemo } from 'react'
import { useAppointments, usePets } from '@/lib/data-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, PawPrint } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CalendarViewProps {
  onWeekSelect?: (weekStart: Date, weekEnd: Date) => void
  selectedWeek?: { start: Date; end: Date } | null
  onDayDoubleClick?: (day: Date) => void
}

export function CalendarView({ onWeekSelect, selectedWeek, onDayDoubleClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { appointments, isLoading: appointmentsLoading } = useAppointments()
  const { pets, isLoading: petsLoading } = usePets()

  const isLoading = appointmentsLoading || petsLoading

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday as first day
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: startDate, end: endDate })
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
    return grouped
  }, [appointments])

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return appointmentsByDate[dateStr] || []
  }

  // Handle month navigation
  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  // Handle week selection
  const handleWeekClick = (weekStart: Date) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    onWeekSelect?.(weekStart, weekEnd)
  }

  // Get week number for a day
  const getWeekNumber = (day: Date) => {
    const start = startOfWeek(day, { weekStartsOn: 0 })
    return Math.ceil((day.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
  }

  // Check if a day is in the selected week
  const isDayInSelectedWeek = (day: Date) => {
    if (!selectedWeek) return false
    return day >= selectedWeek.start && day <= selectedWeek.end
  }

  // Week day labels
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
    <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousMonth}
            className="h-8 w-8 p-0 hover:bg-emerald-500/10 hover:text-emerald-500"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0 hover:bg-emerald-500/10 hover:text-emerald-500"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isCurrentDay = isToday(day)
            const isInSelectedWeek = isDayInSelectedWeek(day)
            const weekStart = startOfWeek(day, { weekStartsOn: 0 })
            const isFirstDayOfWeek = index % 7 === 0

            return (
              <div
                key={day.toString()}
                className={`
                  relative min-h-[60px] sm:min-h-[80px] p-1 border rounded-lg transition-all cursor-pointer
                  ${!isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : 'bg-background'}
                  ${isCurrentDay ? 'border-emerald-500 bg-emerald-500/5' : 'border-border/30'}
                  ${isInSelectedWeek ? 'border-emerald-500 bg-emerald-500/10' : ''}
                  ${isFirstDayOfWeek ? 'hover:border-emerald-500/50' : ''}
                  hover:bg-muted/30
                `}
                onClick={() => handleWeekClick(weekStart)}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  onDayDoubleClick?.(day)
                }}
              >
                {/* Day number */}
                <div className={`
                  text-sm font-medium mb-1
                  ${isCurrentDay ? 'text-emerald-500' : ''}
                  ${!isCurrentMonth ? 'text-muted-foreground' : ''}
                `}>
                  {format(day, 'd')}
                </div>

                {/* Appointments indicator */}
                {dayAppointments.length > 0 && (
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 2).map((appointment, idx) => {
                      const pet = pets.find(p => p.id === appointment.petId)
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-center gap-1 text-xs p-1 rounded bg-emerald-500/10 border border-emerald-500/20"
                        >
                          <PawPrint className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="truncate font-medium">
                            {pet?.name || 'Desconhecido'}
                          </span>
                        </div>
                      )
                    })}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayAppointments.length - 2}
                      </div>
                    )}
                  </div>
                )}

                {/* Week indicator for first day of week */}
                {isFirstDayOfWeek && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500/30"></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500/30"></div>
            <span>Clique (1x) na semana p/ ver detalhes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-dashed border-emerald-500/50 bg-transparent rounded-sm"></div>
            <span>Clique (2x) no dia p/ agendar</span>
          </div>
          <div className="flex items-center gap-1">
            <PawPrint className="h-3 w-3 text-emerald-500" />
            <span>Atendimentos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
