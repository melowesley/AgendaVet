'use client'

import { useState, useRef } from 'react'
import { supabase, usePet, useOwner, useMedicalRecords } from '@/lib/data-store'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })

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
import { ClipboardList, Save, ArrowLeft, Printer, DollarSign, Plus, Trash2, Bed, Activity, Thermometer, HeartPulse, History, PawPrint, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useReactToPrint } from 'react-to-print'
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
    const { records: allRecords } = useMedicalRecords(petId)

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
    const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Internacao_${quarto}_${petName}` })

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
            <DialogContent className="w-[95vw] max-w-[1400px] h-[90vh] max-h-[90vh] rounded-2xl p-0 flex flex-col overflow-hidden border border-border/20 shadow-2xl text-slate-800">
                <DialogHeader className="p-4 md:p-6 border-b border-border/50 bg-white flex flex-row items-center justify-between shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100" onClick={onBack}>
                                <ArrowLeft className="size-5" />
                            </Button>
                        )}
                        <div className={`flex size-12 items-center justify-center rounded-xl text-white shadow-inner`} style={{background: 'linear-gradient(135deg, #13C8CC, #002653)'}}>
                            <Bed className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">
                                Unidade de Internação
                            </DialogTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 font-medium">
                                <span className="flex items-center gap-1"><PawPrint className="size-3.5" /> <span className="font-bold text-slate-700">{petName}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className={`flex items-center gap-1 font-bold ${themeColor.text} uppercase tracking-tighter text-[11px] ${themeColor.bgGhost} px-2 py-0.5 rounded border ${themeColor.borderLight}`}>Hospital Care</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-bold text-slate-500">
                            Fechar
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className={`h-10 px-6 font-black bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg`}>
                            <Save className="size-4 mr-2" />
                            {loading ? 'Salvando...' : 'Salvar Registro'}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex bg-slate-100/50">
                    {/* NEW: Left Sidebar with Patient History */}
                    <div className="hidden xl:block w-[280px] bg-slate-50/80 border-r border-border/30 p-4 overflow-y-auto shrink-0 shadow-inner">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-l-4 border-indigo-600 pl-3 mb-6">
                            Histórico do Paciente
                        </h3>
                        
                        {allRecords.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center gap-3 opacity-50">
                                <History className="size-8 text-slate-300" />
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Sem registros prévios</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allRecords.map(record => (
                                    <div key={record.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-500 transition-all hover:shadow-md group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-black text-white bg-slate-900 px-1.5 py-0.5 rounded-[3px]">
                                                {format(new Date(record.date || record.createdAt), "dd/MM/yyyy")}
                                            </span>
                                            <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                {record.type}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-snug">{record.title}</h4>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Side */}
                    <div className="w-full xl:w-[480px] p-6 bg-white border-r border-border/30 overflow-y-auto shrink-0 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.1)] z-10 relative">
                        <div className="space-y-8">
                            <div className="flex justify-between items-center border-l-4 border-slate-900 pl-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 leading-none py-1">
                                    Monitoramento Clínico
                                </h3>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leito / Quarto *</Label>
                                        <Input
                                            placeholder="Ex: Canil 04"
                                            value={quarto}
                                            onChange={(e) => setQuarto(e.target.value)}
                                            className="h-12 border-slate-200 rounded-xl font-black text-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data *</Label>
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="h-12 border-slate-200 rounded-xl font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motivo da Internação *</Label>
                                    <Input
                                        placeholder="Ex: Pós-operatório, Gastroenterite..."
                                        value={motivo}
                                        onChange={(e) => setMotivo(e.target.value)}
                                        className="h-12 border-slate-200 rounded-xl font-black text-slate-800"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <Thermometer className="size-3" /> Temp (°C)
                                        </Label>
                                        <Input value={temperatura} onChange={(e) => setTemperatura(e.target.value)} className="h-10 text-sm font-black bg-white rounded-lg" placeholder="38.5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <HeartPulse className="size-3" /> FC (bpm)
                                        </Label>
                                        <Input value={frequenciaCardiaca} onChange={(e) => setFrequenciaCardiaca(e.target.value)} className="h-10 text-sm font-black bg-white rounded-lg" placeholder="120" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <Activity className="size-3" /> FR (mpm)
                                        </Label>
                                        <Input value={frequenciaRespiratoria} onChange={(e) => setFrequenciaRespiratoria(e.target.value)} className="h-10 text-sm font-black bg-white rounded-lg" placeholder="30" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado Geral</Label>
                                    <Input 
                                        value={estadoGeral} 
                                        onChange={(e) => setEstadoGeral(e.target.value)} 
                                        placeholder="Alerta, Responsivo, Prostrado..." 
                                        className="h-12 border-slate-200 rounded-xl font-bold"
                                    />
                                </div>

                                <div className="space-y-2 pt-4 border-t border-slate-100">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evolução / Observações</Label>
                                    <Textarea
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        placeholder="Descreva a evolução do paciente nas últimas horas..."
                                        className="min-h-[100px] border-slate-200 rounded-xl font-medium text-sm"
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conduta Médica / Prescrição</Label>
                                    <div className="bg-white text-black rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
                                        <ReactQuill
                                            theme="snow"
                                            value={conduta}
                                            onChange={setConduta}
                                            modules={modules}
                                            className="min-h-[120px]"
                                            placeholder="Medicamentos, fluidoterapia, exames e horários..."
                                        />
                                    </div>
                                </div>

                                {/* Billing Section */}
                                <div className={`p-6 rounded-2xl border-2 border-dashed ${themeColor.border}/20 ${themeColor.bgGhost}-30 space-y-4 shadow-inner`}>
                                    <div className={`flex items-center gap-2 ${themeColor.text} font-black text-[10px] uppercase tracking-[0.2em]`}>
                                        <DollarSign className="size-4" />
                                        Custos de Internação
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase">Diária Base (R$)</Label>
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
                                                onClick={() => setServices([...services, { id: Math.random().toString(), name: 'Extra / Medicamento', value: 0 }])}
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
                                                placeholder="Descrição do item"
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
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Acumulado:</span>
                                        <span className={`text-xl font-black ${themeColor.text}`}>
                                            R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button onClick={handleSave} disabled={loading} className={`flex-1 h-10 font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm rounded-lg`}>
                                        <Save className="size-4 mr-2" />
                                        {loading ? 'Salvando...' : 'Salvar Registro'}
                                    </Button>
                                    <Button variant="outline" className="h-10 px-4 rounded-lg" onClick={() => handlePrint()}>
                                        <Printer className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Section - A4 Page */}
                    <div className="hidden md:flex flex-1 bg-slate-50 p-8 lg:p-12 overflow-y-auto justify-center items-start h-full">
                        <div
                            ref={printRef}
                            className={`w-full max-w-[595px] min-h-[700px] bg-white shadow-[0_15px_40px_-15px_rgba(0,0,0,0.15)] rounded-md border border-slate-200 p-8 flex flex-col text-slate-900 m-auto`}
                            style={{borderImage: 'linear-gradient(to right, #13C8CC, #002653) 1', borderTopWidth: '12px'}}
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
                                <p className="text-lg font-black text-slate-800 uppercase tracking-tight">FICHA DE INTERNAÇÃO</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Registro de Hospitalização Veterinária</p>
                                <p className="text-[9px] text-slate-400 mt-2">Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
                              </div>
                            </div>

                            <div className="border border-slate-300 p-4 mb-6 rounded-sm bg-slate-50/50 shadow-inner">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">DADOS DO PACIENTE</p>
                                        <div className="space-y-0.5 border-t border-slate-200 pt-3 text-[11px] font-medium text-slate-900 uppercase">
                                            <p className="text-sm font-black text-slate-800 mb-1 leading-none">{petName}</p>
                                            <p className="text-slate-600 truncate">{pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'} | {pet?.breed}</p>
                                            <p className="text-slate-500">Peso: <span className="font-bold text-slate-800">{pet?.weight || '-'} kg</span> | Sexo: <span className="font-bold text-slate-800">{pet?.gender}</span></p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 border-l border-slate-200 pl-8 text-right font-medium">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">LOCALIZAÇÃO / ENTRADA</p>
                                        <div className="space-y-0.5 border-t border-slate-200 pt-3 text-[11px]">
                                            <p className="font-black text-slate-800 text-sm uppercase mb-1">{quarto || "S/R"}</p>
                                            <p className={`font-black uppercase text-[10px] mt-2 inline-block px-2 py-0.5 rounded ${themeColor.bgGhost} ${themeColor.text}`}>
                                                Internado em: {format(new Date(date), 'dd/MM/yyyy')}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-tighter">Tutor: {owner?.fullName || 'S/R'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-6 text-slate-800 pb-6">
                                <section className={`p-4 rounded-sm bg-white border border-slate-300 relative overflow-hidden shadow-sm`}>
                                    <div className={`absolute top-0 left-0 w-1 h-full ${themeColor.bg}`}></div>
                                    <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${themeColor.text}`}>Motivo da Internação</h3>
                                    <p className="text-lg font-black text-slate-900 uppercase tracking-tighter underline decoration-2 decoration-slate-100 underline-offset-4">
                                        {motivo || "Em avaliação hospitalar..."}
                                    </p>
                                </section>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-50 p-3 border border-slate-200 rounded-sm text-center relative overflow-hidden group">
                                        <div className={`absolute top-0 left-0 w-full h-0.5 ${themeColor.bg} opacity-20`}></div>
                                        <Thermometer className="size-4 mx-auto mb-1.5 text-slate-400" />
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Temp</p>
                                        <p className="text-base font-black text-slate-900 font-mono tracking-tighter">{temperatura || "--"}°C</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 border border-slate-200 rounded-sm text-center relative overflow-hidden group">
                                        <div className={`absolute top-0 left-0 w-full h-0.5 ${themeColor.bg} opacity-20`}></div>
                                        <HeartPulse className="size-4 mx-auto mb-1.5 text-slate-400" />
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">FC (bpm)</p>
                                        <p className="text-base font-black text-slate-900 font-mono tracking-tighter">{frequenciaCardiaca || "--"}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 border border-slate-200 rounded-sm text-center relative overflow-hidden group">
                                        <div className={`absolute top-0 left-0 w-full h-0.5 ${themeColor.bg} opacity-20`}></div>
                                        <Activity className="size-4 mx-auto mb-1.5 text-slate-400" />
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">FR (mpm)</p>
                                        <p className="text-base font-black text-slate-900 font-mono tracking-tighter">{frequenciaRespiratoria || "--"}</p>
                                    </div>
                                </div>

                                <section>
                                    <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${themeColor.text} border-b border-slate-100 pb-2`}>
                                        <ClipboardList className="size-3.5 inline-block mr-1.5 align-middle opacity-50" />
                                        Avaliação de Estado Geral
                                    </h3>
                                    <div className="text-[11px] leading-relaxed text-slate-700 bg-slate-50/50 p-3 border border-slate-100 rounded-sm italic font-medium break-words uppercase tracking-tight">
                                        {estadoGeral || "Paciente estável sob monitoramento constante."}
                                    </div>
                                </section>

                                <section>
                                    <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${themeColor.text} border-b border-slate-100 pb-2`}>
                                        Evolução e Intercorrências
                                    </h3>
                                    <p className="text-[11px] font-medium leading-relaxed text-slate-600 break-words whitespace-pre-wrap pl-4 border-l-2 border-slate-200">
                                        {observacoes || "Nenhuma alteração significativa registrada neste período."}
                                    </p>
                                </section>

                                <section className="bg-slate-50 p-4 rounded-sm border border-slate-200 shadow-inner">
                                    <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${themeColor.text}`}>
                                        Conduta Médica e Prescrição Digital
                                    </h3>
                                    <div className="text-[11px] leading-relaxed text-slate-700 border-l-4 border-slate-300 pl-4 font-medium italic break-words" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(conduta || "Aguardando prescrição medicamentosa e hídrica...") }} />
                                </section>
                            </div>

                            {/* AgendaVet Footer A4 */}
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
        </Dialog>
    )
}
