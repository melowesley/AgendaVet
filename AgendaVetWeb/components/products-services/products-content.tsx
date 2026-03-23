'use client'

import { useState, useMemo } from 'react'
import { useProducts, deleteProduct } from '@/lib/data-store'
import { toast } from 'sonner'
import type { Product, ProductCategory } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertCircle,
  LayoutGrid,
  List,
  FileDown,
  Upload,
  FlaskConical,
  Stethoscope,
} from 'lucide-react'
import { ProductFormDialog } from './product-form-dialog'

type ViewMode = 'grid' | 'list'
type StatFilter = 'all' | 'active' | 'inactive'
type CategoryTab = 'all' | ProductCategory

export function ProductsContent() {
  const { products, isLoading, error } = useProducts()
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [statFilter, setStatFilter] = useState<StatFilter>('all')
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('all')

  const activeCount = products.filter(s => s.active).length
  const inactiveCount = products.length - activeCount
  const materiaisCount = products.filter(s => s.category === 'material').length
  const medicamentosCount = products.filter(s => s.category === 'medicamento').length

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase())
      const matchStat =
        statFilter === 'all' ||
        (statFilter === 'active' && p.active) ||
        (statFilter === 'inactive' && !p.active)
      const matchCat =
        categoryTab === 'all' || p.category === categoryTab
      return matchSearch && matchStat && matchCat
    })
  }, [products, search, statFilter, categoryTab])

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormOpen(true)
  }

  const handleNew = () => {
    setEditingProduct(null)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteProduct(id)
      toast.success('Excluído com sucesso')
    } catch {
      toast.error('Erro ao excluir. Tente novamente.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handleExportPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Tabela de Produtos — AgendaVet</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; }
          h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
          p.subtitle { color: #555; font-size: 11px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          thead th { background: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #d1d5db; }
          tbody tr { border-bottom: 1px solid #e5e7eb; }
          tbody tr:last-child { border-bottom: none; }
          tbody td { padding: 8px 10px; vertical-align: middle; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
          .badge-mat { background: #dbeafe; color: #1e40af; }
          .badge-med { background: #fae8ff; color: #86198f; }
          .badge-active { background: #d1fae5; color: #065f46; }
          .badge-inactive { background: #f3f4f6; color: #6b7280; }
          .price { font-weight: 600; color: #047857; }
          .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: right; }
        </style>
      </head>
      <body>
        <h1>Tabela de Produtos</h1>
        <p class="subtitle">AgendaVet — Gestão Veterinária &nbsp;|&nbsp; Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Unidade</th>
              <th>Estoque</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(p => `
              <tr>
                <td><strong>${p.name}</strong>${p.description ? `<br/><small style="color:#555">${p.description}</small>` : ''}</td>
                <td><span class="badge ${p.category === 'material' ? 'badge-mat' : 'badge-med'}">${p.category === 'material' ? 'Material' : 'Medicamento'}</span></td>
                <td class="price">${formatCurrency(p.price)}</td>
                <td>${p.unit || '—'}</td>
                <td>${p.stock != null ? p.stock : '—'}</td>
                <td><span class="badge ${p.active ? 'badge-active' : 'badge-inactive'}">${p.active ? 'Ativo' : 'Inativo'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="footer">${filtered.length} item(s) listado(s)</p>
      </body>
      </html>
    `
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(printContent)
    win.document.close()
    win.focus()
    win.print()
  }

  const handleImport = () => {
    toast.info('Importação em breve disponível.')
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="p-4 rounded-full bg-red-500/10 mb-4">
          <AlertCircle className="size-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar produtos</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Verifique se a tabela <code className="bg-muted px-1 rounded text-xs">products</code> existe no Supabase.
        </p>
      </div>
    )
  }

  const statCards = [
    {
      key: 'all' as StatFilter,
      label: 'Total',
      value: products.length,
      color: 'bg-zinc-800 text-white',
      activeColor: 'bg-zinc-900 text-white ring-2 ring-zinc-500',
    },
    {
      key: 'active' as StatFilter,
      label: 'Ativos',
      value: activeCount,
      color: 'bg-emerald-600 text-white',
      activeColor: 'bg-emerald-700 text-white ring-2 ring-emerald-400',
    },
    {
      key: 'inactive' as StatFilter,
      label: 'Inativos',
      value: inactiveCount,
      color: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
      activeColor: 'bg-zinc-300 text-zinc-900 ring-2 ring-zinc-400 dark:bg-zinc-600 dark:text-white',
    },
  ]

  const categoryTabs: { key: CategoryTab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Todos', count: products.length, icon: <Package className="size-3.5" /> },
    { key: 'material', label: 'Materiais', count: materiaisCount, icon: <Stethoscope className="size-3.5" /> },
    { key: 'medicamento', label: 'Medicamentos', count: medicamentosCount, icon: <FlaskConical className="size-3.5" /> },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground text-sm">
            Materiais e medicamentos utilizados na clínica
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Button variant="outline" size="sm" onClick={handleImport} className="gap-1.5">
            <Upload className="size-4" />
            Importar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
            <FileDown className="size-4" />
            Exportar PDF
          </Button>
          <Button
            onClick={handleNew}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <Plus className="size-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((card) => (
          <button
            key={card.key}
            onClick={() => setStatFilter(card.key)}
            className={`rounded-xl px-4 py-3 text-left transition-all focus:outline-none ${
              statFilter === card.key ? card.activeColor : card.color
            } hover:opacity-90`}
          >
            <div className="text-2xl font-bold leading-none">{card.value}</div>
            <div className="text-xs mt-1 opacity-80 font-medium">{card.label}</div>
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-lg w-fit border border-border/40">
        {categoryTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategoryTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              categoryTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              categoryTab === tab.key ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex border border-border/50 rounded-md overflow-hidden h-9 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2.5 flex items-center justify-center transition-colors ${
              viewMode === 'grid'
                ? 'bg-emerald-600 text-white'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
            title="Grid"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2.5 flex items-center justify-center transition-colors border-l border-border/50 ${
              viewMode === 'list'
                ? 'bg-emerald-600 text-white'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
            title="Lista"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl border-dashed border-border/50">
          <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
            <Package className="size-8 text-emerald-500/60" />
          </div>
          <h3 className="text-lg font-medium">
            {products.length === 0 ? 'Nenhum produto ainda' : 'Nenhum resultado encontrado'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            {products.length === 0
              ? 'Cadastre os materiais e medicamentos utilizados na clínica.'
              : 'Tente ajustar os filtros ou a busca.'}
          </p>
          {products.length === 0 && (
            <Button onClick={handleNew} className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="size-4 mr-2" />
              Cadastrar Primeiro
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className={`rounded-lg border border-border/50 bg-card p-3 flex flex-col gap-1.5 hover:shadow-sm transition-all ${
                !product.active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-medium text-sm leading-tight flex-1 truncate">{product.name}</span>
                <ProductMenu
                  product={product}
                  deletingId={deletingId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <Badge
                  className={`w-fit text-[10px] px-1.5 py-0 h-4 ${
                    product.category === 'material'
                      ? 'bg-blue-500/15 text-blue-600 border-blue-500/20'
                      : 'bg-purple-500/15 text-purple-600 border-purple-500/20'
                  }`}
                  variant="outline"
                >
                  {product.category === 'material' ? 'Material' : 'Medicamento'}
                </Badge>
                <Badge
                  variant={product.active ? 'default' : 'secondary'}
                  className={`w-fit text-[10px] px-1.5 py-0 h-4 ${product.active ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' : ''}`}
                >
                  {product.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {product.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-border/30 mt-auto">
                <span className="font-semibold text-sm text-emerald-600">{formatCurrency(product.price)}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {product.unit && <span>{product.unit}</span>}
                  {product.stock != null && <span>Estq: {product.stock}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border/50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Preço</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Unidade</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Estoque</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="px-2 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  className={`hover:bg-muted/20 transition-colors ${!product.active ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium truncate max-w-[180px]">{product.name}</div>
                    {product.description && (
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">{product.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <Badge
                      className={`text-[10px] px-1.5 py-0 h-4 ${
                        product.category === 'material'
                          ? 'bg-blue-500/15 text-blue-600 border-blue-500/20'
                          : 'bg-purple-500/15 text-purple-600 border-purple-500/20'
                      }`}
                      variant="outline"
                    >
                      {product.category === 'material' ? 'Material' : 'Medicamento'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 whitespace-nowrap">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground hidden md:table-cell">
                    {product.unit || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground hidden md:table-cell">
                    {product.stock != null ? product.stock : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge
                      variant={product.active ? 'default' : 'secondary'}
                      className={`text-[10px] px-1.5 py-0 h-4 ${product.active ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' : ''}`}
                    >
                      {product.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-2 py-2.5">
                    <ProductMenu
                      product={product}
                      deletingId={deletingId}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-muted/20 border-t border-border/30 text-xs text-muted-foreground">
            {filtered.length} item(s)
          </div>
        </div>
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingProduct(null)
        }}
        product={editingProduct}
        defaultCategory={categoryTab === 'all' ? 'material' : categoryTab}
      />
    </div>
  )
}

function ProductMenu({
  product,
  deletingId,
  onEdit,
  onDelete,
}: {
  product: Product
  deletingId: string | null
  onEdit: (p: Product) => void
  onDelete: (id: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7 flex-shrink-0">
          <MoreHorizontal className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(product)}>
          <Edit className="size-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(product.id)}
          disabled={deletingId === product.id}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="size-4 mr-2" />
          {deletingId === product.id ? 'Excluindo...' : 'Excluir'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
