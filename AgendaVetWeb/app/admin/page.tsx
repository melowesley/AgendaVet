'use client'

import { AppLayout } from '@/components/app-layout'
import { AdminDashboard } from '@/components/admin-panel/admin-dashboard'

export default function AdminPage() {
  return (
    <AppLayout>
      <AdminDashboard />
    </AppLayout>
  )
}
