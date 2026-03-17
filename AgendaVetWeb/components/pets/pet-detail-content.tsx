import { useState } from 'react'
import Link from 'next/link'
import DOMPurify from 'dompurify'
import { usePet, useOwner, useMedicalRecords, useAppointments } from '@/lib/data-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import {
  PawPrint, User, Calendar, FileText, Phone, Mail, MapPin, Edit, ArrowLeft,
  Syringe, Stethoscope, Pill, FlaskConical, StickyNote, Activity, Plus, MoreHorizontal, AlertCircle, Folder, Printer,
  Scale, Scissors, Skull, Bed, HeartPulse, Heart
} from 'lucide-react'
import { PetFormDialog } from './pet-form-dialog'
import { MedicalRecordFormDialog } from '../medical-records/medical-record-form-dialog'
import { AttendanceTypeDialog } from '../admin/attendance/attendance-type-dialog'
import { VacinaDialog } from '../admin/modules/vacina-dialog'
import { ConsultaDialog } from '../admin/modules/consulta-dialog'
import { PesoDialog } from '../admin/modules/peso-dialog'
import { ReceitaDialog } from '../admin/modules/receita-dialog'
import { ExameDialog } from '../admin/modules/exame-dialog'
import { CirurgiaDialog } from '../admin/modules/cirurgia-dialog'
import { GaleriaDialog } from '../admin/modules/galeria-dialog'
import { InternacaoDialog } from '../admin/modules/internacao-dialog'
import { ObitoDialog } from '../admin/modules/obito-dialog'
import { BanhoTosaDialog } from '../admin/modules/banho-tosa-dialog'
import type { MedicalRecord } from '@/lib/types'
import { ArchiveDialog } from '@/components/admin/modules/archive-dialog'

interface PetDetailContentProps {
  petId: string
}

const recordTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  vaccination: Syringe,
  diagnosis: Stethoscope,
  prescription: Pill,
  procedure: Activity,
  'lab-result': FlaskConical,
  note: StickyNote,
}

const appointmentTypeLabels: Record<string, string> = {
  checkup: 'Consulta',
  vaccination: 'Vacinação',
  surgery: 'Cirurgia',
  grooming: 'Banho e Tosa',
  emergency: 'Emergência',
  'follow-up': 'Retorno',
}

const medicalRecordTypeLabels: Record<string, string> = {
  vaccination: 'Vacinação',
  diagnosis: 'Diagnóstico',
  prescription: 'Receita',
  procedure: 'Procedimento',
  'lab-result': 'Exame',
  note: 'Observação',
}

