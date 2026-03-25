'use client'

import React from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { TutorSidebar } from '@/components/tutor/tutor-sidebar'
import { TutorHeader } from '@/components/tutor/tutor-header'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface TutorLayoutProps {
  children: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
}

export function TutorLayout({ children, breadcrumbs }: TutorLayoutProps) {
  return (
    <SidebarProvider>
      <TutorSidebar />
      <SidebarInset>
        <TutorHeader breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
