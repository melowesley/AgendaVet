'use client'

import { useState } from 'react'
import { CalendarView } from './calendar-view'
import { WeekAppointments } from './week-appointments'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, List, Plus } from 'lucide-react'
import { AppointmentFormDialog } from '@/components/appointments/appointment-form-dialog'
import type { Appointment } from '@/lib/types'

export function CalendarContent() {
  const [selectedWeek, setSelectedWeek] = useState<{ start: Date; end: Date } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  const handleWeekSelect = (weekStart: Date, weekEnd: Date) => {
    setSelectedWeek({ start: weekStart, end: weekEnd })
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingAppointment(null)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendário</h1>
          <p className="text-muted-foreground">Visualize e gerencie sua agenda</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 shadow-lg shadow-emerald-500/25 transition-all">
          <Plus className="size-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      <div className="space-y-6">
        <CalendarView onWeekSelect={handleWeekSelect} selectedWeek={selectedWeek} />
        {selectedWeek && (
          <WeekAppointments weekStart={selectedWeek.start} weekEnd={selectedWeek.end} />
        )}
      </div>

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        appointment={editingAppointment}
      />
    </div>
  )
}
