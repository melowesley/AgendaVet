'use client'

import { useState, useRef } from 'react'
import { supabase, usePet, useOwner } from '@/lib/data-store'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ClipboardList, Save, ArrowLeft, Printer, DollarSign, Plus, Trash2, Bed, Activity, Thermometer, HeartPulse } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactToPrint from 'react-to-print'
import { Badge } from '@/components/ui/badge'

interface InternacaoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

export function InternacaoDialog({ open, onOpenChange, onBack, petId, petName }: InternacaoDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')

    const isMale = pet?.gender === 'Macho'
    const themeColor = {
        bg: isMale ? 'bg-blue-600' : 'bg-pink-600',
        bgHover: isMale ? 'hover:bg-blue-700' : 'hover:bg-pink-700',
        bgGhost: isMale ? 'bg-blue-500/10' : 'bg-pink-500/10',
        bgLight: isMale ? 'bg-blue-50' : 'bg-pink-50',
        text: isMale ? 'text-blue-600' : 'text-pink-600',
        border: isMale ? 'border-blue-500' : 'border-pink-500',
        borderLight: isMale ? 'border-blue-200' : 'border-pink-200',
    }

    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

    // Form fields
    const [quarto, setQuarto] = useState('')
    const [motivo, setMotivo] = useState('')
    const [temperatura, setTemperatura] = useState('')
    const [frequenciaCardiaca, setFrequenciaCardiaca] = useState('')
    const [frequenciaRespiratoria, setFrequenciaRespiratoria] = useState('')
    const [estadoGeral, setEstadoGeral] = useState('')
    const [observacoes, setObservacoes] = useState('')
    const [conduta, setConduta] = useState('')
    const [veterinarian, setVeterinarian] = useState('Dr. Cleyton Chaves')

    // Billing state
    const [baseValue, setBaseValue] = useState('0.00')
    const [services, setServices] = useState<{ id: string, name: string, value: number }[]>([])

    const printRef = useRef<HTMLDivElement>(null)

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ]
    }

    const handleSave = async () => {
        if (!quarto.trim() || !motivo.trim()) {
            toast.error('Preencha o quarto/leito e o motivo da internação')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const description = {
                quarto,
                motivo,
                vinais: {
                    temp: temperatura,
                    fc: frequenciaCardiaca,
                    fr: frequenciaRespiratoria
                },
                estadoGeral,
                observacoes,
                conduta,
                billing: {
                    baseValue: parseFloat(baseValue),
                    services: services,
                    total: parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)
                }
            }

            const { error } = await (supabase.from('medical_records' as any).insert([{
                pet_id: petId,
                user_id: userData.user?.id,
                type: 'internacao',
                title: `Internação - ${quarto}`,
                description: JSON.stringify(description),
                date: new Date(date).toISOString(),
                veterinarian: veterinarian || 'Dr. Cleyton Chaves',
            }] as any) as any)

            if (error) throw error

            mutate('medical-records')
            toast.success('Registro de internação salvo!')
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar internação')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-7xl max-h-[95vh] flex flex-col p-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onBack}>
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className={`flex size-10 items-center justify-center rounded-full ${themeColor.bgGhost} ${themeColor.text}`}>
                            <Bed className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Internação - {petName}</DialogTitle>
                            <DialogDescription>Acompanhamento e evolução de paciente internado</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Form Side */}
                    <div className="w-full md:w-1/2 p-6 border-r border-border/30 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Leito / Quarto *</Label>
                                    <Input
                                        placeholder="Ex: Canil 04"
                                        value={quarto}
                                        onChange={(e) => setQuarto(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data de Entrada *</Label>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Motivo da Internação *</Label>
                                <Input
                                    placeholder="Ex: Pós-operatório, Gastroenterite..."
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Temp (°C)</Label>
                                    <Input value={temperatura} onChange={(e) => setTemperatura(e.target.value)} className="h-8 text-sm" placeholder="38.5" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">FC (bpm)</Label>
                                    <Input value={frequenciaCardiaca} onChange={(e) => setFrequenciaCardiaca(e.target.value)} className="h-8 text-sm" placeholder="120" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">FR (mpm)</Label>
                                    <Input value={frequenciaRespiratoria} onChange={(e) => setFrequenciaRespiratoria(e.target.value)} className="h-8 text-sm" placeholder="30" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado Geral</Label>
                                <Input value={estadoGeral} onChange={(e) => setEstadoGeral(e.target.value)} placeholder="Ex: Alerta, Responsivo, Prostrado..." />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evolução / Observações</Label>
                                <Textarea
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    placeholder="Descreva a evolução do paciente..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conduta Médica / Prescrição</Label>
                                <div className="bg-white text-black rounded-md overflow-hidden border border-input shadow-inner">
                                    <ReactQuill
                                        theme="snow"
                                        value={conduta}
                                        onChange={setConduta}
                                        modules={modules}
                                        className="h-[150px] mb-12"
                                        placeholder="Medicamentos, fluidoterapia, exames..."
                                    />
                                </div>
                            </div>

                            {/* Billing Section */}
                            <div className={`p-4 rounded-xl border-2 border-dashed ${themeColor.border}/20 ${themeColor.bgLight}/30 space-y-3`}>
                                <div className={`flex items-center gap-2 ${themeColor.text} font-bold text-xs uppercase tracking-wider`}>
                                    <DollarSign className="size-4" />
                                    Custos de Internação
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Diária Base (R$)</Label>
                                        <Input
                                            type="number"
                                            value={baseValue}
                                            onChange={(e) => setBaseValue(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`w-full h-8 text-[10px] ${themeColor.border}/30 ${themeColor.text}`}
                                            onClick={() => setServices([...services, { id: Math.random().toString(), name: 'Serviço Extra', value: 0 }])}
                                        >
                                            <Plus className="size-3 mr-1" /> Add Extra
                                        </Button>
                                    </div>
                                </div>

                                {services.map((service, idx) => (
                                    <div key={service.id} className="flex gap-2 items-center">
                                        <Input
                                            value={service.name}
                                            onChange={(e) => {
                                                const newServices = [...services]
                                                newServices[idx].name = e.target.value
                                                setServices(newServices)
                                            }}
                                            placeholder="Nome do serviço"
                                            className="h-7 text-[10px] flex-1"
                                        />
                                        <Input
                                            type="number"
                                            value={service.value}
                                            onChange={(e) => {
                                                const newServices = [...services]
                                                newServices[idx].value = parseFloat(e.target.value) || 0
                                                setServices(newServices)
                                            }}
                                            className="h-7 text-[10px] w-16"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-destructive"
                                            onClick={() => setServices(services.filter((_, i) => i !== idx))}
                                        >
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </div>
                                ))}

                                <div className={`pt-2 border-t ${themeColor.border}/20 flex justify-between items-center text-sm font-bold ${themeColor.text}`}>
                                    <span>Total Acumulado:</span>
                                    <span>R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={handleSave} disabled={loading} className={`flex-1 ${themeColor.bg} ${themeColor.bgHover} text-white shadow-lg`}>
                                    <Save className="size-4 mr-2" />
                                    {loading ? 'Salvando...' : 'Finalizar Registro'}
                                </Button>

                                {/* @ts-ignore */}
                                <ReactToPrint
                                    trigger={() => (
                                        <Button variant="outline" className="flex-1">
                                            <Printer className="size-4 mr-2" />
                                            Imprimir Ficha
                                        </Button>
                                    )}
                                    content={() => printRef.current}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className="hidden md:block w-1/2 bg-muted/10 p-8 overflow-y-auto">
                        <div
                            ref={printRef}
                            className={`w-full max-w-[600px] mx-auto min-h-[842px] bg-white shadow-2xl rounded-sm border-2 p-10 flex flex-col text-slate-900 ${themeColor.borderLight}`}
                        >
                            <div className={`border-b-2 pb-6 mb-8 flex justify-between items-end ${themeColor.border}`}>
                                <div>
                                    <h2 className={`text-2xl font-bold uppercase tracking-widest ${themeColor.text}`}>Ficha de Internação</h2>
                                    <p className="text-[10px] opacity-70 mt-1 uppercase">Monitoramento Hospitalar Contínuo</p>
                                </div>
                                <div className={`text-right ${themeColor.text}`}>
                                    <Bed className="size-10 ml-auto mb-1 opacity-20" />
                                    <p className="text-[8px] font-bold">AgendaVet Medical Unit</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10 bg-muted/20 p-5 rounded-xl border border-border/50">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Paciente</p>
                                    <p className="text-sm font-bold">{petName}</p>
                                    <p className="text-[10px] opacity-70">{pet?.species} | {pet?.breed}</p>
                                    <p className="text-[10px] opacity-70">Sexo: {pet?.gender} | Peso: {pet?.weight}kg</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Acomodação / Data</p>
                                    <p className="text-sm font-bold">{quarto || "-"}</p>
                                    <p className="text-[10px] opacity-70">Entrada: {format(new Date(date), 'dd/MM/yyyy')}</p>
                                    <p className="text-[10px] opacity-70">Tutor: {owner?.fullName || 'S/R'}</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-8 text-slate-800 pb-10">
                                <section className={`p-5 rounded-xl bg-muted/30 border-l-4 ${themeColor.border}`}>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text}`}>Motivo Principal</h3>
                                    <p className="text-lg font-bold italic">{motivo || "Aguardando preenchimento..."}</p>
                                </section>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-muted/30 p-4 rounded-xl text-center border border-border/50">
                                        <Thermometer className="size-4 mx-auto mb-1 opacity-40" />
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Temperatura</p>
                                        <p className="text-sm font-bold font-mono">{temperatura || "--"}°C</p>
                                    </div>
                                    <div className="bg-muted/30 p-4 rounded-xl text-center border border-border/50">
                                        <HeartPulse className="size-4 mx-auto mb-1 opacity-40" />
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">F. Cardíaca</p>
                                        <p className="text-sm font-bold font-mono">{frequenciaCardiaca || "--"} bpm</p>
                                    </div>
                                    <div className="bg-muted/30 p-4 rounded-xl text-center border border-border/50">
                                        <Activity className="size-4 mx-auto mb-1 opacity-40" />
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">F. Resp</p>
                                        <p className="text-sm font-bold font-mono">{frequenciaRespiratoria || "--"} mpm</p>
                                    </div>
                                </div>

                                <section>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Estado Geral do Paciente</h3>
                                    <p className="text-[12px] font-medium leading-relaxed mt-2">{estadoGeral || "Paciente em observação..."}</p>
                                </section>

                                <section>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Evolução / Observações Clínica</h3>
                                    <p className="text-[11px] leading-relaxed mt-2 whitespace-pre-wrap">{observacoes || "Nenhuma observação registrada."}</p>
                                </section>

                                <section>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Conduta e Prescrição Terapêutica</h3>
                                    <div className="text-[11px] leading-relaxed prose prose-sm max-w-none mt-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(conduta || "Aguardando prescrição...") }} />
                                </section>
                            </div>

                            <div className="mt-auto pt-10 flex justify-between items-end border-t border-dashed">
                                <div className="text-[9px] opacity-40 italic">Documento hospitalar gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
                                <div className="text-center w-64">
                                    <div className={`h-[1px] w-full ${themeColor.border} mb-3`}></div>
                                    <p className="text-[11px] font-bold uppercase">{veterinarian || 'Dr. Cleyton Chaves'}</p>
                                    <p className="text-[9px] opacity-60">Médico Veterinário Responsável</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
