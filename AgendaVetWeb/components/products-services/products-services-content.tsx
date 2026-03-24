'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Stethoscope, Plus, Search, Edit2, Trash2, DollarSign, Clock } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface Service {
  id: string
  name: string
  description?: string
  price?: number
  duration_minutes?: number
  category?: string
  active?: boolean
  created_at?: string
}

export function ProductsServicesContent() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', duration_minutes: '', category: '' })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name')
      if (error) throw error
      setServices(data || [])
    } catch (err) {
      console.error('Erro ao carregar serviços:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' })
      return
    }
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        category: form.category.trim() || null,
        active: true,
      }
      if (editingService) {
        const { error } = await supabase.from('services').update(payload).eq('id', editingService.id)
        if (error) throw error
        toast({ title: 'Serviço atualizado!' })
      } else {
        const { error } = await supabase.from('services').insert([payload])
        if (error) throw error
        toast({ title: 'Serviço criado!' })
      }
      setDialogOpen(false)
      setEditingService(null)
      setForm({ name: '', description: '', price: '', duration_minutes: '', category: '' })
      fetchServices()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setForm({
      name: service.name || '',
      description: service.description || '',
      price: service.price?.toString() || '',
      duration_minutes: service.duration_minutes?.toString() || '',
      category: service.category || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return
    try {
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Serviço removido' })
      fetchServices()
    } catch (err) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (value?: number) =>
    value != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : '—'

  return (
    <div className="px-4 md:px-6 pb-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Serviços Veterinários</h2>
          <p className="text-sm text-muted-foreground">{services.length} serviços cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) { setEditingService(null); setForm({ name: '', description: '', price: '', duration_minutes: '', category: '' }) }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" /> Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
              <DialogDescription>Preencha os dados do serviço veterinário.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Nome *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Consulta clínica" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Consulta, Exame, Cirurgia" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preço (R$)</Label>
                  <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0,00" />
                </div>
                <div>
                  <Label>Duração (min)</Label>
                  <Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} placeholder="30" />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição do serviço" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar serviços..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-32 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Stethoscope className="size-10 text-muted-foreground mb-4" />
            <p className="font-medium text-muted-foreground">Nenhum serviço encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Clique em "Novo Serviço" para adicionar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(service => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{service.name}</CardTitle>
                    {service.category && (
                      <Badge variant="secondary" className="mt-1 text-xs">{service.category}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => handleEdit(service)}>
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {service.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  {service.price != null && (
                    <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <DollarSign className="size-3.5" />
                      {formatCurrency(service.price)}
                    </div>
                  )}
                  {service.duration_minutes && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3.5" />
                      {service.duration_minutes}min
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
