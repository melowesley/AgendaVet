'use client'

import { useEffect, useState } from 'react'
import { TutorLayout } from '@/components/tutor/tutor-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { PawPrint, Plus, Search, MoreHorizontal, Edit, Trash2, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  date_of_birth: string | null
  weight: number | null
  color: string | null
  gender: string | null
  microchip: string | null
}

const speciesLabels: Record<string, string> = {
  dog: '🐶 Cachorro',
  cat: '🐱 Gato',
  bird: '🐦 Pássaro',
  rabbit: '🐰 Coelho',
  reptile: '🦎 Réptil',
  other: '🐾 Outro',
}

const speciesColors: Record<string, string> = {
  dog: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  cat: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  bird: 'bg-sky-500/15 text-sky-600 border-sky-500/30',
  rabbit: 'bg-pink-500/15 text-pink-600 border-pink-500/30',
  reptile: 'bg-green-500/15 text-green-600 border-green-500/30',
  other: 'bg-muted text-muted-foreground',
}

const emptyForm = {
  name: '',
  species: '',
  breed: '',
  date_of_birth: '',
  weight: '',
  color: '',
  gender: '',
  microchip: '',
}

export default function TutorPetsPage() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchPets = async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('pets')
      .select('id, name, species, breed, date_of_birth, weight, color, gender, microchip')
      .eq('owner_id', uid)
      .order('name')
    setPets(data || [])
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/tutor/login'); return }
      setUserId(session.user.id)
      await fetchPets(session.user.id)
      setLoading(false)
    }
    init()
  }, [router])

  const openCreateDialog = () => {
    setEditingPet(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (pet: Pet) => {
    setEditingPet(pet)
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      date_of_birth: pet.date_of_birth || '',
      weight: pet.weight?.toString() || '',
      color: pet.color || '',
      gender: pet.gender || '',
      microchip: pet.microchip || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.species || !userId) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: form.name,
      species: form.species,
      breed: form.breed || null,
      date_of_birth: form.date_of_birth || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      color: form.color || null,
      gender: form.gender || null,
      microchip: form.microchip || null,
      owner_id: userId,
    }

    if (editingPet) {
      await supabase.from('pets').update(payload).eq('id', editingPet.id)
    } else {
      await supabase.from('pets').insert(payload)
    }

    await fetchPets(userId)
    setDialogOpen(false)
    setSaving(false)
  }

  const handleDelete = async (pet: Pet) => {
    if (!confirm(`Remover ${pet.name}? Esta ação não pode ser desfeita.`)) return
    const supabase = createClient()
    await supabase.from('pets').delete().eq('id', pet.id)
    if (userId) await fetchPets(userId)
  }

  const calculateAge = (dob: string | null) => {
    if (!dob) return null
    const birth = new Date(dob)
    const now = new Date()
    const years = now.getFullYear() - birth.getFullYear()
    const months = now.getMonth() - birth.getMonth()
    const total = years * 12 + months
    if (total < 12) return `${total}m`
    return `${Math.floor(total / 12)}a`
  }

  const filtered = pets.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.breed || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <TutorLayout breadcrumbs={[{ label: 'Meus Pets' }]}>
      <div className="p-4 md:p-6 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Meus Pets</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{pets.length} pet{pets.length !== 1 ? 's' : ''} cadastrado{pets.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-emerald-500 hover:bg-emerald-600 text-white w-fit">
            <Plus className="size-4 mr-2" />
            Cadastrar Pet
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou raça..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-muted/30 border-border/50 focus-visible:ring-emerald-500"
          />
        </div>

        {/* Lista de pets */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-muted/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <PawPrint className="size-12 text-muted-foreground/30 mb-4" />
              <p className="font-semibold text-muted-foreground">
                {search ? 'Nenhum pet encontrado' : 'Você ainda não tem pets cadastrados'}
              </p>
              {!search && (
                <Button onClick={openCreateDialog} variant="outline" size="sm" className="mt-4 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
                  <Plus className="size-3 mr-1" />
                  Cadastrar primeiro pet
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(pet => (
              <Card key={pet.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-lg">
                        {pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : pet.species === 'bird' ? '🐦' : pet.species === 'rabbit' ? '🐰' : '🐾'}
                      </div>
                      <div>
                        <CardTitle className="text-base">{pet.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{pet.breed || 'Raça não informada'}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(pet)}>
                          <Edit className="size-3.5 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                          onClick={() => handleDelete(pet)}
                        >
                          <Trash2 className="size-3.5 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${speciesColors[pet.species] || 'bg-muted text-muted-foreground'}`}>
                      {speciesLabels[pet.species] || pet.species}
                    </Badge>
                    {pet.gender && (
                      <Badge variant="outline" className="text-xs bg-muted/50">
                        {pet.gender === 'male' ? '♂ Macho' : '♀ Fêmea'}
                      </Badge>
                    )}
                    {pet.date_of_birth && calculateAge(pet.date_of_birth) && (
                      <Badge variant="outline" className="text-xs bg-muted/50">
                        {calculateAge(pet.date_of_birth)}
                      </Badge>
                    )}
                  </div>
                  {pet.weight && (
                    <p className="text-xs text-muted-foreground">{pet.weight} kg</p>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full mt-2 text-xs border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600">
                    <Link href={`/tutor/agendamentos?pet=${pet.id}`}>
                      <Calendar className="size-3 mr-1.5" />
                      Agendar consulta
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Cadastrar / Editar Pet */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPet ? 'Editar Pet' : 'Cadastrar Pet'}</DialogTitle>
            <DialogDescription>
              {editingPet ? `Atualize os dados de ${editingPet.name}` : 'Preencha as informações do seu pet'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Rex"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="species">Espécie *</Label>
                <Select value={form.species} onValueChange={v => setForm(f => ({ ...f, species: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">🐶 Cachorro</SelectItem>
                    <SelectItem value="cat">🐱 Gato</SelectItem>
                    <SelectItem value="bird">🐦 Pássaro</SelectItem>
                    <SelectItem value="rabbit">🐰 Coelho</SelectItem>
                    <SelectItem value="reptile">🦎 Réptil</SelectItem>
                    <SelectItem value="other">🐾 Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="gender">Sexo</Label>
                <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">♂ Macho</SelectItem>
                    <SelectItem value="female">♀ Fêmea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="breed">Raça</Label>
                <Input
                  id="breed"
                  value={form.breed}
                  onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
                  placeholder="Ex: Labrador"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dob">Data de Nascimento</Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.date_of_birth}
                  onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                  placeholder="Ex: 8.5"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="color">Pelagem / Cor</Label>
                <Input
                  id="color"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="Ex: Caramelo"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="microchip">Microchip</Label>
                <Input
                  id="microchip"
                  value={form.microchip}
                  onChange={e => setForm(f => ({ ...f, microchip: e.target.value }))}
                  placeholder="Nº do microchip"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.species || saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {saving ? 'Salvando...' : editingPet ? 'Salvar Alterações' : 'Cadastrar Pet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TutorLayout>
  )
}
