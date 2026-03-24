'use client'

import { AppLayout } from '@/components/app-layout'
import { FinanceiroContent } from '@/components/financeiro/financeiro-content'

export default function FinanceiroPage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Financeiro' }]}>
      <FinanceiroContent />
    </AppLayout>
  )
}
