'use client'

import { useState } from 'react'
import { usePets, useOwners, deletePet } from '@/lib/data-store'
import type { Pet } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Search, MoreHorizontal, Edit, Trash2, PawPrint, Eye } from 'lucide-react'
import Link from 'next/link'
import { PetFormDialog } from './pet-form-dialog'

const speciesIcons: Record<string, string> = {
  dog: 'Cachorro',
  cat: 'Gato',
  bird: 'Pássaro',
  rabbit: 'Coelho',
  reptile: 'Réptil',
  other: 'Outro',
}

type SpeciesFilter = Pet['species'] | 'all'

export function PetsContent() {
  const { pets, isLoading: petsLoading } = usePets()
  const { owners, isLoading: ownersLoading } = useOwners()
  const isLoading = petsLoading || ownersLoading
  const [searchQuery, setSearchQuery] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null)

  const getOwnerName = (ownerId: string) => {
    const owner = owners.find((o) => o.id === ownerId)
    return owner ? `${owner.firstName} ${owner.lastName}` : 'Desconhecido'
  }

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/I'
    const today = new Date()
    const birth = new Date(dateOfBirth)
    if (isNaN(birth.getTime())) return dateOfBirth // Return raw string if not a date (some apps use '3 years')

    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return `${age} anos`
  }

  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getOwnerName(pet.ownerId).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSpecies = speciesFilter === 'all' || pet.species === speciesFilter
    return matchesSearch && matchesSpecies
  })

  const speciesOptions: { value: SpeciesFilter; label: string }[] = [
    { value: 'all', label: 'Todas Espécies' },
    { value: 'dog', label: 'Cachorros' },
    { value: 'cat', label: 'Gatos' },
    { value: 'bird', label: 'Pássaros' },
    { value: 'rabbit', label: 'Coelhos' },
    { value: 'reptile', label: 'Répteis' },
    { value: 'other', label: 'Outros' },
  ]

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet)
    setDialogOpen(true)
  }

  const handleDelete = (pet: Pet) => {
    setDeletingPet(pet)
  }

  const confirmDelete = () => {
    if (deletingPet) {
      deletePet(deletingPet.id)
      setDeletingPet(null)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingPet(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie os registros dos pacientes</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 shadow-lg shadow-emerald-500/25 transition-all w-full sm:w-auto"
        >
          <Plus className="size-4 mr-2" />
          Adicionar Pet
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Prontuários</CardTitle>
              <CardDescription>{filteredPets.length} pets registrados</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar pets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {speciesOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setSpeciesFilter(option.value === speciesFilter ? 'all' : option.value)
                    }
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${speciesFilter === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PawPrint className="size-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum pet encontrado</h3>
              <p className="text-muted-foreground">
                {searchQuery || speciesFilter !== 'all'
                  ? 'Tente ajustar seus filtros'
                  : 'Comece adicionando seu primeiro pet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Espécie</TableHead>
                    <TableHead className="hidden md:table-cell">Raça</TableHead>
                    <TableHead className="hidden sm:table-cell">Idade</TableHead>
                    <TableHead className="hidden lg:table-cell">Peso</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPets.map((pet) => (
                    <TableRow key={pet.id} className="group hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-background shadow-sm ${pet.species === 'dog' ? 'border-emerald-500 text-emerald-500' :
                            pet.species === 'cat' ? 'border-indigo-500 text-indigo-500' :
                              'border-orange-500 text-orange-500'
                            }`}>
                            {pet.species === 'dog' ? <PawPrint className="size-5" /> : <div className="font-bold text-sm">{pet.name.charAt(0)}</div>}
                          </div>
                          <Link
                            href={`/pets/${pet.id}`}
                            className="font-semibold hover:text-emerald-500 transition-colors"
                          >
                            {pet.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-background/50 backdrop-blur-sm whitespace-nowrap">
                          {speciesIcons[pet.species] || pet.species}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{pet.breed}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {calculateAge(pet.dateOfBirth)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{pet.weight} kg</TableCell>
                      <TableCell>
                        <Link
                          href={`/owners/${pet.ownerId}`}
                          className="hover:text-emerald-500 transition-colors font-medium"
                        >
                          {getOwnerName(pet.ownerId)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="hidden lg:flex border-emerald-500/30 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                          >
                            <Link href={`/pets/${pet.id}`}>
                              <Eye className="size-4 mr-1.5" />
                              Ver Ficha
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Ações</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild className="lg:hidden">
                                <Link href={`/pets/${pet.id}`}>
                                  <Eye className="size-4 mr-2 text-emerald-500" />
                                  Ver Ficha
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(pet)}>
                                <Edit className="size-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(pet)}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              >
                                <Trash2 className="size-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PetFormDialog open={dialogOpen} onOpenChange={handleDialogClose} pet={editingPet} />

      <AlertDialog open={!!deletingPet} onOpenChange={() => setDeletingPet(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pet</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {deletingPet?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
