'use client'

import { useState, useEffect } from 'react'
import { WeeklyCalendarView } from './weekly-calendar-view'
import { AppointmentFormDialog } from '@/components/appointments/appointment-form-dialog'
import { createClient } from '@/lib/supabase/client'
import type { CalendarAppointment } from './event-card'

export function CalendarContent() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [veterinarian] = useState('Todos os Veterinários')
  const [room] = useState('Todas as Salas')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // A tabela `appointments` existe no DB mas pode não estar nos tipos gerados.
      // Usamos `as any` para contornar enquanto os tipos não são regenerados.
      const { data, error } = await (supabase as any)
        .from('appointments')
        .select('id, pet_name, pet_breed, veterinarian_name, type, start_time, end_time, room, status, notes, owner_name')
        .gte('start_time', new Date().toISOString())
        .lte('start_time', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('start_time', { ascending: true })

      if (error) throw error
      setAppointments((data as CalendarAppointment[]) || [])
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    fetchAppointments()
  }

  const handleAddClick = () => {
    setDialogOpen(true)
  }

  const occupancy = appointments.length > 0
    ? Math.min(Math.round((appointments.length / 40) * 100), 100)
    : 0

  return (
    <div className="p-4 md:p-6">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-slate-600">Carregando agenda...</p>
          </div>
        </div>
      ) : (
        <WeeklyCalendarView
          appointments={appointments}
          onAddClick={handleAddClick}
          veterinarian={veterinarian}
          room={room}
          occupancy={occupancy}
        />
      )}

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        appointment={null}
      />
    </div>
  )
}
