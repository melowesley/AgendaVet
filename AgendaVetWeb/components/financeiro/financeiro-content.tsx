'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/data-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DollarSign, Plus, TrendingUp, TrendingDown, Clock,
  ArrowUpRight, ArrowDownRight, Edit2, Trash2, Search
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from '@/components/ui/use-toast'

interface FinancialRecord {
  id: string
  type: 'receita' | 'despesa'
  category: string
  description?: string
  amount: number
  payment_method?: string
  status: 'pendente' | 'pago' | 'cancelado'
  due_date?: string
  paid_at?: string
  notes?: string
  created_at: string
}

const CATEGORIES = ['consulta', 'vacina', 'cirurgia', 'exame', 'produto', 'salario', 'aluguel', 'material', 'outro']
const PAYMENT_METHODS = ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'outro']
const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro', cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito',
  pix: 'PIX', transferencia: 'Transferência', outro: 'Outro'
}
const STATUS_COLORS: Record<string, string> = {
  pago: 'bg-emerald-100 text-emerald-700',
  pendente: 'bg-amber-100 text-amber-700',
  cancelado: 'bg-red-100 text-red-700',
}

const emptyForm = {
  type: 'receita' as 'receita' | 'despesa',
  category: 'consulta',
  description: '',
  amount: '',
  payment_method: 'pix',
  status: 'pago' as 'pago' | 'pendente' | 'cancelado',
  due_date: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
}

export function FinanceiroContent() {
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'todos' | 'receita' | 'despesa'>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FinancialRecord | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchRecords() }, [])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('financial_records' as any)
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setRecords((data || []) as FinancialRecord[])
    } catch (err) {
      console.error('Erro ao carregar registros:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = (record?: FinancialRecord) => {
    if (record) {
      setEditing(record)
      setForm({
        type: record.type,
        category: record.category,
        description: record.description || '',
        amount: String(record.amount),
        payment_method: record.payment_method || 'pix',
        status: record.status,
        due_date: record.due_date || format(new Date(), 'yyyy-MM-dd'),
        notes: record.notes || '',
      })
    } else {
      setEditing(null)
      setForm(emptyForm)
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount) return
    setSaving(true)
    try {
      const payload = {
        type: form.type,
        category: form.category,
        description: form.description.trim(),
        amount: parseFloat(form.amount) || 0,
        payment_method: form.payment_method,
        status: form.status,
        due_date: form.due_date || null,
        paid_at: form.status === 'pago' ? new Date().toISOString() : null,
        notes: form.notes || null,
      }
      if (editing) {
        const { error } = await (supabase.from('financial_records' as any).update(payload as any).eq('id', editing.id) as any)
        if (error) throw error
        toast({ title: 'Lançamento atualizado!' })
      } else {
        const { error } = await (supabase.from('financial_records' as any).insert([payload] as any) as any)
        if (error) throw error
        toast({ title: 'Lançamento criado!' })
      }
      setDialogOpen(false)
      fetchRecords()
    } catch (err) {
      console.error('Erro ao salvar:', err)
      toast({ title: 'Erro ao salvar lançamento', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await (supabase.from('financial_records' as any).delete().eq('id', id) as any)
      toast({ title: 'Lançamento removido' })
      fetchRecords()
    } catch (err) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const filtered = useMemo(() => records.filter(r => {
    const matchType = filterType === 'todos' || r.type === filterType
    const matchSearch = !search || r.description?.toLowerCase().includes(search.toLowerCase()) || r.category.includes(search.toLowerCase())
    return matchType && matchSearch
  }), [records, filterType, search])

  const monthStart = startOfMonth(new Date())
  const monthEnd = endOfMonth(new Date())
  const thisMonth = records.filter(r => {
    try { return isWithinInterval(parseISO(r.created_at), { start: monthStart, end: monthEnd }) } catch { return false }
  })
  const receita = thisMonth.filter(r => r.type === 'receita' && r.status === 'pago').reduce((s, r) => s + r.amount, 0)
  const despesa = thisMonth.filter(r => r.type === 'despesa' && r.status === 'pago').reduce((s, r) => s + r.amount, 0)
  const pendente = records.filter(r => r.status === 'pendente').reduce((s, r) => s + r.amount, 0)
  const saldo = receita - despesa

  const pendentes = records.filter(r => r.status === 'pendente').sort((a, b) => {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date.localeCompare(b.due_date)
  })

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const RecordDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Consulta - Rex" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Forma de Pagamento</Label>
              <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{PAYMENT_LABELS[m]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.description || !form.amount}>
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="p-3 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Controle de receitas e despesas da clínica</p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="size-4 mr-2" /> Novo Lançamento
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
            <TrendingUp className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{fmt(receita)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pagamentos recebidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
            <TrendingDown className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fmt(despesa)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pagamentos realizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo (Mês)</CardTitle>
            {saldo >= 0
              ? <ArrowUpRight className="size-4 text-emerald-500" />
              : <ArrowDownRight className="size-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(saldo)}</div>
            <p className="text-xs text-muted-foreground mt-1">Receitas - Despesas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{fmt(pendente)}</div>
            <p className="text-xs text-muted-foreground mt-1">{pendentes.length} lançamento(s) pendente(s)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lancamentos">
        <TabsList>
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="areceber">A Receber ({pendentes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="lancamentos" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar lançamento..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {(['todos', 'receita', 'despesa'] as const).map(t => (
                <Button key={t} size="sm" variant={filterType === t ? 'default' : 'outline'} onClick={() => setFilterType(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="size-10 text-muted-foreground mb-3" />
                <p className="font-medium text-muted-foreground">Nenhum lançamento encontrado</p>
                <Button className="mt-4" onClick={() => handleOpen()}>
                  <Plus className="size-4 mr-2" /> Adicionar primeiro lançamento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map(record => (
                <Card key={record.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`size-9 rounded-full flex items-center justify-center shrink-0 ${record.type === 'receita' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {record.type === 'receita'
                          ? <TrendingUp className="size-4 text-emerald-600" />
                          : <TrendingDown className="size-4 text-red-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{record.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.category} · {record.payment_method ? PAYMENT_LABELS[record.payment_method] : ''} · {format(parseISO(record.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="text-right">
                        <p className={`font-bold ${record.type === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {record.type === 'receita' ? '+' : '-'}{fmt(record.amount)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[record.status]}`}>{record.status}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="size-8" onClick={() => handleOpen(record)}>
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" onClick={() => handleDelete(record.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="areceber" className="space-y-4 mt-4">
          {pendentes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="size-10 text-muted-foreground mb-3" />
                <p className="font-medium text-muted-foreground">Nenhum lançamento pendente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pendentes.map(record => (
                <Card key={record.id} className="border-amber-200 hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="size-5 text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{record.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.category}
                          {record.due_date ? ` · Vence ${format(parseISO(record.due_date), 'dd/MM/yyyy', { locale: ptBR })}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <p className="font-bold text-amber-600">{fmt(record.amount)}</p>
                      <Button size="sm" variant="outline" onClick={() => handleOpen(record)}>
                        <Edit2 className="size-3.5 mr-1" /> Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {RecordDialog}
    </div>
  )
}