export function PetDetailContent({ petId }: PetDetailContentProps) {
  const { pet, isLoading: petLoading } = usePet(petId)
  // Use profileId as the primary link; fall back to legacy ownerId
  const { owner, isLoading: ownerLoading } = useOwner(pet?.profileId || pet?.ownerId || '')
  const { records } = useMedicalRecords(petId)
  const { appointments } = useAppointments()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)
  const [vacinaDialogOpen, setVacinaDialogOpen] = useState(false)
  const [consultaDialogOpen, setConsultaDialogOpen] = useState(false)
  const [pesoDialogOpen, setPesoDialogOpen] = useState(false)
  const [receitaDialogOpen, setReceitaDialogOpen] = useState(false)
  const [exameDialogOpen, setExameDialogOpen] = useState(false)
  const [cirurgiaDialogOpen, setCirurgiaDialogOpen] = useState(false)
  const [galeriaDialogOpen, setGaleriaDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [internacaoDialogOpen, setInternacaoDialogOpen] = useState(false)
  const [obitoDialogOpen, setObitoDialogOpen] = useState(false)
  const [banhoTosaDialogOpen, setBanhoTosaDialogOpen] = useState(false)
  const [recordDialogType, setRecordDialogType] = useState<MedicalRecord['type']>('vaccination')

  const openMedicalRecord = (type: MedicalRecord['type']) => {
    setRecordDialogType(type)
    setRecordDialogOpen(true)
  }

  const handleAttendanceSelect = (type: string) => {
    setAttendanceDialogOpen(false)

    if (type === 'vacina') {
      setVacinaDialogOpen(true)
    } else if (type === 'consulta') {
      setConsultaDialogOpen(true)
    } else if (type === 'peso') {
      setPesoDialogOpen(true)
    } else if (type === 'receita') {
      setReceitaDialogOpen(true)
    } else if (type === 'exame') {
      setExameDialogOpen(true)
    } else if (type === 'cirurgia') {
      setCirurgiaDialogOpen(true)
    } else if (type === 'internacao') {
      setInternacaoDialogOpen(true)
    } else if (type === 'obito') {
      setObitoDialogOpen(true)
    } else if (type === 'banho-tosa') {
      setBanhoTosaDialogOpen(true)
    } else if (type === 'fotos' || type === 'video') {
      setGaleriaDialogOpen(true)
    } else {
      // Map other types to general MedicalRecord types for now
      const mapping: Record<string, MedicalRecord['type']> = {
        'procedimento': 'procedure',
      }

      if (mapping[type]) {
        openMedicalRecord(mapping[type])
      } else {
        openMedicalRecord('note')
      }
    }
  }

  const petAppointments = appointments
    .filter((a) => a.petId === petId)
    .sort((a, b) => b.date.localeCompare(a.date))

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let years = today.getFullYear() - birth.getFullYear()
    const months = today.getMonth() - birth.getMonth()
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--
    }
    const monthAge = months < 0 ? 12 + months : months
    return `${years} anos${monthAge > 0 ? `, ${monthAge} meses` : ''}`
  }

  if (petLoading || ownerLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
        <PawPrint className="size-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold">Paciente não encontrado</h2>
        <p className="text-muted-foreground mb-4">A ficha deste pet não pôde ser localizada.</p>
        <Button asChild variant="outline" className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
          <Link href="/pets">
            <ArrowLeft className="size-4 mr-2" />
            Voltar aos Pacientes
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-background">
      {/* Header do Paciente */}
      <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="shrink-0 hover:bg-muted/50 rounded-full">
              <Link href="/pets">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 bg-card shadow-sm border-emerald-500/50 text-emerald-500">
                {pet.species === 'dog' || pet.species === 'cat' ? <PawPrint className="size-6" /> : <div className="font-bold text-lg">{pet.name.charAt(0)}</div>}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{pet.name}</h1>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Em Atendimento</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 font-mono">
                  <span className="flex items-center gap-1.5"><Activity className="size-3.5" />{pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><FileText className="size-3.5" />{pet.weight} kg</span>
                  <span>•</span>
                  <span>{calculateAge(pet.dateOfBirth)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
              <AlertCircle className="size-4 text-emerald-500" />
              <span>Saldo Regular</span>
            </div>
            <Button
              onClick={() => setArchiveDialogOpen(true)}
              variant="outline"
              className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 transition-colors"
            >
              <Folder className="size-4 mr-2" />
              <span className="hidden sm:inline">Arquivo</span>
            </Button>
            <Button
              onClick={() => setEditDialogOpen(true)}
              variant="outline"
              className="border-border/50 hover:bg-muted/50 transition-colors"
            >
              <Edit className="size-4 mr-2" />
              <span className="hidden sm:inline">Editar Animal</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 w-full">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

          {/* Painel Esquerdo (Ações e Tutor) */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-6 md:sticky md:top-[200px] z-10">
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setAttendanceDialogOpen(true)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 h-12 text-md"
              >
                <Stethoscope className="size-4 mr-2" />
                Iniciar Atendimento
              </Button>
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={() => setReceitaDialogOpen(true)}
                  className="w-full border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                >
                  <Pill className="size-4 mr-2" />
                  Receita
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setVacinaDialogOpen(true)}
                  className="w-full border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                >
                  <Syringe className="size-4 mr-2" />
                  Vacina
                </Button>
              </div>
            </div>

            {owner && (
              <Card className="bg-card/40 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <User className="size-4" />
                    Responsável
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Link
                      href={`/owners/${owner.id}`}
                      className="text-base font-semibold hover:text-emerald-500 transition-colors"
                    >
                      {owner.firstName} {owner.lastName}
                    </Link>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground font-mono">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-muted/50"><Phone className="size-3.5" /></div>
                      <span>{owner.phone || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-muted/50"><Mail className="size-3.5" /></div>
                      <span className="truncate">{owner.email || 'Não informado'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-md bg-muted/50 mt-0.5"><MapPin className="size-3.5" /></div>
                      <span className="leading-snug">{owner.address || 'Não informado'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card/40 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                  <Calendar className="size-4" />
                  Próximos Agendamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {petAppointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Nenhum agendamento futuro.</p>
                ) : (
                  <div className="space-y-3">
                    {petAppointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').slice(0, 3).map((apt) => (
                      <div key={apt.id} className="flex flex-col gap-1.5 border-l-2 border-emerald-500/50 pl-3 py-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm capitalize">{appointmentTypeLabels[apt.type] || apt.type}</span>
                          <span className="text-xs font-mono text-muted-foreground">{apt.time}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(apt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {apt.veterinarian || 'Não atribuído'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Área Principal (Tabs Content) */}
          <div className="md:col-span-8 lg:col-span-9 bg-card/20 rounded-xl border border-border/30 backdrop-blur-sm shadow-sm p-4 md:p-6 min-h-[500px]">
            <Tabs defaultValue="historico" className="w-full">
              <TabsList className="w-full justify-start border-b border-border/50 rounded-none bg-transparent p-0 h-auto space-x-6 mb-6">
                {['Visão Geral', 'Protocolos', 'Histórico', 'Anexos'].map((tab) => {
                  const value = tab.toLowerCase().replace(' ', '-').replace('ã', 'a')
                  return (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="rounded-none border-b-2 border-transparent px-2 py-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors"
                    >
                      {tab}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <TabsContent value="visao-geral" className="mt-0 outline-none animate-in fade-in-50 duration-500">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Raça</span>
                    <span className="font-medium text-lg">{pet.breed || 'SRD'}</span>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Idade</span>
                    <span className="font-medium text-lg">{calculateAge(pet.dateOfBirth).split(' ')[0]} Anos</span>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Peso Atual</span>
                    <span className="font-medium text-lg">{pet.weight} kg</span>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Cadastro em</span>
                    <span className="font-medium text-lg">{new Date(pet.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                {pet.notes && (
                  <div className="mt-6 bg-muted/20 p-5 rounded-xl border border-border/50 border-l-4 border-l-emerald-500/50">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><StickyNote className="size-4" /> Observações Gerais</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">{pet.notes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="historico" className="mt-0 outline-none">
                <div className="pt-2">
                  {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                      <div className="p-4 rounded-full bg-muted/50 mb-4">
                        <FileText className="size-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-lg font-medium">Nenhum histórico médico</h3>
                      <p className="text-muted-foreground text-sm max-w-sm mt-1">Este paciente ainda não possui registros médicos, consultas ou exames lançados.</p>
                      <Button variant="outline" onClick={() => openMedicalRecord('diagnosis')} className="mt-6 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">Registrar Primeiro Atendimento</Button>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-6 space-y-12 pb-12">
                      {records.map((record, index) => {
                        const Icon = recordTypeIcons[record.type] || FileText
                        return (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="relative pl-8 md:pl-10 group"
                          >
                            {/* Marker da Timeline */}
                            <div className="absolute -left-[17px] top-1 flex size-8 items-center justify-center rounded-full bg-background border-2 border-emerald-500 text-emerald-500 shadow-md group-hover:scale-110 transition-transform">
                              <Icon className="size-4" />
                            </div>

                            <Card className="bg-card/60 backdrop-blur-sm border-border/50 hover:bg-card hover:border-border transition-colors shadow-sm">
                              <CardContent className="p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                  <div>
                                    <h4 className="font-semibold text-base flex items-center gap-2 group-hover:text-emerald-500 transition-colors">
                                      {record.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                      <User className="size-3.5" />
                                      {record.veterinarian || 'Clínico Geral'}
                                    </p>
                                  </div>
                                  <div className="flex flex-col sm:items-end gap-2">
                                    <Badge variant="outline" className="w-fit border-emerald-500/20 bg-emerald-500/5 text-emerald-600 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                                      {medicalRecordTypeLabels[record.type] || record.type}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-muted/50 font-sans font-normal w-fit text-xs">
                                      {new Date(record.date).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: 'long', year: 'numeric'
                                      })}
                                    </Badge>
                                  </div>
                                </div>
                                <div
                                  className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1"
                                  dangerouslySetInnerHTML={{ __html: record.description ? DOMPurify.sanitize(record.description) : "" }}
                                />

                                {/* Placeholder para "Ver Exame" sutil */}
                                {(record.type === 'lab-result' || record.type === 'procedure') && (
                                  <div className="mt-4 pt-3 border-t border-border/30 flex justify-end">
                                    <Button variant="ghost" size="sm" className="h-8 text-xs hover:text-emerald-500 hover:bg-emerald-500/10">
                                      <FileText className="size-3.5 mr-1.5" />
                                      Anexos Disponíveis
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="protocolos" className="mt-0 outline-none h-full">
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-muted/5 rounded-xl border border-dashed border-border/50">
                  <div className="p-4 rounded-full bg-emerald-500/10 mb-4 text-emerald-500">
                    <Activity className="size-8" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Protocolos Clínicos</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mt-1">
                    Nenhum protocolo ativo ou tratamento contínuo registrado para este paciente no momento.
                  </p>
                  <Button variant="outline" onClick={() => openMedicalRecord('procedure')} className="mt-6 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
                    <Plus className="size-4 mr-2" />
                    Criar Novo Protocolo
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="anexos" className="mt-0 outline-none h-full">
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-muted/5 rounded-xl border border-dashed border-border/50">
                  <div className="p-4 rounded-full bg-emerald-500/10 mb-4 text-emerald-500">
                    <FileText className="size-8" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Exames e Documentos</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mt-1">
                    Anexe laudos de laboratório, ultrassonografias, receitas assinadas e outras mídias relacionadas ao paciente.
                  </p>
                  <Button variant="outline" onClick={() => openMedicalRecord('lab-result')} className="mt-6 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
                    <Plus className="size-4 mr-2" />
                    Fazer Upload de Arquivo
                  </Button>
                </div>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>

      {/* Footer Fixo Opcional (se houver muitas ações, mas as principais estão no topo/esquerda) */}
      <div className="sticky bottom-0 z-30 mt-auto bg-background/80 backdrop-blur-md border-t border-border/50 px-4 py-3 flex justify-between items-center sm:hidden">
        <Button variant="outline" className="flex-1 mr-2" onClick={() => setEditDialogOpen(true)}>Editar</Button>
        <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">Nova Ação</Button>
      </div>

      <PetFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} pet={pet} />
      <AttendanceTypeDialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
        onSelect={handleAttendanceSelect}
      />
      <VacinaDialog
        open={vacinaDialogOpen}
        onOpenChange={setVacinaDialogOpen}
        petId={petId}
        petName={pet.name}
        onBack={() => {
          setVacinaDialogOpen(false)
          setAttendanceDialogOpen(true)
        }}
      />
      <ConsultaDialog
        open={consultaDialogOpen}
        onOpenChange={setConsultaDialogOpen}
        petId={petId}
        petName={pet.name}
        onBack={() => {
          setConsultaDialogOpen(false)
          setAttendanceDialogOpen(true)
        }}
      />
      <PesoDialog
        open={pesoDialogOpen}
        onOpenChange={setPesoDialogOpen}
        petId={petId}
        petName={pet.name}
        onBack={() => {
          setPesoDialogOpen(false)
          setAttendanceDialogOpen(true)
        }}
      />
      <ReceitaDialog
        open={receitaDialogOpen}
        onOpenChange={setReceitaDialogOpen}
        petId={petId}
        petName={pet.name}
        onBack={() => {
          setReceitaDialogOpen(false)
          setAttendanceDialogOpen(true)
        }}
      />
      <ExameDialog
        open={exameDialogOpen}
        onOpenChange={setExameDialogOpen}
        petId={petId}
        petName={pet.name}
        onBack={() => {
          setExameDialogOpen(false)
          setAttendanceDialogOpen(true)
        }}
      />
      <CirurgiaDialog
        open={cirurgiaDialogOpen}
        onOpenChange={setCirurgiaDialogOpen}
        petId={petId}
        petName={pet.name}
        onBack={() => {
          setCirurgiaDialogOpen(false)
          setAttendanceDialogOpen(true)
        }}
      />
      <GaleriaDialog
        open={galeriaDialogOpen}
        onOpenChange={setGaleriaDialogOpen}
        petId={petId}
        petName={pet.name}
        onBack={() => {
          setGaleriaDialogOpen(false)
          setAttendanceDialogOpen(true)
        }}
      />
      <MedicalRecordFormDialog
        open={recordDialogOpen}
        onOpenChange={setRecordDialogOpen}
        petId={petId}
        defaultType={recordDialogType}
      />
      <ArchiveDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        pet={pet}
        owner={owner}
        records={records}
      />
      <InternacaoDialog
        open={internacaoDialogOpen}
        onOpenChange={setInternacaoDialogOpen}
        petId={petId}
        petName={pet.name}
        onBack={() => {
          setInternacaoDialogOpen(false)
          setAttendanceDialogOpen(true)
        }}
      />
      <ObitoDialog
        open={obitoDialogOpen}
        onOpenChange={setObitoDialogOpen}
        petId={petId}
        petName={pet.name}
        onBack={() => {
          setObitoDialogOpen(false)
          setAttendanceDialogOpen(true)
        }}
      />
      <BanhoTosaDialog
        open={banhoTosaDialogOpen}
        onOpenChange={setBanhoTosaDialogOpen}
        petId={petId}
        petName={pet.name}
        onBack={() => {
          setBanhoTosaDialogOpen(false)
          setAttendanceDialogOpen(true)
        }}
      />
    </div>
  )
}
