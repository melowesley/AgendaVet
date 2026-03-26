'use client'

import { useState } from 'react'
import { WeeklyCalendarView } from './weekly-calendar-view'
import { AppointmentFormDialog } from '@/components/appointments/appointment-form-dialog'
import type { Appointment } from '@/lib/types'

export function CalendarContent() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [veterinarian, setVeterinarian] = useState('Todos os Veterinários')
  const [room, setRoom] = useState('Todas as Salas')
  const [occupancy, setOccupancy] = useState(78)

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingAppointment(null)
  }

  const handleAddClick = () => {
    setEditingAppointment(null)
    setDialogOpen(true)
  }

  return (
    <div className="p-4 md:p-6">
      <WeeklyCalendarView
        appointments={appointments}
        onAddClick={handleAddClick}
        veterinarian={veterinarian}
        room={room}
        occupancy={occupancy}
      />

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        appointment={editingAppointment}
      />
    </div>
  )
}
