'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { addAppointment, updateAppointment, usePets, useOwners } from '@/lib/data-store'
import type { Appointment } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Search } from 'lucide-react'
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

interface AppointmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: Appointment | null
}

const typeOptions: { value: Appointment['type']; label: string }[] = [
  { value: 'checkup', label: 'Consulta' },
  { value: 'vaccination', label: 'Vacinação' },
  { value: 'surgery', label: 'Cirurgia' },
  { value: 'grooming', label: 'Banho e Tosa' },
  { value: 'emergency', label: 'Emergência' },
  { value: 'follow-up', label: 'Retorno' },
]

const statusOptions: { value: Appointment['status']; label: string }[] = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'in-progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
]

const veterinarians = [
  'Dr. Amanda Foster',
  'Dr. James Wilson',
  'Dr. Sarah Chen',
  'Lisa Martinez',
]

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
}: AppointmentFormDialogProps) {
  const { pets } = usePets()
  const { owners } = useOwners()
  const isEditing = !!appointment

  const [formData, setFormData] = useState({
    petId: '',
    ownerId: '',
    date: '',
    time: '',
    type: 'checkup' as Appointment['type'],
    status: 'scheduled' as Appointment['status'],
    notes: '',
    veterinarian: veterinarians[0],
  })

  const [petSearch, setPetSearch] = useState('')

  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(petSearch.toLowerCase()) ||
    pet.species.toLowerCase().includes(petSearch.toLowerCase())
  )

  useEffect(() => {
    if (open) {
      if (appointment) {
        setFormData({
          petId: appointment.petId,
          ownerId: appointment.ownerId,
          date: appointment.date,
          time: appointment.time,
          type: appointment.type,
          status: appointment.status,
          notes: appointment.notes,
          veterinarian: appointment.veterinarian,
        })
      } else {
        const today = new Date().toISOString().split('T')[0]
        setFormData({
          petId: filteredPets[0]?.id || '',
          ownerId: filteredPets[0]?.ownerId || owners[0]?.id || '',
          date: today,
          time: '09:00',
          type: 'checkup',
          status: 'scheduled',
          notes: '',
          veterinarian: veterinarians[0],
        })
      }
      setPetSearch('')
    }
  }, [open, appointment?.id, filteredPets.length, owners.length])

  const handlePetChange = (petId: string) => {
    const pet = pets.find((p) => p.id === petId)
    setFormData({
      ...formData,
      petId,
      ownerId: pet?.ownerId || formData.ownerId,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing && appointment) {
      updateAppointment(appointment.id, formData)
    } else {
      addAppointment(formData)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os detalhes do agendamento abaixo.'
              : 'Preencha os detalhes para o novo agendamento.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pet">Paciente (Pet)</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                  <Input
                    placeholder="Buscar por nome ou espécie..."
                    value={petSearch}
                    onChange={(e) => setPetSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={formData.petId} onValueChange={handlePetChange}>
                  <SelectTrigger id="pet">
                    <SelectValue placeholder="Selecionar pet" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {filteredPets.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        Nenhum pet encontrado
                      </div>
                    ) : (
                      filteredPets.map((pet) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name} ({pet.species})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
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
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: Appointment['type']) =>
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Appointment['status']) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais para este agendamento..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? 'Salvar Alterações' : 'Agendar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
