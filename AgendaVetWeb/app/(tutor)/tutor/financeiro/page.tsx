'use client'

import { useEffect, useState } from 'react'
import { TutorLayout } from '@/components/tutor/tutor-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, Search, AlertCircle, CheckCircle2, Clock, TrendingDown, Receipt } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Invoice {
  id: string
  description: string | null
  amount: number
  status: string
  due_date: string | null
  paid_at: string | null
  created_at: string
  service_type: string | null
}

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: 'Pago', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  pending: { label: 'Pendente', className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30' },
  overdue: { label: 'Vencido', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
  cancelled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
}

export default function TutorFinanceiroPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/tutor/login'); return }

      const { data } = await supabase
        .from('invoices')
        .select('id, description, amount, status, due_date, paid_at, created_at, service_type')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })

      setInvoices(data || [])
      setLoading(false)
    }
    init()
  }, [router])

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const totalPending = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)

  const filtered = invoices.filter(inv => {
    const matchSearch = (inv.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.service_type || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <TutorLayout breadcrumbs={[{ label: 'Financeiro' }]}>
      <div className="p-4 md:p-6 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Seu histórico de cobranças e pagamentos</p>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className={`border-border/50 bg-card/50 ${totalPending > 0 ? 'border-yellow-500/30' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="size-4 text-yellow-500" />
                Pendente / Em Aberto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${totalPending > 0 ? 'text-yellow-500' : 'text-foreground'}`}>
                {loading ? '—' : formatCurrency(totalPending)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {invoices.filter(i => i.status === 'pending' || i.status === 'overdue').length} fatura(s)
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Total Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-500">
                {loading ? '—' : formatCurrency(totalPaid)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {invoices.filter(i => i.status === 'paid').length} pagamento(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar faturas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-muted/30 border-border/50 focus-visible:ring-emerald-500"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 bg-muted/30 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de faturas */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/40 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="size-12 text-muted-foreground/30 mb-4" />
              <p className="font-semibold text-muted-foreground">Nenhuma fatura encontrada</p>
              <p className="text-xs text-muted-foreground mt-1">As cobranças da clínica aparecerão aqui</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(inv => {
              const status = statusConfig[inv.status] || statusConfig.pending
              return (
                <div key={inv.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
                      <DollarSign className="size-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{inv.description || inv.service_type || 'Serviço veterinário'}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {inv.due_date ? `Vence: ${formatDate(inv.due_date)}` : formatDate(inv.created_at)}
                        </p>
                        {inv.paid_at && (
                          <p className="text-xs text-emerald-500">
                            Pago: {formatDate(inv.paid_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 ml-2 shrink-0">
                    <p className="font-semibold text-sm">{formatCurrency(inv.amount)}</p>
                    <Badge variant="outline" className={`text-xs ${status.className}`}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </TutorLayout>
  )
}
