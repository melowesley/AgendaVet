'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { addPet, updatePet, useOwners } from '@/lib/data-store'
import type { Pet } from '@/lib/types'
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

interface PetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pet?: Pet | null
}

const speciesOptions: { value: Pet['species']; label: string }[] = [
  { value: 'dog', label: 'Cachorro' },
  { value: 'cat', label: 'Gato' },
  { value: 'bird', label: 'Pássaro' },
  { value: 'rabbit', label: 'Coelho' },
  { value: 'reptile', label: 'Réptil' },
  { value: 'other', label: 'Outro' },
]

export function PetFormDialog({ open, onOpenChange, pet }: PetFormDialogProps) {
  const { owners } = useOwners()
  const isEditing = !!pet

  const [formData, setFormData] = useState({
    name: '',
    species: 'dog' as Pet['species'],
    breed: '',
    dateOfBirth: '',
    weight: '',
    ownerId: '',
    notes: '',
  })

  useEffect(() => {
    if (open) {
      if (pet) {
        setFormData({
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          dateOfBirth: pet.dateOfBirth,
          weight: pet.weight.toString(),
          ownerId: pet.ownerId,
          notes: pet.notes,
        })
      } else {
        setFormData({
          name: '',
          species: 'dog',
          breed: '',
          dateOfBirth: '',
          weight: '',
          ownerId: owners[0]?.id || '',
          notes: '',
        })
      }
    }
  }, [open, pet?.id, owners.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const petData = {
      name: formData.name,
      species: formData.species,
      breed: formData.breed,
      dateOfBirth: formData.dateOfBirth,
      weight: parseFloat(formData.weight) || 0,
      ownerId: formData.ownerId,
      notes: formData.notes,
    }

    if (isEditing && pet) {
      updatePet(pet.id, petData)
    } else {
      addPet(petData)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do paciente abaixo.'
              : 'Insira os detalhes do novo paciente.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do pet"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="species">Espécie</Label>
              <Select
                value={formData.species}
                onValueChange={(value: Pet['species']) =>
                  setFormData({ ...formData, species: value })
                }
              >
                <SelectTrigger id="species">
                  <SelectValue placeholder="Selecionar espécie" />
                </SelectTrigger>
                <SelectContent>
                  {speciesOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Raça</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                placeholder="ex., Golden Retriever"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="0.0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Tutor</Label>
              <Select
                value={formData.ownerId}
                onValueChange={(value) => setFormData({ ...formData, ownerId: value })}
              >
                <SelectTrigger id="owner">
                  <SelectValue placeholder="Selecionar tutor" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.firstName} {owner.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Alguma observação adicional sobre o pet..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? 'Salvar Alterações' : 'Adicionar Paciente'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
