'use client'

import React, { useState } from "react"
import { useMedicalRecords, usePets, useOwners } from '@/lib/data-store'
import type { MedicalRecord, Owner, Pet } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Search,
  FileText,
  Syringe,
  Stethoscope,
  Pill,
  FlaskConical,
  StickyNote,
  User,
  Phone,
  Mail,
  MapPin,
  PawPrint,
  Activity,
  HeartPulse,
  ClipboardList,
  Scale,
  Scissors,
  Skull,
  Camera,
  Video,
  RotateCcw,
  MoreHorizontal
} from 'lucide-react'
import { AttendanceTypeDialog } from "../admin/attendance/attendance-type-dialog"
import { ConsultaDialog } from "../admin/modules/consulta-dialog"
import { VacinaDialog } from "../admin/modules/vacina-dialog"
import { CirurgiaDialog } from "../admin/modules/cirurgia-dialog"
import { PesoDialog } from "../admin/modules/peso-dialog"
import { InternacaoDialog } from "../admin/modules/internacao-dialog"
import { ObitoDialog } from "../admin/modules/obito-dialog"
import { BanhoTosaDialog } from "../admin/modules/banho-tosa-dialog"
import { ReceitaDialog } from "../admin/modules/receita-dialog"
import { ExameDialog } from "../admin/modules/exame-dialog"
import { RetornoDialog } from "../admin/modules/retorno-dialog"
import { GaleriaDialog } from "../admin/modules/galeria-dialog"
import { DocumentoJuridicoDialog } from "../admin/modules/documento-juridico-dialog"
import { MedicalRecordDetailDialog } from "./medical-record-detail-dialog"
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { differenceInYears, differenceInMonths, parseISO } from 'date-fns'

type TypeFilter = MedicalRecord['type'] | 'all'

const calculateAge = (dob: string) => {
  if (!dob) return 'Idade desconhecida'
  try {
    const dateOfBirth = parseISO(dob)
    const years = differenceInYears(new Date(), dateOfBirth)
    if (years === 0) {
      const months = differenceInMonths(new Date(), dateOfBirth)
      return `${months} Meses`
    }
    return `${years} Anos`
  } catch (e) {
    return dob
  }
}

const recordTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  vaccination: Syringe,
  vacina: Syringe,
  diagnosis: Stethoscope,
  consulta: Stethoscope,
  prescription: Pill,
  receita: Pill,
  procedure: Activity,
  procedimento: Activity,
  'lab-result': FlaskConical,
  exame: FlaskConical,
  note: StickyNote,
  observacao: StickyNote,
  cirurgia: HeartPulse,
  internacao: ClipboardList,
  peso: Scale,
  'banho-tosa': Scissors,
  obito: Skull,
  documento: FileText,
  fotos: Camera,
  video: Video,
  retorno: RotateCcw,
  outros: MoreHorizontal,
}

const recordTypeLabels: Record<string, string> = {
  vaccination: 'Vacina',
  vacina: 'Vacina',
  diagnosis: 'Consulta',
  consulta: 'Consulta',
  prescription: 'Receita',
  receita: 'Receita',
  procedure: 'Procedimento',
  procedimento: 'Procedimento',
  'lab-result': 'Exame',
  exame: 'Exame',
  note: 'Observação',
  observacao: 'Observação',
  cirurgia: 'Cirurgia',
  internacao: 'Internação',
  peso: 'Peso',
  'banho-tosa': 'Banho e Tosa',
  obito: 'Óbito',
  documento: 'Documento',
  fotos: 'Fotos',
  video: 'Vídeo',
  retorno: 'Retorno',
  outros: 'Outros',
}

