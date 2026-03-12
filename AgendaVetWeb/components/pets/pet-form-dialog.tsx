'use client'

import { useState, useEffect } from 'react'
import { addPet, updatePet, useOwners, addTutorAndPet, updateOwner } from '@/lib/data-store'
import { toast } from 'sonner'
import type { Pet, Owner } from '@/lib/types'
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
import { User, PawPrint, Phone, Mail, MapPin, Hash, Users } from 'lucide-react'

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

  const [useExistingTutor, setUseExistingTutor] = useState(true)
  const [formData, setFormData] = useState({
    // Tutor data
    tutorId: '',
    tutorFirstName: '',
    tutorLastName: '',
    tutorGender: 'Masculino' as Owner['gender'],
    tutorAge: '',
    tutorAddress: '',
    tutorEmail: '',
    tutorWhatsapp: '',
    // Pet data
    name: '',
    species: 'dog' as Pet['species'],
    breed: '',
    gender: 'Macho' as 'Macho' | 'Fêmea',
    dateOfBirth: '',
    weight: '',
    notes: '',
  })

  useEffect(() => {
    if (open) {
      if (pet) {
        const owner = owners.find(o => o.id === pet.profileId)
        setUseExistingTutor(true)
        setFormData({
          tutorId: pet.profileId,
          tutorFirstName: owner?.firstName || '',
          tutorLastName: owner?.lastName || '',
          tutorGender: owner?.gender || 'Masculino',
          tutorAge: owner?.age?.toString() || '',
          tutorAddress: owner?.address || '',
          tutorEmail: owner?.email || '',
          tutorWhatsapp: owner?.whatsapp || '',
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          gender: pet.gender || 'Macho',
          dateOfBirth: pet.dateOfBirth,
          weight: pet.weight.toString(),
          notes: pet.notes,
        })
      } else {
        setUseExistingTutor(owners.length > 0)
        setFormData({
          tutorId: owners[0]?.id || '',
          tutorFirstName: '',
          tutorLastName: '',
          tutorGender: 'Masculino',
          tutorAge: '',
          tutorAddress: '',
          tutorEmail: '',
          tutorWhatsapp: '',
          name: '',
          species: 'dog',
          breed: '',
          gender: 'Macho',
          dateOfBirth: '',
          weight: '',
          notes: '',
        })
      }
    }
  }, [open, pet?.id, owners.length])

  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação de campos obrigatórios
    if (!formData.name || !formData.species || !formData.breed || !formData.dateOfBirth || !formData.weight) {
      toast.error('Preencha todos os campos obrigatórios do paciente (*)')
      return
    }

    if (!isEditing && !useExistingTutor) {
      if (!formData.tutorFirstName || !formData.tutorGender || !formData.tutorAge || !formData.tutorAddress || !formData.tutorEmail || !formData.tutorWhatsapp) {
        toast.error('Preencha todos os campos obrigatórios do tutor (*)')
        return
      }
    }

    setIsSaving(true)

    try {
      if (isEditing && pet) {
        await updateOwner(formData.tutorId, {
          firstName: formData.tutorFirstName,
          lastName: formData.tutorLastName,
          gender: formData.tutorGender,
          age: parseInt(formData.tutorAge) || 0,
          address: formData.tutorAddress,
          email: formData.tutorEmail,
          whatsapp: formData.tutorWhatsapp,
          phone: formData.tutorWhatsapp,
        })

        await updatePet(pet.id, {
          name: formData.name,
          species: formData.species,
          breed: formData.breed,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          weight: parseFloat(formData.weight) || 0,
          notes: formData.notes,
        })
        toast.success('Informações atualizadas com sucesso!')
      } else if (useExistingTutor) {
        await addPet({
          name: formData.name,
          species: formData.species,
          breed: formData.breed,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          weight: parseFloat(formData.weight) || 0,
          profileId: formData.tutorId,
          notes: formData.notes,
        })
        toast.success('Novo pet adicionado com sucesso!')
      } else {
        // Unified registration
        await addTutorAndPet(
          {
            firstName: formData.tutorFirstName,
            lastName: formData.tutorLastName,
            gender: formData.tutorGender,
            age: parseInt(formData.tutorAge) || 0,
            address: formData.tutorAddress,
            email: formData.tutorEmail,
            whatsapp: formData.tutorWhatsapp,
            phone: formData.tutorWhatsapp, // Use whatsapp as phone for now
          },
          {
            name: formData.name,
            species: formData.species,
            breed: formData.breed,
            gender: formData.gender,
            dateOfBirth: formData.dateOfBirth,
            weight: parseFloat(formData.weight) || 0,
            notes: formData.notes,
          }
        )
        toast.success('Tutor e Pet cadastrados com sucesso!')
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Erro ao salvar. Verifique se os dados estão completos.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto backdrop-blur-sm scrollbar-thin scrollbar-thumb-muted">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <PawPrint className="size-5 text-emerald-500" /> : <PlusCircle className="size-5 text-emerald-500" />}
            {isEditing ? 'Editar Registro' : 'Novo Cadastro Unificado'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do tutor e do paciente. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* SEÇÃO DO TUTOR */}
          <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-muted-foreground/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                <User className="size-4" /> DADOS DO TUTOR
              </h3>
              {!isEditing && owners.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setUseExistingTutor(!useExistingTutor)}
                >
                  {useExistingTutor ? 'Cadastrar Novo Tutor' : 'Selecionar Existente'}
                </Button>
              )}
            </div>

            {useExistingTutor && !isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="tutorId">Selecionar Tutor *</Label>
                <Select
                  value={formData.tutorId}
                  onValueChange={(value) => setFormData({ ...formData, tutorId: value })}
                >
                  <SelectTrigger id="tutorId" className="bg-background">
                    <SelectValue placeholder="Selecione um tutor da lista" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.fullName || `${owner.firstName} ${owner.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="tutorFirstName">Nome Completo do Tutor *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="tutorFirstName"
                      className="pl-9 bg-background"
                      value={formData.tutorFirstName}
                      onChange={(e) => setFormData({ ...formData, tutorFirstName: e.target.value })}
                      placeholder="Nome Sobrenome"
                      required={!useExistingTutor && !isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tutorGender">Gênero *</Label>
                  <Select
                    value={formData.tutorGender}
                    onValueChange={(v: any) => setFormData({ ...formData, tutorGender: v })}
                  >
                    <SelectTrigger id="tutorGender" className="bg-background">
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-muted-foreground" />
                        <SelectValue placeholder="Selecione" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tutorAge">Idade *</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="tutorAge"
                      type="number"
                      className="pl-9 bg-background"
                      value={formData.tutorAge}
                      onChange={(e) => setFormData({ ...formData, tutorAge: e.target.value })}
                      placeholder="Ex: 35"
                      required={!useExistingTutor && !isEditing}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="tutorAddress">Endereço *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="tutorAddress"
                      className="pl-9 bg-background"
                      value={formData.tutorAddress}
                      onChange={(e) => setFormData({ ...formData, tutorAddress: e.target.value })}
                      placeholder="Rua, número, bairro..."
                      required={!useExistingTutor && !isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tutorEmail">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="tutorEmail"
                      type="email"
                      className="pl-9 bg-background"
                      value={formData.tutorEmail}
                      onChange={(e) => setFormData({ ...formData, tutorEmail: e.target.value })}
                      placeholder="exemplo@email.com"
                      required={!useExistingTutor && !isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tutorWhatsapp">Contato WhatsApp *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="tutorWhatsapp"
                      className="pl-9 bg-background"
                      value={formData.tutorWhatsapp}
                      onChange={(e) => setFormData({ ...formData, tutorWhatsapp: e.target.value })}
                      placeholder="(11) 99999-9999"
                      required={!useExistingTutor && !isEditing}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO DO PET */}
          <div className="space-y-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-600">
              <PawPrint className="size-4" /> DADOS DO PACIENTE (PET)
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Pet *</Label>
                <Input
                  id="name"
                  className="bg-background"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Rex, Mel..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pet-species">Espécie *</Label>
                <Select
                  value={formData.species}
                  onValueChange={(value) => setFormData({ ...formData, species: value as any })}
                >
                  <SelectTrigger id="pet-species" className="bg-background">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pet-gender">Sexo *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as 'Macho' | 'Fêmea' })}
                >
                  <SelectTrigger id="pet-gender" className="bg-background">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Macho">Macho</SelectItem>
                    <SelectItem value="Fêmea">Fêmea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="pet-breed">Raça *</Label>
                <Input
                  id="pet-breed"
                  className="bg-background"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="Ex: Golden Retriever"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Data de Nascimento *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  className="bg-background appearance-none"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  className="bg-background"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="0.0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações do Pet</Label>
              <Textarea
                id="notes"
                className="bg-background"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Alergias, temperamento, etc..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Salvando...
                </div>
              ) : isEditing ? 'Salvar Alterações' : 'Cadastrar Tudo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { PlusCircle } from 'lucide-react'
