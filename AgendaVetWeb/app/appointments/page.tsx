'use client'

import { AppLayout } from '@/components/app-layout'
import { AppointmentsContent } from '@/components/appointments/appointments-content'

export default function AppointmentsPage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Agenda' }]}>
      <AppointmentsContent />
    </AppLayout>
  )
}