// Dialog to display Tutor info
function TutorInfoDialog({ open, onOpenChange, tutor, pet }: { open: boolean, onOpenChange: (o: boolean) => void, tutor: Owner | null, pet: Pet | null }) {
  if (!tutor) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-emerald-500/20 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Informações do Tutor</DialogTitle>
        </DialogHeader>
        <div className="bg-emerald-500 p-6 flex items-center gap-4 text-primary-foreground">
          <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/40">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{tutor.fullName || `${tutor.firstName} ${tutor.lastName}`}</h2>
            <p className="opacity-90 flex items-center gap-1 text-sm mt-1">
              <PawPrint className="h-3.5 w-3.5" /> Tutor de {pet?.name || 'Pet'}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</span>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-emerald-500" />
                {tutor.whatsapp || tutor.phone || 'Não informado'}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</span>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-emerald-500" />
                <span className="truncate" title={tutor.email}>{tutor.email || 'Não informado'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço</span>
            <div className="flex items-start gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>{tutor.address || 'Endereço não cadastrado'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gênero</span>
              <p className="text-sm font-medium">{tutor.gender || 'Não informado'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Idade</span>
              <p className="text-sm font-medium">{tutor.age ? `${tutor.age} anos` : 'Não informada'}</p>
            </div>
          </div>
        </div>
        <div className="bg-muted/30 p-4 flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline">Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MedicalRecordsContent() {
  const { records, isLoading } = useMedicalRecords()
  const { pets } = usePets()
  const { owners } = useOwners()

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [tutorDialogOpen, setTutorDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)

  // Specialized Dialogs State
  const [attendanceTypeDialogOpen, setAttendanceTypeDialogOpen] = useState(false)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)

  // New State for Selected Pet Context
  const [selectedPetId, setSelectedPetId] = useState<string>('')

  const getPetName = (petId: string) => pets.find((p) => p.id === petId)?.name || 'Desconhecido'
  const selectedPet = selectedPetId ? pets.find(p => p.id === selectedPetId) || null : null
  const selectedTutor = selectedPet ? owners.find(o => o.id === selectedPet.profileId) || null : null

  const filteredRecords = records
    .filter((record) => {
      // If a specific pet is selected, filter by it
      if (selectedPetId && record.petId !== selectedPetId) {
        return false
      }

      // If no pet selected, show nothing (Pet-centric requirement)
      if (!selectedPetId) return false

      const matchesSearch =
        (record.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (getPetName(record.petId) || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.veterinarian || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === 'all' || record.type === typeFilter
      return matchesSearch && matchesType
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'Todos tipos' },
    { value: 'vaccination', label: 'Vacinas' },
    { value: 'diagnosis', label: 'Consultas' },
    { value: 'prescription', label: 'Receitas' },
    { value: 'procedure', label: 'Procedimentos' },
    { value: 'lab-result', label: 'Exames' },
    { value: 'note', label: 'Observações' },
    { value: 'peso', label: 'Peso' },
    { value: 'cirurgia', label: 'Cirurgias' },
    { value: 'internacao', label: 'Internações' },
    { value: 'banho-tosa', label: 'Banho/Tosa' },
    { value: 'obito', label: 'Óbitos' },
    { value: 'documento', label: 'Documentos' },
    { value: 'fotos', label: 'Fotos' },
    { value: 'video', label: 'Vídeos' },
    { value: 'retorno', label: 'Retornos' },
    { value: 'outros', label: 'Outros' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Carregando prontuários...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prontuários</h1>
          <p className="text-muted-foreground">Visualize e gerencie o histórico médico dos pacientes</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Pet Selector Dropdown inside the Action Bar */}
          <div className="w-full sm:w-[280px]">
            <Select value={selectedPetId} onValueChange={setSelectedPetId}>
              <SelectTrigger className="bg-background border-emerald-500/20 focus:ring-emerald-500">
                <SelectValue placeholder="🔍 Selecione um Paciente..." />
              </SelectTrigger>
              <SelectContent>
                {pets.map(pet => (
                  <SelectItem key={pet.id} value={pet.id}>
                    <div className="flex items-center gap-2">
                      <PawPrint className="size-3 text-muted-foreground" />
                      <span>{pet.name}</span>
                      <span className="text-[10px] text-muted-foreground opacity-60">({pet.species})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPetId && (
            <Button
              onClick={() => setTutorDialogOpen(true)}
              variant="outline"
              className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 sm:w-auto w-full"
            >
              <User className="size-4 mr-2" />
              Ver Tutor
            </Button>
          )}

          <Button
            onClick={() => {
              if (!selectedPetId) {
                toast.error("Por favor, selecione um paciente primeiro.")
                return
              }
              setAttendanceTypeDialogOpen(true)
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-500/25 transition-all sm:w-auto w-full"
          >
            <Plus className="size-4 mr-2" />
            Novo Registro
          </Button>
        </div>
      </div>

      {/* Cartão de Informações do Paciente Selecionado */}
      {selectedPet && (
        <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/20 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-900 border-2 border-emerald-500 flex items-center justify-center shrink-0">
                  <PawPrint className="size-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {selectedPet.name}
                    <Badge variant="outline" className="bg-background/50 border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                      {selectedPet.species}
                    </Badge>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <User className="size-3.5" />
                    Tutor: {selectedTutor?.fullName || `${selectedTutor?.firstName} ${selectedTutor?.lastName}`} 
                    <span className="hidden sm:inline-block text-emerald-500 font-bold px-1 hover:underline cursor-pointer" onClick={() => setTutorDialogOpen(true)}>(Ver Perfil)</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Raça</span>
                  <span className="font-medium text-sm sm:text-base">{selectedPet.breed || 'SRD'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gênero</span>
                  <span className="font-medium text-sm sm:text-base">{selectedPet.gender || 'Não informado'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Idade</span>
                  <span className="font-medium text-sm sm:text-base">{calculateAge(selectedPet.dateOfBirth)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Peso</span>
                  <span className="font-medium text-sm sm:text-base">{selectedPet.weight ? `${selectedPet.weight} kg` : 'N/D'}</span>
                </div>
              </div>
            </div>
            
            {selectedPet.notes && (
              <div className="mt-4 pt-4 border-t border-emerald-500/10">
                <p className="text-sm text-muted-foreground flex gap-2">
                  <StickyNote className="size-4 shrink-0 text-emerald-500" />
                  <span className="leading-relaxed">{selectedPet.notes}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Histórico de Pacientes</CardTitle>
              <CardDescription>
                {filteredRecords.length} registros encontrados
                {selectedPet && ` para o paciente ${selectedPet.name}`}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar em registros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
          </div>
          <div className="flex gap-1 flex-wrap mt-2">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTypeFilter(option.value === typeFilter ? 'all' : option.value)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${typeFilter === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="size-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground">
                {searchQuery || typeFilter !== 'all' || selectedPetId !== 'all'
                  ? 'Tente ajustar seus filtros ou selecionar outro paciente'
                  : 'Comece adicionando o histórico médico dos pets'}
              </p>
            </div>
          ) : (
            <div className="relative space-y-0 border-l-2 border-emerald-500/20 ml-4 lg:ml-6 mt-4 pl-6 lg:pl-8">
              {/* TIMELINE EFFECT */}
              {filteredRecords.map((record) => {
                const Icon = recordTypeIcons[record.type] || FileText
                return (
                  <div key={record.id} className="relative group pb-8 last:pb-0">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[35px] lg:-left-[43px] top-1 h-6 w-6 rounded-full bg-background border-2 border-emerald-500 flex items-center justify-center group-hover:scale-125 transition-transform z-10 shadow-sm">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>

                    <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-4 hover:border-emerald-500/30 hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                          <Icon className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-semibold text-lg hover:text-emerald-500 transition-colors">{record.title}</h3>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-emerald-600/80 font-medium">
                                <span className="font-mono bg-emerald-50 px-2 py-0.5 rounded text-emerald-700 dark:bg-emerald-950/30">
                                  {new Date(record.date).toLocaleDateString('pt-BR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </span>
                                <span>•</span>
                                <Link
                                  href={`/pets/${record.petId}`}
                                  className="hover:underline flex items-center gap-1 text-slate-600 dark:text-slate-400"
                                >
                                  <PawPrint className="size-3.5" />
                                  {getPetName(record.petId)}
                                </Link>
                                <span>•</span>
                                <span className="text-muted-foreground">{record.veterinarian || 'Veterinário não informado'}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-background/50 backdrop-blur-sm shadow-sm border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400">
                              {recordTypeLabels[record.type] || record.type}
                            </Badge>
                          </div>

                          <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm text-foreground/80 leading-relaxed">
                            {record.description}
                          </div>

                          {/* Botões de Ação na Timeline */}
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground hover:text-emerald-600"
                              onClick={() => {
                                setSelectedRecord(record)
                                setDetailDialogOpen(true)
                              }}
                            >
                              <FileText className="size-3.5 mr-1" />
                              Ver Detalhes
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground hover:text-emerald-600"
                              onClick={() => {
                                setSelectedRecord(record)
                                setDetailDialogOpen(true)
                                setTimeout(() => window.print(), 300)
                              }}
                            >
                              Imprimir PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TutorInfoDialog
        open={tutorDialogOpen}
        onOpenChange={setTutorDialogOpen}
        tutor={selectedTutor}
        pet={selectedPet}
      />

      {/* Attendance Orchestration */}
      <AttendanceTypeDialog
        open={attendanceTypeDialogOpen}
        onOpenChange={setAttendanceTypeDialogOpen}
        onSelect={(type) => {
          setAttendanceTypeDialogOpen(false)
          setActiveDialog(type)
        }}
      />

      <ConsultaDialog
        open={activeDialog === 'consulta'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      <VacinaDialog
        open={activeDialog === 'vacina'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      <CirurgiaDialog
        open={activeDialog === 'cirurgia'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      <PesoDialog
        open={activeDialog === 'peso'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      <InternacaoDialog
        open={activeDialog === 'internacao'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      <ObitoDialog
        open={activeDialog === 'obito'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      <BanhoTosaDialog
        open={activeDialog === 'banho-tosa'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      {/* Basic dialogs for other types if needed or just placeholders for now */}
      <ReceitaDialog
        open={activeDialog === 'receita'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      <ExameDialog
        open={activeDialog === 'exame'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      {/* Procedimento usa ConsultaDialog com contexto de procedimento */}
      <ConsultaDialog
        open={activeDialog === 'procedimento'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      {/* Diagnóstico usa ConsultaDialog com contexto de diagnóstico */}
      <ConsultaDialog
        open={activeDialog === 'diagnostico'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      <RetornoDialog
        open={activeDialog === 'retorno'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      <GaleriaDialog
        open={activeDialog === 'fotos' || activeDialog === 'video'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      {/* Observações usa ConsultaDialog como formulário genérico */}
      <ConsultaDialog
        open={activeDialog === 'observacoes'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      <DocumentoJuridicoDialog
        open={activeDialog === 'documento'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        petId={selectedPetId}
        petName={selectedPet?.name || ''}
      />

      <MedicalRecordDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        record={selectedRecord}
        pet={selectedPet}
        owner={selectedTutor}
      />
    </div>
  )
}
