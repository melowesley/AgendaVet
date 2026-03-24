'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useOwner, usePets, useAppointments } from '@/lib/data-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Phone,
  Mail,
  MapPin,
  PawPrint,
  Calendar,
  Edit,
  ArrowLeft,
  Plus,
} from 'lucide-react'
import { OwnerFormDialog } from './owner-form-dialog'
import { PetFormDialog } from '@/components/pets/pet-form-dialog'

interface OwnerDetailContentProps {
  ownerId: string
}

export function OwnerDetailContent({ ownerId }: OwnerDetailContentProps) {
  const { owner, isLoading } = useOwner(ownerId)
  const { pets } = usePets()
  const { appointments } = useAppointments()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addPetDialogOpen, setAddPetDialogOpen] = useState(false)

  const ownerPets = pets.filter((p) => p.ownerId === ownerId)
  const ownerAppointments = appointments
    .filter((a) => a.ownerId === ownerId)
    .sort((a, b) => b.date.localeCompare(a.date))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading client details...</div>
      </div>
    )
  }

  if (!owner) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Users className="size-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold">Cliente Não Encontrado</h2>
        <p className="text-muted-foreground mb-4">O cliente solicitado não pôde ser encontrado.</p>
        <Button asChild>
          <Link href="/owners">
            <ArrowLeft className="size-4 mr-2" />
            Voltar para Clientes
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/owners">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {owner.firstName} {owner.lastName}
              </h1>
              <p className="text-muted-foreground">Cliente desde {new Date(owner.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>
          <Edit className="size-4 mr-2" />
          Editar Cliente
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PawPrint className="size-5" />
                  Pets
                </CardTitle>
                <CardDescription>{ownerPets.length} pets cadastrados</CardDescription>
              </div>
              <Button size="sm" onClick={() => setAddPetDialogOpen(true)}>
                <Plus className="size-4 mr-2" />
                Adicionar Pet
              </Button>
            </CardHeader>
            <CardContent>
              {ownerPets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pet cadastrado para este cliente
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {ownerPets.map((pet) => (
                    <Link
                      key={pet.id}
                      href={`/pets/${pet.id}`}
                      className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <PawPrint className="size-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{pet.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {pet.breed} ({pet.species})
                        </p>
                      </div>
                      <Badge variant="secondary">{pet.weight} kg</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                Histórico de Atendimentos
              </CardTitle>
              <CardDescription>Todos os agendamentos deste cliente</CardDescription>
            </CardHeader>
            <CardContent>
              {ownerAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum histórico de agendamentos
                </div>
              ) : (
                <div className="space-y-4">
                  {ownerAppointments.slice(0, 6).map((apt) => {
                    const pet = pets.find((p) => p.id === apt.petId)
                    return (
                      <div
                        key={apt.id}
                        className="flex items-start justify-between gap-4 rounded-lg border p-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{pet?.name || 'Pet Desconhecido'}</span>
                            <Badge variant="outline" className="capitalize">
                              {apt.type === 'checkup' ? 'Check-up' : 
                               apt.type === 'vaccination' ? 'Vacinação' :
                               apt.type === 'surgery' ? 'Cirurgia' :
                               apt.type === 'grooming' ? 'Banho e Tosa' :
                               apt.type === 'emergency' ? 'Emergência' :
                               apt.type === 'follow-up' ? 'Retorno' :
                               (apt.type as string).replace('-', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(apt.date).toLocaleDateString('pt-BR', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            às {apt.time}
                          </p>
                          <p className="text-sm text-muted-foreground">{apt.veterinarian}</p>
                        </div>
                        <Badge
                          variant={
                            apt.status === 'completed'
                              ? 'secondary'
                              : apt.status === 'confirmed'
                                ? 'default'
                                : apt.status === 'cancelled'
                                  ? 'destructive'
                                  : 'outline'
                          }
                        >
                          {apt.status === 'completed' ? 'Concluído' :
                           apt.status === 'confirmed' ? 'Confirmado' :
                           apt.status === 'cancelled' ? 'Cancelado' :
                           apt.status === 'scheduled' ? 'Agendado' :
                           apt.status === 'in-progress' ? 'Em Andamento' :
                           apt.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                  <Phone className="size-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{owner.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                  <Mail className="size-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium break-all">{owner.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">{owner.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Pets</span>
                <span className="font-medium">{ownerPets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Agendamentos</span>
                <span className="font-medium">{ownerAppointments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visitas Concluídas</span>
                <span className="font-medium">
                  {ownerAppointments.filter((a) => a.status === 'completed').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <OwnerFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} owner={owner} />
      <PetFormDialog
        open={addPetDialogOpen}
        onOpenChange={setAddPetDialogOpen}
        pet={{ ownerId } as any}
      />
    </div>
  )
}
