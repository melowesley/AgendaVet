'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { addOwner, updateOwner } from '@/lib/data-store'
import type { Owner } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface OwnerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  owner?: Owner | null
}

export function OwnerFormDialog({ open, onOpenChange, owner }: OwnerFormDialogProps) {
  const isEditing = !!owner
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    if (open) {
      if (owner) {
        setFormData({
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          phone: owner.phone,
          address: owner.address,
        })
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
        })
      }
    }
  }, [open, owner?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isEditing && owner) {
        await updateOwner(owner.id, formData)
        toast({ title: 'Tutor atualizado com sucesso!' })
      } else {
        await addOwner(formData)
        toast({ title: 'Tutor adicionado com sucesso!' })
      }
      onOpenChange(false)
    } catch (error: any) {
      console.error('Erro ao salvar tutor:', error)
      toast({
        title: 'Erro ao salvar tutor',
        description: error?.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Tutor' : 'Novo Tutor'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do tutor abaixo.'
              : 'Insira os detalhes do novo tutor.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="João"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Silva"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="joao.silva@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua Principal 123, Centro, Cidade-UF"
              rows={2}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Adicionar Tutor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
