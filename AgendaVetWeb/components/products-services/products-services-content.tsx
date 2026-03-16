'use client'

import { useState, useMemo } from 'react'
import { useServices, deleteService } from '@/lib/data-store'
import { toast } from 'sonner'
import type { Service } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ShoppingBag,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  LayoutGrid,
  List,
  FileDown,
  Upload,
} from 'lucide-react'
import { ProductServiceFormDialog } from './product-service-form-dialog'

type ViewMode = 'grid' | 'list'
type StatFilter = 'all' | 'active' | 'inactive' | 'with-duration'

export function ProductsServicesContent() {
  const { services, isLoading, error } = useServices()
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [statFilter, setStatFilter] = useState<StatFilter>('all')

  const activeCount = services.filter(s => s.active).length
  const inactiveCount = services.length - activeCount
  const withDurationCount = services.filter(s => s.durationMinutes).length

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(search.toLowerCase())

      let matchStat = true
      if (statFilter === 'active') matchStat = s.active
      else if (statFilter === 'inactive') matchStat = !s.active
      else if (statFilter === 'with-duration') matchStat = !!s.durationMinutes

      return matchSearch && matchStat
    })
  }, [services, search, statFilter])

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormOpen(true)
  }

  const handleNew = () => {
    setEditingService(null)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteService(id)
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
        <title>Tabela de Preços — AgendaVet</title>
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
          .badge-active { background: #d1fae5; color: #065f46; }
          .badge-inactive { background: #f3f4f6; color: #6b7280; }
          .price { font-weight: 600; color: #047857; }
          .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: right; }
        </style>
      </head>
      <body>
        <h1>Tabela de Preços</h1>
        <p class="subtitle">AgendaVet — Gestão Veterinária &nbsp;|&nbsp; Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Preço</th>
              <th>Duração</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(s => `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td style="color:#555">${s.description || '—'}</td>
                <td class="price">${formatCurrency(s.price)}</td>
                <td>${s.durationMinutes ? `${s.durationMinutes} min` : '—'}</td>
                <td><span class="badge ${s.active ? 'badge-active' : 'badge-inactive'}">${s.active ? 'Ativo' : 'Inativo'}</span></td>
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
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar</h2>
        <p className="text-muted-foreground text-sm">
          Não foi possível carregar os produtos e serviços. Verifique sua conexão.
        </p>
      </div>
    )
  }

  const statCards = [
    {
      key: 'all' as StatFilter,
      label: 'Total',
      value: services.length,
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
    {
      key: 'with-duration' as StatFilter,
      label: 'Com duração',
      value: withDurationCount,
      color: 'bg-blue-600 text-white',
      activeColor: 'bg-blue-700 text-white ring-2 ring-blue-400',
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos & Serviços</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie os serviços e produtos oferecidos pela clínica
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
            Novo Cadastro
          </Button>
        </div>
      </div>

      {/* Stat cards — clicáveis como filtro */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        {/* View mode toggle */}
        <div className="flex border border-border/50 rounded-md overflow-hidden h-9 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2.5 flex items-center justify-center transition-colors ${
              viewMode === 'grid'
                ? 'bg-emerald-600 text-white'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
            title="Visualização em grid"
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
            title="Visualização em lista"
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
            <ShoppingBag className="size-8 text-emerald-500/60" />
          </div>
          <h3 className="text-lg font-medium">
            {services.length === 0 ? 'Nenhum cadastro ainda' : 'Nenhum resultado encontrado'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            {services.length === 0
              ? 'Cadastre os serviços e produtos oferecidos pela sua clínica.'
              : 'Tente ajustar os filtros ou a busca.'}
          </p>
          {services.length === 0 && (
            <Button onClick={handleNew} className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="size-4 mr-2" />
              Cadastrar Primeiro
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((service) => (
            <div
              key={service.id}
              className={`rounded-lg border border-border/50 bg-card p-3 transition-all hover:shadow-sm flex flex-col gap-1.5 ${
                !service.active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-medium text-sm leading-tight flex-1 truncate">{service.name}</span>
                <ServiceMenu
                  service={service}
                  deletingId={deletingId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
              <Badge
                variant={service.active ? 'default' : 'secondary'}
                className={`w-fit text-[10px] px-1.5 py-0 h-4 ${service.active ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' : ''}`}
              >
                {service.active ? 'Ativo' : 'Inativo'}
              </Badge>
              {service.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-border/30 mt-auto">
                <span className="font-semibold text-sm text-emerald-600">{formatCurrency(service.price)}</span>
                {service.durationMinutes && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>{service.durationMinutes} min</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border/50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Descrição</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Preço</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Duração</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="px-2 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((service) => (
                <tr
                  key={service.id}
                  className={`hover:bg-muted/20 transition-colors ${!service.active ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-2.5 font-medium truncate max-w-[160px]">{service.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[220px] hidden md:table-cell">
                    {service.description || <span className="text-border">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 whitespace-nowrap">
                    {formatCurrency(service.price)}
                  </td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground hidden sm:table-cell">
                    {service.durationMinutes ? (
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="size-3" />
                        {service.durationMinutes} min
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge
                      variant={service.active ? 'default' : 'secondary'}
                      className={`text-[10px] px-1.5 py-0 h-4 ${service.active ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' : ''}`}
                    >
                      {service.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-2 py-2.5">
                    <ServiceMenu
                      service={service}
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

      <ProductServiceFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingService(null)
        }}
        service={editingService}
      />
    </div>
  )
}

function ServiceMenu({
  service,
  deletingId,
  onEdit,
  onDelete,
}: {
  service: Service
  deletingId: string | null
  onEdit: (s: Service) => void
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
        <DropdownMenuItem onClick={() => onEdit(service)}>
          <Edit className="size-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(service.id)}
          disabled={deletingId === service.id}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="size-4 mr-2" />
          {deletingId === service.id ? 'Excluindo...' : 'Excluir'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
