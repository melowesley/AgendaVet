'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/data-store'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })
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
import { Scissors, Save, ArrowLeft, History, FileDown, Printer, DollarSign, Plus, Trash2, Activity, HeartPulse, PawPrint, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useReactToPrint } from 'react-to-print'
import { usePet, useOwner, useMedicalRecords } from '@/lib/data-store'
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
    const { records: allRecords } = useMedicalRecords(petId)

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
    const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Cirurgia_${procedimento}_${petName}_${format(new Date(), 'dd_MM_yyyy')}` })

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
            <DialogContent className="w-[95vw] max-w-[1400px] h-[90vh] max-h-[90vh] rounded-2xl p-0 flex flex-col overflow-hidden border border-border/20 shadow-2xl text-slate-800">
                <DialogHeader className="p-4 md:p-6 border-b border-border/50 bg-white flex flex-row items-center justify-between shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100" onClick={onBack}>
                                <ArrowLeft className="size-5" />
                            </Button>
                        )}
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md" style={{background: 'linear-gradient(135deg, #13C8CC, #002653)'}}>
                            <Scissors className="size-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800 flex items-center" style={{background: 'linear-gradient(to right, #13C8CC, #002653)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                                AgendaVet
                            </DialogTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 font-medium">
                                <span className="flex items-center gap-1"><PawPrint className="size-3.5" /> <span className="font-bold text-slate-700">{petName}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 font-bold text-slate-500 uppercase tracking-tighter text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Relatório Cirúrgico</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-bold text-slate-500">
                            Fechar
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className="h-10 px-6 font-black text-white shadow-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700">
                            <Save className="size-4 mr-2" />
                            {loading ? 'Salvando...' : 'Finalizar Cirurgia'}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex bg-slate-100/50">
                    {/* NEW: Left Sidebar with Patient History */}
                    <div className="hidden xl:block w-[380px] bg-slate-50/80 border-r border-border/30 p-8 overflow-y-auto shrink-0 shadow-inner">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-l-4 border-rose-500 pl-4 mb-8">
                            Histórico do Paciente
                        </h3>
                        
                        {allRecords.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center gap-4 opacity-50">
                                <History className="size-10 text-slate-300" />
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Sem registros prévios</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {allRecords.map(record => (
                                    <div key={record.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-rose-500 transition-all hover:shadow-md group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[11px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-[3px]">
                                                {format(new Date(record.date || record.createdAt), "dd/MM/yyyy")}
                                            </span>
                                            <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                                {record.type}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-800 line-clamp-2 leading-snug">{record.title}</h4>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Side */}
                    <div className="w-full md:w-[450px] p-8 bg-white border-r border-border/30 overflow-y-auto shrink-0 shadow-lg z-10 relative">
                        <div className="space-y-8">
                            <div className="flex justify-between items-center border-l-4 border-slate-900 pl-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 leading-none py-1">
                                    Ficha Cirúrgica
                                </h3>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Procedimento Principal *</Label>
                                        <Input
                                            placeholder="Ex: Ovariohisterectomia"
                                            value={procedimento}
                                            onChange={(e) => setProcedimento(e.target.value)}
                                            className="h-12 border-slate-200 rounded-xl font-black text-slate-800 placeholder:font-normal placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data *</Label>
                                            <Input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="h-12 border-slate-200 rounded-xl font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cirurgião</Label>
                                            <Input
                                                value={veterinarian}
                                                onChange={(e) => setVeterinarian(e.target.value)}
                                                className="h-12 border-slate-200 rounded-xl font-black font-mono text-slate-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição da Técnica</Label>
                                    <div className="bg-white text-black rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-rose-500/20">
                                        <ReactQuill
                                            theme="snow"
                                            value={tecnica}
                                            onChange={setTecnica}
                                            modules={modules}
                                            className="min-h-[150px]"
                                            placeholder="Descreva a técnica operatória utilizada..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anestesia</Label>
                                        <Select value={tipoAnestesia} onValueChange={setTipoAnestesia}>
                                            <SelectTrigger className="h-12 border-slate-200 bg-white rounded-xl font-bold">
                                                <SelectValue placeholder="Tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIPOS_ANESTESIA.map((t) => (
                                                    <SelectItem key={t} value={t} className="font-medium">{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duração (min)</Label>
                                        <Input
                                            type="number"
                                            value={duracao}
                                            onChange={(e) => setDuracao(e.target.value)}
                                            className="h-12 border-slate-200 bg-white rounded-xl font-black"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Protocolo e Materiais</Label>
                                    <Textarea
                                        placeholder="Protocolo anestésico (MPA, indução, manutenção...)"
                                        value={protocolo}
                                        onChange={(e) => setProtocolo(e.target.value)}
                                        className="min-h-[80px] border-slate-200 rounded-xl font-medium"
                                    />
                                    <div className="grid grid-cols-2 gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                        {MATERIAIS_SUTURA.map((mat) => (
                                            <label key={mat} className="flex items-center gap-2 text-[10px] font-bold cursor-pointer hover:bg-white p-2 rounded-lg transition-all border border-transparent hover:border-slate-100 uppercase tracking-tighter">
                                                <Checkbox
                                                    checked={materiais.includes(mat)}
                                                    onCheckedChange={() => toggleMaterial(mat)}
                                                />
                                                {mat}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações e Prescrição</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Textarea
                                            placeholder="Intercorrências..."
                                            value={intercorrencias}
                                            onChange={(e) => setIntercorrencias(e.target.value)}
                                            className="min-h-[80px] border-slate-200 rounded-xl text-xs font-medium"
                                        />
                                        <Textarea
                                            placeholder="Recuperação imediata..."
                                            value={posOperatorio}
                                            onChange={(e) => setPosOperatorio(e.target.value)}
                                            className="min-h-[80px] border-slate-200 rounded-xl text-xs font-medium"
                                        />
                                    </div>
                                    <div className="bg-white text-black rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                        <ReactQuill
                                            theme="snow"
                                            value={prescricao}
                                            onChange={setPrescricao}
                                            modules={modules}
                                            className="min-h-[150px]"
                                            placeholder="Prescrição pós-cirúrgica e cuidados em casa..."
                                        />
                                    </div>
                                    <Input
                                        placeholder="Data/Prazo de Retorno"
                                        value={retorno}
                                        onChange={(e) => setRetorno(e.target.value)}
                                        className="h-12 border-slate-200 rounded-xl font-bold"
                                    />
                                </div>

                                {/* Billing Section */}
                                <div className={`p-6 rounded-2xl border-2 border-dashed ${themeColor.border}/20 ${themeColor.bgGhost}-30 space-y-4 shadow-inner`}>
                                    <div className={`flex items-center gap-2 ${themeColor.text} font-black text-[10px] uppercase tracking-[0.2em]`}>
                                        <DollarSign className="size-4" />
                                        Honorários e Procedimentos Extras
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase">Valor Cirurgia (R$)</Label>
                                            <Input
                                                type="number"
                                                value={baseValue}
                                                onChange={(e) => setBaseValue(e.target.value)}
                                                className="h-10 border-slate-200 rounded-xl font-black text-slate-900"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`w-full h-10 text-[10px] font-black uppercase tracking-widest ${themeColor.border}/30 ${themeColor.text} rounded-xl hover:bg-white`}
                                                onClick={() => setServices([...services, { id: Math.random().toString(), name: 'Extra / Material', value: 0 }])}
                                            >
                                                <Plus className="size-3 mr-1" /> Add Extra
                                            </Button>
                                        </div>
                                    </div>

                                    {services.map((service, idx) => (
                                        <div key={service.id} className="flex gap-2 items-center bg-white/50 p-2 rounded-xl border border-slate-100">
                                            <Input
                                                value={service.name}
                                                onChange={(e) => {
                                                    const newServices = [...services]
                                                    newServices[idx].name = e.target.value
                                                    setServices(newServices)
                                                }}
                                                placeholder="Descrição"
                                                className="h-9 text-[10px] flex-1 border-none bg-transparent font-bold"
                                            />
                                            <Input
                                                type="number"
                                                value={service.value}
                                                onChange={(e) => {
                                                    const newServices = [...services]
                                                    newServices[idx].value = parseFloat(e.target.value) || 0
                                                    setServices(newServices)
                                                }}
                                                className="h-9 text-[11px] w-20 border-none bg-transparent font-black text-right"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 rounded-lg"
                                                onClick={() => setServices(services.filter((_, i) => i !== idx))}
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    ))}

                                    <div className={`pt-4 border-t border-slate-200 flex justify-between items-center`}>
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Faturado:</span>
                                        <span className={`text-xl font-black ${themeColor.text}`}>
                                            R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button onClick={handleSave} disabled={loading} className={`flex-1 h-10 font-semibold ${themeColor.bg} ${themeColor.bgHover} text-white shadow-sm rounded-lg`}>
                                        <Save className="size-4 mr-2" />
                                        {loading ? 'Salvando...' : 'Finalizar Cirurgia'}
                                    </Button>
                                    <Button variant="outline" className="h-10 px-4 rounded-lg" onClick={() => handlePrint()}>
                                        <Printer className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Section - A4 Page */}
                    <div className="hidden md:flex flex-1 bg-slate-200/50 p-6 lg:p-12 overflow-y-auto justify-center items-start">
                        <div
                            ref={printRef}
                            className={`w-full max-w-[650px] min-h-[700px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm border p-12 flex flex-col text-slate-900 ${themeColor.borderLight} border-t-8 ${themeColor.border}`}
                        >
                            {/* AgendaVet Header A4 */}
                            <div className="flex justify-between items-start pb-6 mb-8 border-b-2" style={{borderImage: 'linear-gradient(to right, #13C8CC, #002653) 1'}}>
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #13C8CC, #002653)'}}>
                                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                    <path d="M14 4C9 4 5 8 5 13c0 3 1.5 5.5 3.8 7L14 24l5.2-4C21.5 18.5 23 16 23 13c0-5-4-9-9-9z" fill="white" opacity="0.9"/>
                                    <path d="M14 8v10M9 13h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-2xl font-black tracking-tight" style={{background: 'linear-gradient(to right, #13C8CC, #002653)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                                    AgendaVet
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Gestão Veterinária Inteligente</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-slate-800 uppercase tracking-tight">Relatório Cirúrgico</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Ficha Técnica de Procedimento Invasivo</p>
                                <p className="text-[9px] text-slate-400 mt-2">Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
                              </div>
                            </div>

                            <div className="border border-slate-300 p-6 mb-8 rounded-sm bg-slate-50/50 shadow-inner">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">DADOS DO PACIENTE</p>
                                        <div className="space-y-0.5 border-t border-slate-200 pt-3 text-[11px] font-medium text-slate-900 uppercase">
                                            <p className="text-sm font-black text-slate-800 mb-1 leading-none">{petName}</p>
                                            <p className="text-slate-600 truncate">{pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'} | {pet?.breed}</p>
                                            <p className="text-slate-500">Peso: <span className="font-bold text-slate-800">{pet?.weight || '-'} kg</span> | Sexo: <span className="font-bold text-slate-800">{pet?.gender}</span></p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 border-l border-slate-200 pl-8 text-right font-medium">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">LOGÍSTICA E DATA</p>
                                        <div className="space-y-0.5 border-t border-slate-200 pt-3 text-[11px]">
                                            <p className="font-black text-slate-800 text-sm uppercase mb-1">{owner?.fullName || 'S/R'}</p>
                                            <p className={`font-black uppercase text-[10px] mt-2 inline-block px-2 py-0.5 rounded ${themeColor.bgGhost} ${themeColor.text}`}>
                                                Procedimento em: {format(new Date(date), 'dd/MM/yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-10 text-slate-800 pb-10">
                                <section className={`p-6 rounded-sm bg-white border border-slate-300 relative overflow-hidden shadow-sm`}>
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${themeColor.bg}`}></div>
                                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-2 ${themeColor.text}`}>Procedimento Principal</h3>
                                    <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter underline decoration-4 decoration-slate-100 underline-offset-8">
                                        {procedimento || "Em preenchimento..."}
                                    </p>
                                </section>

                                <div className="grid grid-cols-2 gap-10">
                                    <section className="bg-slate-50/80 p-5 rounded-sm border border-slate-200 relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-full h-1 ${themeColor.bg}`}></div>
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 ${themeColor.text}`}>Anestesia e Cronologia</h3>
                                        <p className="text-[12px] font-black text-slate-800 uppercase leading-snug">{tipoAnestesia || "Não informada"}</p>
                                        <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-slate-500">
                                            <Activity className="size-3.5" />
                                            <span>Tempo Estimado: <span className="text-slate-900">{duracao || "0"} min</span></span>
                                        </div>
                                        <p className="text-[10px] mt-4 font-medium italic text-slate-500 border-t border-slate-100 pt-3 leading-relaxed whitespace-pre-wrap">{protocolo || "Sem observações de protocolo"}</p>
                                    </section>
                                    <section className="bg-slate-50/80 p-5 rounded-sm border border-slate-200 relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-full h-1 ${themeColor.bg}`}></div>
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 ${themeColor.text}`}>Materiais e Síntese</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {materiais.length > 0 ? materiais.map(m => (
                                                <Badge key={m} variant="outline" className={`text-[9px] px-2 py-0.5 bg-white border-slate-300 text-slate-600 font-bold uppercase tracking-tight`}>{m}</Badge>
                                            )) : <span className="text-[10px] opacity-40 italic font-medium">Nenhum material listado</span>}
                                        </div>
                                    </section>
                                </div>

                                <section>
                                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 ${themeColor.text} border-b border-slate-100 pb-2`}>
                                        <Scissors className="size-4 inline-block mr-2 align-middle opacity-50" />
                                        Relatório da Técnica Operatória
                                    </h3>
                                    <div className="text-[13px] leading-relaxed prose prose-slate max-w-none text-slate-700 font-medium break-words bg-slate-50/30 p-4 border border-slate-100 rounded-sm italic" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tecnica || "Aguardando descrição técnica...") }} />
                                </section>

                                <div className="grid grid-cols-2 gap-10 py-6 border-y border-slate-100">
                                    <section>
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${themeColor.text} opacity-60`}>Intercorrências</h3>
                                        <p className="text-[11px] leading-relaxed italic text-slate-500 font-medium">{intercorrencias || "Procedimento sem intercorrências registradas."}</p>
                                    </section>
                                    <section>
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${themeColor.text} opacity-60`}>Pós-Op Imediato</h3>
                                        <p className="text-[11px] leading-relaxed text-slate-800 font-black uppercase tracking-tight">{posOperatorio || "Recuperação estável."}</p>
                                    </section>
                                </div>

                                <section className="bg-slate-50 p-6 rounded-sm border border-slate-200 shadow-inner">
                                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 ${themeColor.text} flex items-center gap-2`}>
                                        <HeartPulse className="size-4 opacity-50" />
                                        Plano Terapêutico e Follow-up
                                    </h3>
                                    <div className="text-[13px] leading-relaxed text-slate-700 border-l-4 border-slate-300 pl-6 font-medium italic break-words" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(prescricao || "Aguardando prescrição pós-cirúrgica...") }} />
                                    <div className="mt-8 flex items-center justify-between text-[11px] font-black text-slate-900 border-t border-slate-200/50 pt-4 uppercase tracking-widest">
                                        <span className="opacity-40">Retorno Clínico Previsto:</span>
                                        <span className="bg-white px-4 py-1 rounded shadow-sm border border-slate-100">{retorno || "A definir pelo cirurgião"}</span>
                                    </div>
                                </section>
                            </div>

                            <div className="mt-auto pt-8 border-t border-slate-100">
                              <div className="flex justify-between items-end">
                                <div className="text-[9px] text-slate-400 leading-tight max-w-[220px]">
                                  <p className="font-semibold" style={{background: 'linear-gradient(to right, #13C8CC, #002653)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>AgendaVet © 2026</p>
                                  <p className="opacity-70 mt-0.5">Gestão Veterinária Profissional. As informações são de responsabilidade do médico veterinário.</p>
                                </div>
                                <div className="text-center w-56">
                                  <div className="h-[2px] w-full mb-3 rounded" style={{background: 'linear-gradient(to right, #13C8CC, #002653)'}}></div>
                                  <p className="text-[13px] font-black uppercase text-slate-900 tracking-tight">{veterinarian || 'Dr. Responsável'}</p>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Médico Veterinário • CRMV</p>
                                </div>
                              </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    )
}
