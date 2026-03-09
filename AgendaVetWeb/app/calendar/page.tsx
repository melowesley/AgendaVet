'use client'

import { AppLayout } from '@/components/app-layout'
import { CalendarContent } from '@/components/calendar/calendar-content'

export default function CalendarPage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Calendário' }]}>
      <CalendarContent />
    </AppLayout>
  )
}
