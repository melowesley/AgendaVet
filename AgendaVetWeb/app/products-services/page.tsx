'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { ProductsServicesContent } from '@/components/products-services/products-services-content'
import { ProductsContent } from '@/components/products-services/products-content'
import { Stethoscope, Package } from 'lucide-react'

type Tab = 'servicos' | 'produtos'

export default function ProductsServicesPage() {
  const [tab, setTab] = useState<Tab>('servicos')

  return (
    <AppLayout breadcrumbs={[{ label: 'Produtos & Serviços' }]}>
      <div className="px-4 md:px-6 pt-4 pb-2">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl w-fit border border-border/40">
          <button
            onClick={() => setTab('servicos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'servicos'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Stethoscope className="size-4" />
            Serviços
          </button>
          <button
            onClick={() => setTab('produtos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'produtos'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="size-4" />
            Produtos
          </button>
        </div>
      </div>

      {tab === 'servicos' ? (
        <ProductsServicesContent />
      ) : (
        <div className="px-4 md:px-6 pb-6">
          <ProductsContent />
        </div>
      )}
    </AppLayout>
  )
}
