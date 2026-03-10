'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/data-store'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })
import { useRef } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Scissors, Save, ArrowLeft, History, FileDown, Printer, DollarSign, Plus, Trash2, Activity, HeartPulse } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactToPrint from 'react-to-print'
import { usePet, useOwner } from '@/lib/data-store'
import { Badge } from '@/components/ui/badge'

interface CirurgiaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

const TIPOS_ANESTESIA = [
    'Anestesia geral inalatória',
    'Anestesia geral intravenosa (TIVA)',
    'Anestesia dissociativa',
    'Bloqueio regional / epidural',
    'Sedação + anestesia local',
]

const MATERIAIS_SUTURA = [
    'Nylon', 'Poliglactina 910 (Vicryl)', 'Polidioxanona (PDS)',
    'Categute cromado', 'Polipropileno (Prolene)', 'Ácido poliglicólico (Dexon)',
]

export function CirurgiaDialog({ open, onOpenChange, onBack, petId, petName }: CirurgiaDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')

    const isFemale = pet?.gender === 'Fêmea'
    const themeColor = {
        bg: isFemale ? 'bg-pink-600' : 'bg-blue-600',
        bgHover: isFemale ? 'hover:bg-pink-700' : 'hover:bg-blue-700',
        bgGhost: isFemale ? 'bg-pink-500/10' : 'bg-blue-500/10',
        bgLight: isFemale ? 'bg-pink-50' : 'bg-blue-50',
        text: isFemale ? 'text-pink-600' : 'text-blue-600',
        border: isFemale ? 'border-pink-500' : 'border-blue-500',
        borderLight: isFemale ? 'border-pink-200' : 'border-blue-200',
    }

    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

    // Form fields
    const [procedimento, setProcedimento] = useState('')
    const [tecnica, setTecnica] = useState('')
    const [tipoAnestesia, setTipoAnestesia] = useState('')
    const [duracao, setDuracao] = useState('')
    const [protocolo, setProtocolo] = useState('')
    const [materiais, setMateriais] = useState<string[]>([])
    const [intercorrencias, setIntercorrencias] = useState('')
    const [posOperatorio, setPosOperatorio] = useState('')
    const [prescricao, setPrescricao] = useState('')
    const [retorno, setRetorno] = useState('')
    const [veterinarian, setVeterinarian] = useState('Dr. Cleyton Chaves')

    // Billing state
    const [baseValue, setBaseValue] = useState('0.00')
    const [services, setServices] = useState<{ id: string, name: string, value: number }[]>([])

    const printRef = useRef<HTMLDivElement>(null)

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ]
    }

    const toggleMaterial = (mat: string) => {
        setMateriais(prev => prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat])
    }

    const resetForm = () => {
        setProcedimento('')
        setTecnica('')
        setTipoAnestesia('')
        setDuracao('')
        setProtocolo('')
        setMateriais([])
        setIntercorrencias('')
        setPosOperatorio('')
        setPrescricao('')
        setRetorno('')
        setDate(format(new Date(), 'yyyy-MM-dd'))
    }

    const handleSave = async () => {
        if (!procedimento.trim()) {
            toast.error('Preencha o procedimento realizado')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const { error } = await (supabase.from('medical_records' as any).insert([{
                pet_id: petId,
                user_id: userData.user?.id,
                type: 'surgery',
                title: procedimento,
                description: JSON.stringify({
                    tecnica,
                    tipoAnestesia,
                    duracao,
                    protocolo,
                    materiais,
                    intercorrencias,
                    posOperatorio,
                    prescricao,
                    retorno,
                    billing: {
                        baseValue: parseFloat(baseValue),
                        services: services,
                        total: parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)
                    }
                }),
                date: new Date(date).toISOString(),
                veterinarian: veterinarian || 'Dr. Cleyton Chaves',
            }] as any) as any)

            if (error) throw error

            mutate('medical-records')
            toast.success('Registro cirúrgico salvo com sucesso!')
            resetForm()
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar registro cirúrgico')
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
                            <Scissors className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Cirurgia - {petName}</DialogTitle>
                            <DialogDescription>Registro e ficha de procedimento cirúrgico</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Form Side */}
                    <div className="w-full md:w-1/2 p-6 border-r border-border/30 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Procedimento Realizado *</Label>
                                    <Input
                                        placeholder="Ex: Ovariohisterectomia"
                                        value={procedimento}
                                        onChange={(e) => setProcedimento(e.target.value)}
                                        className="focus:ring-red-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data da Cirurgia *</Label>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Técnica Cirúrgica</Label>
                                <div className="bg-white text-black rounded-md overflow-hidden border border-input shadow-inner">
                                    <ReactQuill
                                        theme="snow"
                                        value={tecnica}
                                        onChange={setTecnica}
                                        modules={modules}
                                        className="h-[120px] mb-12"
                                        placeholder="Descreva a técnica utilizada..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Anestesia</Label>
                                    <Select value={tipoAnestesia} onValueChange={setTipoAnestesia}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIPOS_ANESTESIA.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duração (min)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={duracao}
                                        onChange={(e) => setDuracao(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Protocolo Anestésico</Label>
                                <Textarea
                                    placeholder="MPA, indução, manutenção, fármacos e doses..."
                                    value={protocolo}
                                    onChange={(e) => setProtocolo(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Materiais de Sutura</Label>
                                <div className="grid grid-cols-2 gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                                    {MATERIAIS_SUTURA.map((mat) => (
                                        <label key={mat} className="flex items-center gap-2 text-[10px] cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors uppercase font-medium">
                                            <Checkbox
                                                checked={materiais.includes(mat)}
                                                onCheckedChange={() => toggleMaterial(mat)}
                                            />
                                            {mat}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Intercorrências</Label>
                                    <Textarea
                                        placeholder="Descreva intercorrências durante o procedimento (se houver)..."
                                        value={intercorrencias}
                                        onChange={(e) => setIntercorrencias(e.target.value)}
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pós-operatório Imediato</Label>
                                    <Textarea
                                        placeholder="Estado do paciente na recuperação anestésica..."
                                        value={posOperatorio}
                                        onChange={(e) => setPosOperatorio(e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prescrição Pós-operatória</Label>
                                <div className="bg-white text-black rounded-md overflow-hidden border border-input shadow-inner">
                                    <ReactQuill
                                        theme="snow"
                                        value={prescricao}
                                        onChange={setPrescricao}
                                        modules={modules}
                                        className="h-[150px] mb-12"
                                        placeholder="Medicamentos, curativos, restrições..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Retorno Previsto</Label>
                                <Input
                                    placeholder="Ex: 10 dias para retirada de pontos"
                                    value={retorno}
                                    onChange={(e) => setRetorno(e.target.value)}
                                />
                            </div>

                            {/* Billing Section */}
                            <div className={`p-4 rounded-xl border-2 border-dashed ${themeColor.border}/20 ${themeColor.bgLight}/30 space-y-3`}>
                                <div className={`flex items-center gap-2 ${themeColor.text} font-bold text-xs uppercase tracking-wider`}>
                                    <DollarSign className="size-4" />
                                    Procedimento e Custos
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Valor da Cirurgia (R$)</Label>
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
                                            onClick={() => setServices([...services, { id: Math.random().toString(), name: 'Cirurgia Adicional', value: 0 }])}
                                        >
                                            <Plus className="size-3 mr-1" /> Add Serviço
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
                                    <span>Total Faturado:</span>
                                    <span>R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={handleSave} disabled={loading} className={`flex-1 ${themeColor.bg} ${themeColor.bgHover} text-white shadow-lg`}>
                                    <Save className="size-4 mr-2" />
                                    {loading ? 'Salvando...' : 'Finalizar Cirurgia'}
                                </Button>

                                {/* @ts-ignore */}
                                <ReactToPrint
                                    trigger={() => (
                                        <Button variant="outline" className="flex-1">
                                            <Printer className="size-4 mr-2" />
                                            Gerar Relatório A4
                                        </Button>
                                    )}
                                    content={() => printRef.current}
                                    documentTitle={`Cirurgia_${procedimento}_${petName}_${format(new Date(), 'dd_MM_yyyy')}`}
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
                                    <h2 className={`text-2xl font-bold uppercase tracking-widest ${themeColor.text}`}>Relatório Cirúrgico</h2>
                                    <p className="text-[10px] opacity-70 mt-1 uppercase">Ficha Técnica de Procedimento Invasivo</p>
                                </div>
                                <div className={`text-right ${themeColor.text}`}>
                                    <Scissors className="size-10 ml-auto mb-1 opacity-20" />
                                    <p className="text-[8px] font-bold">AgendaVet Medical Unit</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10 bg-muted/20 p-5 rounded-xl border border-border/50">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Informações do Paciente</p>
                                    <p className="text-sm font-bold">{petName}</p>
                                    <p className="text-[10px] opacity-70">{pet?.species} | {pet?.breed}</p>
                                    <p className="text-[10px] opacity-70">Peso: {pet?.weight || '-'} kg | Sexo: {pet?.gender}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Responsável</p>
                                    <p className="text-sm font-bold">{owner?.fullName || 'S/R'}</p>
                                    <p className="text-[10px] opacity-70">{owner?.phone || 'Sem contato'}</p>
                                    <p className="text-[10px] opacity-70">Data: {format(new Date(date), 'dd/MM/yyyy')}</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-8 text-slate-800 pb-10">
                                <section className={`p-5 rounded-xl bg-muted/30 border-l-4 ${themeColor.border}`}>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text}`}>Procedimento Principal</h3>
                                    <p className="text-lg font-bold italic">{procedimento || "Relatório em preenchimento..."}</p>
                                </section>

                                <div className="grid grid-cols-2 gap-8">
                                    <section>
                                        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Anestesia</h3>
                                        <p className="text-[11px] font-bold">{tipoAnestesia || "-"}</p>
                                        <p className="text-[10px] opacity-70 mt-1">Duração: {duracao || "0"} min</p>
                                        <p className="text-[10px] mt-2 italic text-muted-foreground">{protocolo || "Protocolo não informado"}</p>
                                    </section>
                                    <section>
                                        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Materiais de Sutura</h3>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {materiais.length > 0 ? materiais.map(m => (
                                                <Badge key={m} variant="outline" className={`text-[8px] h-4 ${themeColor.border}/50`}>{m}</Badge>
                                            )) : <span className="text-[10px] opacity-40">Nenhum informado</span>}
                                        </div>
                                    </section>
                                </div>

                                <section>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Descrição da Técnica</h3>
                                    <div className="text-[11px] leading-relaxed prose prose-sm max-w-none prose-p:my-0.5" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tecnica || "Descrição técnica...") }} />
                                </section>

                                <div className="grid grid-cols-2 gap-8">
                                    <section>
                                        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Intercorrências</h3>
                                        <p className="text-[10px] leading-relaxed">{intercorrencias || "Sem intercorrências registradas."}</p>
                                    </section>
                                    <section>
                                        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Recuperação (Pós-Op)</h3>
                                        <p className="text-[10px] leading-relaxed">{posOperatorio || "Paciente em observação."}</p>
                                    </section>
                                </div>

                                <section>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Recomendações e Prescrição</h3>
                                    <div className="text-[11px] leading-relaxed prose prose-sm max-w-none prose-p:my-0.5" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(prescricao || "Condutas pós-cirúrgicas...") }} />
                                    <p className="text-[10px] font-bold mt-4 italic text-muted-foreground">Retorno Previsto: {retorno || "A definir"}</p>
                                </section>
                            </div>

                            <div className="mt-auto pt-10 flex justify-between items-end border-t border-dashed">
                                <div className="text-[9px] opacity-40 italic">Relatório profissional gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
                                <div className="text-center w-64">
                                    <div className={`h-[1px] w-full ${themeColor.border} mb-3`}></div>
                                    <p className="text-[11px] font-bold uppercase">{veterinarian || 'Dr. Cleyton Chaves'}</p>
                                    <p className="text-[9px] opacity-60">Médico Veterinário Sênior</p>
                                    <p className="text-[8px] opacity-60 tracking-widest">CRMV-SP / REGISTRO AgendaVet</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    )
}
