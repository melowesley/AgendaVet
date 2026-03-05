'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { addMedicalRecord, usePets } from '@/lib/data-store'
import type { MedicalRecord } from '@/lib/types'
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

interface MedicalRecordFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  petId?: string
  defaultType?: MedicalRecord['type']
}

const typeOptions: { value: MedicalRecord['type']; label: string }[] = [
  { value: 'vaccination', label: 'Vacinação' },
  { value: 'diagnosis', label: 'Diagnóstico' },
  { value: 'prescription', label: 'Receita' },
  { value: 'procedure', label: 'Procedimento' },
  { value: 'lab-result', label: 'Resultado de Exame' },
  { value: 'note', label: 'Observação' },
]

const veterinarians = [
  'Dr. Amanda Foster',
  'Dr. James Wilson',
  'Dr. Sarah Chen',
  'Lisa Martinez',
]

export function MedicalRecordFormDialog({
  open,
  onOpenChange,
  petId: initialPetId,
  defaultType = 'vaccination',
}: MedicalRecordFormDialogProps) {
  const { pets } = usePets()

  const [formData, setFormData] = useState({
    petId: initialPetId || '',
    date: '',
    type: defaultType as MedicalRecord['type'],
    title: '',
    description: '',
    veterinarian: veterinarians[0],
  })

  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split('T')[0]
      setFormData({
        petId: initialPetId || pets[0]?.id || '',
        date: today,
        type: defaultType,
        title: '',
        description: '',
        veterinarian: veterinarians[0],
      })
    }
  }, [initialPetId, pets.length, open, defaultType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addMedicalRecord(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>Novo Registro Médico</DialogTitle>
          <DialogDescription>
            Crie um novo registro médico/prontuário para o paciente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pet">Paciente</Label>
              <Select
                value={formData.petId}
                onValueChange={(value) => setFormData({ ...formData, petId: value })}
              >
                <SelectTrigger id="pet">
                  <SelectValue placeholder="Selecionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Registro</Label>
              <Select
                value={formData.type}
                onValueChange={(value: MedicalRecord['type']) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="veterinarian">Veterinário</Label>
              <Select
                value={formData.veterinarian}
                onValueChange={(value) => setFormData({ ...formData, veterinarian: value })}
              >
                <SelectTrigger id="veterinarian">
                  <SelectValue placeholder="Selecionar veterinário" />
                </SelectTrigger>
                <SelectContent>
                  {veterinarians.map((vet) => (
                    <SelectItem key={vet} value={vet}>
                      {vet}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="ex., Vacinação Anual, Receita Antibiótico"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Notas detalhadas sobre este registro..."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Gravar Registro</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
