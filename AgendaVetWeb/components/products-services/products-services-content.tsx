'use client'

import { useState, useMemo } from 'react'
import { useServices, deleteService } from '@/lib/data-store'
import { toast } from 'sonner'
import type { Service } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DollarSign,
  AlertCircle,
} from 'lucide-react'
import { ProductServiceFormDialog } from './product-service-form-dialog'

export function ProductsServicesContent() {
  const { services, isLoading, error } = useServices()
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'active' && s.active)
        || (statusFilter === 'inactive' && !s.active)
      return matchSearch && matchStatus
    })
  }, [services, search, statusFilter])

  const activeCount = services.filter(s => s.active).length
  const withDurationCount = services.filter(s => s.durationMinutes).length

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

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos & Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os serviços e produtos oferecidos pela clínica
          </p>
        </div>
        <Button
          onClick={handleNew}
          className="bg-emerald-600 hover:bg-emerald-700 text-white self-start sm:self-auto"
        >
          <Plus className="size-4 mr-2" />
          Novo Cadastro
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{activeCount} ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <div className="size-2 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{services.length - activeCount} inativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Duração</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withDurationCount}</div>
            <p className="text-xs text-muted-foreground mt-1">com tempo definido</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
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
              : 'Tente ajustar os filtros de busca.'}
          </p>
          {services.length === 0 && (
            <Button onClick={handleNew} className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="size-4 mr-2" />
              Cadastrar Primeiro
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => (
            <Card
              key={service.id}
              className={`transition-all hover:shadow-md border-border/50 ${
                !service.active ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight truncate flex-1">
                    {service.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 flex-shrink-0">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(service)}>
                        <Edit className="size-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(service.id)}
                        disabled={deletingId === service.id}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="size-4 mr-2" />
                        {deletingId === service.id ? 'Excluindo...' : 'Excluir'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Badge
                  variant={service.active ? 'default' : 'secondary'}
                  className={`w-fit text-xs ${service.active ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' : ''}`}
                >
                  {service.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-border/30">
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <DollarSign className="size-4" />
                    <span className="font-semibold text-base">{formatCurrency(service.price)}</span>
                  </div>
                  {service.durationMinutes && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span>{service.durationMinutes} min</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
