'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/data-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Package, Plus, Search, Edit2, Trash2, DollarSign, Archive } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

// Se a tabela 'products' não existir no Supabase, execute:
// CREATE TABLE public.products (
//   id uuid default gen_random_uuid() primary key,
//   name text not null,
//   description text,
//   price numeric(10,2),
//   stock_quantity integer default 0,
//   unit text default 'unidade',
//   category text,
//   active boolean default true,
//   created_at timestamp with time zone default timezone('utc', now())
// );

interface Product {
  id: string
  name: string
  description?: string
  price?: number
  stock_quantity?: number
  unit?: string
  category?: string
  active?: boolean
  created_at?: string
}

const UNITS = ['unidade', 'caixa', 'ml', 'kg', 'comprimido']
const CATEGORIES = ['medicamento', 'vacina', 'material cirúrgico', 'higiene', 'nutrição', 'acessório', 'outro']

const emptyForm = { name: '', description: '', price: '', stock_quantity: '', unit: 'unidade', category: '' }

export function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products' as any)
        .select('*')
        .order('name')
      if (error) throw error
      setProducts((data || []) as Product[])
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
      toast({ title: 'Erro ao carregar produtos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = (product?: Product) => {
    if (product) {
      setEditing(product)
      setForm({
        name: product.name,
        description: product.description || '',
        price: product.price != null ? String(product.price) : '',
        stock_quantity: product.stock_quantity != null ? String(product.stock_quantity) : '',
        unit: product.unit || 'unidade',
        category: product.category || '',
      })
    } else {
      setEditing(null)
      setForm(emptyForm)
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        price: form.price ? parseFloat(form.price) : null,
        stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity) : 0,
        unit: form.unit,
        category: form.category || null,
        active: true,
      }
      if (editing) {
        const { error } = await (supabase.from('products' as any).update(payload as any).eq('id', editing.id) as any)
        if (error) throw error
        toast({ title: 'Produto atualizado!' })
      } else {
        const { error } = await (supabase.from('products' as any).insert([payload] as any) as any)
        if (error) throw error
        toast({ title: 'Produto cadastrado!' })
      }
      setDialogOpen(false)
      fetchProducts()
    } catch (err) {
      console.error('Erro ao salvar produto:', err)
      toast({ title: 'Erro ao salvar produto', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await (supabase.from('products' as any).delete().eq('id', id) as any)
      toast({ title: 'Produto removido' })
      fetchProducts()
    } catch {
      toast({ title: 'Erro ao remover produto', variant: 'destructive' })
    }
  }

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
  )

  const fmtPrice = (v?: number) => v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Produtos</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Produtos</h2>
          <p className="text-sm text-muted-foreground">Controle de estoque e produtos da clínica</p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="size-4 mr-2" /> Novo Produto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou categoria..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="size-12 text-muted-foreground mb-4" />
            {search ? (
              <>
                <p className="font-medium text-muted-foreground">Nenhum produto encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">Tente buscar por outro termo</p>
              </>
            ) : (
              <>
                <p className="font-medium text-muted-foreground">Nenhum produto cadastrado</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Cadastre medicamentos, vacinas, materiais cirúrgicos e outros itens do estoque.
                </p>
                <Button className="mt-4" onClick={() => handleOpen()}>
                  <Plus className="size-4 mr-2" /> Cadastrar primeiro produto
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(product => (
            <Card key={product.id} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{product.name}</CardTitle>
                    {product.category && (
                      <Badge variant="secondary" className="mt-1 text-xs">{product.category}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => handleOpen(product)}>
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <DollarSign className="size-3.5" />
                    {fmtPrice(product.price)}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Archive className="size-3.5" />
                    {product.stock_quantity ?? 0} {product.unit || 'unidade(s)'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Ivermectina 1%"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Estoque</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.stock_quantity}
                  onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Unidade</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Informações adicionais sobre o produto..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
