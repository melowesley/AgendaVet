'use client'

import { AppLayout } from '@/components/app-layout'
import { ProductsServicesContent } from '@/components/products-services/products-services-content'

export default function ProductsServicesPage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Produtos & Serviços' }]}>
      <ProductsServicesContent />
    </AppLayout>
  )
}
