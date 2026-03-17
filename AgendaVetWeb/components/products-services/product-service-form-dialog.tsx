'use client'

import { useState, useEffect } from 'react'
import { addService, updateService } from '@/lib/data-store'
import { toast } from 'sonner'
import type { Service } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { ShoppingBag } from 'lucide-react'

interface ProductServiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service | null
}

export function ProductServiceFormDialog({
  open,
  onOpenChange,
  service,
}: ProductServiceFormDialogProps) {
  const isEditing = !!service
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    durationMinutes: '',
    active: true,
  })

  useEffect(() => {
    if (open) {
      if (service) {
        setFormData({
          name: service.name,
          description: service.description || '',
          price: service.price.toString(),
          durationMinutes: service.durationMinutes?.toString() || '',
          active: service.active,
        })
      } else {
        setFormData({
          name: '',
          description: '',
          price: '',
          durationMinutes: '',
          active: true,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('O nome é obrigatório')
      return
    }

    const priceNum = parseFloat(formData.price)
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('O preço deve ser um valor válido (≥ 0)')
      return
    }

    const durationNum = formData.durationMinutes ? parseInt(formData.durationMinutes) : undefined
    if (formData.durationMinutes && (isNaN(durationNum!) || durationNum! <= 0)) {
      toast.error('A duração deve ser um número positivo de minutos')
      return
    }

    setIsSaving(true)
    try {
      const payload: Omit<Service, 'id' | 'createdAt'> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: priceNum,
        durationMinutes: durationNum,
        active: formData.active,
      }

      if (isEditing && service) {
        await updateService(service.id, payload)
        toast.success('Atualizado com sucesso!')
      } else {
        await addService(payload)
        toast.success('Cadastrado com sucesso!')
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save service:', error)
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-emerald-500" />
            {isEditing ? 'Editar' : 'Novo'} Produto / Serviço
          </DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Consulta Clínica, Vacina V10, Antipulgas..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duração (min)</Label>
              <Input
                id="durationMinutes"
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                placeholder="Ex: 30"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="active">Status *</Label>
              <Select
                value={formData.active ? 'active' : 'inactive'}
                onValueChange={(v) => setFormData({ ...formData, active: v === 'active' })}
              >
                <SelectTrigger id="active">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição opcional..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Salvando...
                </div>
              ) : isEditing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
