'use client'

import { AppLayout } from '@/components/app-layout'
import { MedicalRecordsContent } from '@/components/medical-records/medical-records-content'

export default function MedicalRecordsPage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Prontuários' }]}>
      <MedicalRecordsContent />
    </AppLayout>
  )
}
