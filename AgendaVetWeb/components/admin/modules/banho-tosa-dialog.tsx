'use client'

import { useState, useRef } from 'react'
import { supabase, usePet, useOwner, useMedicalRecords } from '@/lib/data-store'
import { mutate } from 'swr'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Scissors, Save, ArrowLeft, Printer, DollarSign, Plus, Trash2, Brush, Sparkles, AlertCircle, PawPrint, Clock, History } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
// @ts-ignore
import { useReactToPrint } from 'react-to-print'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface BanhoTosaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

const GROOMING_SERVICES = [
    'Banho Simples',
    'Banho Terapêutico',
    'Tosa Higiênica',
    'Tosa da Raça',
    'Tosa na Máquina',
    'Tosa na Tesoura',
    'Corte de Unhas',
    'Limpeza de Ouvidos',
    'Escovação de Dentes',
    'Hidratação',
]

export function BanhoTosaDialog({ open, onOpenChange, onBack, petId, petName }: BanhoTosaDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')
    const { records: allRecords } = useMedicalRecords(petId)

    const isMale = pet?.gender === 'Macho'
    const themeColor = {
        bg: isMale ? 'bg-sky-600' : 'bg-rose-500',
        bgHover: isMale ? 'hover:bg-sky-700' : 'hover:bg-rose-600',
        bgGhost: isMale ? 'bg-sky-500/10' : 'bg-rose-500/10',
        bgLight: isMale ? 'bg-sky-50' : 'bg-rose-50',
        text: isMale ? 'text-sky-600' : 'text-rose-600',
        border: isMale ? 'border-sky-500' : 'border-rose-500',
        borderLight: isMale ? 'border-sky-200' : 'border-rose-200',
    }

    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

    // Form fields
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [estadoPele, setEstadoPele] = useState('')
    const [presencaParasitas, setPresencaParasitas] = useState(false)
    const [presencaNos, setPresencaNos] = useState(false)
    const [observacoes, setObservacoes] = useState('')
    const [profissional, setProfissional] = useState('Equipe de Estética')

    // Billing state
    const [baseValue, setBaseValue] = useState('0.00')
    const [extraServices, setExtraServices] = useState<{ id: string, name: string, value: number }[]>([])

    const printRef = useRef<HTMLDivElement>(null)
    const handlePrint = useReactToPrint({ contentRef: printRef })

    const toggleService = (service: string) => {
        setSelectedServices(prev =>
            prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
        )
    }

    const handleSave = async () => {
        if (selectedServices.length === 0) {
            toast.error('Selecione pelo menos um serviço')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const description = {
                servicos: selectedServices,
                avaliação: {
                    pele: estadoPele,
                    parasitas: presencaParasitas,
                    nos: presencaNos
                },
                observacoes,
                billing: {
                    baseValue: parseFloat(baseValue),
                    extras: extraServices,
                    total: parseFloat(baseValue) + extraServices.reduce((acc, s) => acc + s.value, 0)
                }
            }

            const { error } = await (supabase.from('medical_records' as any).insert([{
                pet_id: petId,
                user_id: userData.user?.id,
                type: 'banho-tosa',
                title: `Estética - ${selectedServices[0]}`,
                description: JSON.stringify(description),
                date: new Date(date).toISOString(),
                veterinarian: profissional, // Using professional here
            }] as any) as any)

            if (error) throw error

            mutate('medical-records')
            toast.success('Registro de estética salvo!')
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar registro')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-screen sm:max-w-none !max-w-none h-screen max-h-none rounded-none p-0 flex flex-col overflow-hidden border-none text-slate-800">
                <DialogHeader className="p-4 md:p-6 border-b border-border/50 bg-white flex flex-row items-center justify-between shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100" onClick={onBack}>
                                <ArrowLeft className="size-5" />
                            </Button>
                        )}
                        <div className={`flex size-12 items-center justify-center rounded-xl ${themeColor.bgGhost} ${themeColor.text} shadow-inner`}>
                            <Brush className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">
                                Banho & Estética
                            </DialogTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 font-medium">
                                <span className="flex items-center gap-1"><PawPrint className="size-3.5" /> <span className="font-bold text-slate-700">{petName}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className={`flex items-center gap-1 font-bold ${themeColor.text} uppercase tracking-tighter text-[11px] ${themeColor.bgGhost} px-2 py-0.5 rounded border ${themeColor.borderLight}`}>Spa & Grooming</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-bold text-slate-500">
                            Fechar
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className={`h-10 px-6 font-black ${themeColor.bg} ${themeColor.bgHover} text-white shadow-lg`}>
                            <Save className="size-4 mr-2" />
                            {loading ? 'Salvando...' : 'Finalizar Estética'}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex bg-slate-100/50">
                    {/* NEW: Left Sidebar with Patient History */}
                    <div className="hidden xl:block w-[380px] bg-slate-50/80 border-r border-border/30 p-8 overflow-y-auto shrink-0 shadow-inner">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-l-4 border-sky-500 pl-4 mb-8">
                            Histórico do Paciente
                        </h3>
                        
                        {allRecords.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center gap-4 opacity-50">
                                <Clock className="size-10 text-slate-300" />
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Sem registros prévios</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {allRecords.map(record => (
                                    <div key={record.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-sky-500 transition-all hover:shadow-md group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[11px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-[3px]">
                                                {format(new Date(record.date || record.createdAt), "dd/MM/yyyy")}
                                            </span>
                                            <span className="text-[10px] font-black uppercase text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 group-hover:bg-sky-500 group-hover:text-white transition-colors">
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
                                    Novo Atendimento
                                </h3>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data do Serviço *</Label>
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="h-12 border-slate-200 rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profissional Responsável</Label>
                                        <Input
                                            value={profissional}
                                            onChange={(e) => setProfissional(e.target.value)}
                                            className="h-12 border-slate-200 rounded-xl font-bold font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Serviços Selecionados</Label>
                                    <div className="grid grid-cols-2 gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner">
                                        {GROOMING_SERVICES.map((s) => (
                                            <label key={s} className="flex items-center gap-2 text-[11px] font-bold cursor-pointer hover:bg-white p-2 rounded-lg transition-all border border-transparent hover:border-slate-100 hover:shadow-sm">
                                                <Checkbox
                                                    checked={selectedServices.includes(s)}
                                                    onCheckedChange={() => toggleService(s)}
                                                    className={themeColor.border}
                                                />
                                                {s}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avaliação Clínica / Pelagem</Label>
                                    <div className="flex gap-4 p-4 rounded-2xl bg-amber-50/30 border border-amber-100">
                                        <label className="flex items-center gap-2 text-[11px] font-black uppercase text-amber-700 cursor-pointer">
                                            <Checkbox checked={presencaParasitas} onCheckedChange={(v) => setPresencaParasitas(!!v)} className="border-amber-400 data-[state=checked]:bg-amber-500" />
                                            Parasitas
                                        </label>
                                        <label className="flex items-center gap-2 text-[11px] font-black uppercase text-rose-700 cursor-pointer">
                                            <Checkbox checked={presencaNos} onCheckedChange={(v) => setPresencaNos(!!v)} className="border-rose-400 data-[state=checked]:bg-rose-500" />
                                            Presença de Nós
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            value={estadoPele}
                                            onChange={(e) => setEstadoPele(e.target.value)}
                                            placeholder="Estado da Pele e Pelagem..."
                                            className="h-12 border-slate-200 rounded-xl font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações Adicionais</Label>
                                    <Textarea
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        placeholder="Comportamento, recomendações..."
                                        className="min-h-[100px] border-slate-200 rounded-xl font-medium"
                                    />
                                </div>

                                {/* Billing Section */}
                                <div className={`p-6 rounded-2xl border-2 border-dashed ${themeColor.border}/20 ${themeColor.bgGhost}-30 space-y-4 shadow-inner`}>
                                    <div className={`flex items-center gap-2 ${themeColor.text} font-black text-[10px] uppercase tracking-[0.2em]`}>
                                        <DollarSign className="size-4" />
                                        Faturamento e Extras
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase">Valor Base (R$)</Label>
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
                                                onClick={() => setExtraServices([...extraServices, { id: Math.random().toString(), name: 'Extra (Acessórios/Outros)', value: 0 }])}
                                            >
                                                <Plus className="size-3 mr-1" /> Add Extra
                                            </Button>
                                        </div>
                                    </div>

                                    {extraServices.map((service, idx) => (
                                        <div key={service.id} className="flex gap-2 items-center bg-white/50 p-2 rounded-xl border border-slate-100">
                                            <Input
                                                value={service.name}
                                                onChange={(e) => {
                                                    const newServices = [...extraServices]
                                                    newServices[idx].name = e.target.value
                                                    setExtraServices(newServices)
                                                }}
                                                placeholder="Descrição"
                                                className="h-9 text-[10px] flex-1 border-none bg-transparent font-bold"
                                            />
                                            <Input
                                                type="number"
                                                value={service.value}
                                                onChange={(e) => {
                                                    const newServices = [...extraServices]
                                                    newServices[idx].value = parseFloat(e.target.value) || 0
                                                    setExtraServices(newServices)
                                                }}
                                                className="h-9 text-[11px] w-20 border-none bg-transparent font-black text-right"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 rounded-lg"
                                                onClick={() => setExtraServices(extraServices.filter((_, i) => i !== idx))}
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    ))}

                                    <div className={`pt-4 border-t border-slate-200 flex justify-between items-center`}>
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total do Atendimento:</span>
                                        <span className={`text-xl font-black ${themeColor.text}`}>
                                            R$ {(parseFloat(baseValue) + extraServices.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button onClick={handleSave} disabled={loading} className={`flex-1 h-16 text-lg font-black ${themeColor.bg} ${themeColor.bgHover} text-white shadow-xl rounded-2xl transition-all hover:scale-[1.02] active:scale-95`}>
                                        <Save className="size-6 mr-2" />
                                        {loading ? 'Salvando...' : 'Finalizar Estética'}
                                    </Button>
                                    <Button variant="outline" className="h-16 px-6 border-2 font-bold hover:bg-slate-50 rounded-2xl" onClick={() => handlePrint()}>
                                        <Printer className="size-6" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Section - A4 Page */}
                    <div className="hidden md:flex flex-1 bg-slate-200/50 p-6 lg:p-12 overflow-y-auto justify-center items-start">
                        <div
                            ref={printRef}
                            className={`w-full max-w-[650px] min-h-[920px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm border p-12 flex flex-col text-slate-900 ${themeColor.borderLight} border-t-8 ${themeColor.border}`}
                        >
                            <div className={`border-b-2 pb-6 mb-8 flex justify-between items-end ${themeColor.border}`}>
                                <div>
                                    <h2 className={`text-2xl font-black uppercase tracking-tight ${themeColor.text}`}>Relatório de Estética</h2>
                                    <p className="text-[10px] opacity-70 mt-1 uppercase font-bold text-slate-500">Cuidados e Higienização Profissional</p>
                                </div>
                                <div className={`text-right ${themeColor.text}`}>
                                    <Sparkles className="size-10 ml-auto mb-1 opacity-20" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AgendaVet Grooming</p>
                                </div>
                            </div>

                            <div className="border border-slate-300 p-6 mb-8 rounded-sm bg-slate-50/50 shadow-inner">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">DADOS DO PACIENTE</p>
                                        <div className="space-y-0.5 border-t border-slate-200 pt-3 text-[11px] font-medium">
                                            <p className="text-sm font-black text-slate-800 uppercase mb-1">{petName}</p>
                                            <p className="text-slate-600 truncate">{pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'} | {pet?.breed}</p>
                                            <p className={`font-black uppercase text-[10px] mt-2 inline-block px-2 py-0.5 rounded ${themeColor.bgGhost} ${themeColor.text}`}>
                                                Data: {format(new Date(date), 'dd/MM/yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 border-l border-slate-200 pl-8 text-right font-medium">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">RESPONSÁVEL / TUTOR</p>
                                        <div className="space-y-0.5 border-t border-slate-200 pt-3 text-[11px]">
                                            <p className="font-black text-slate-800 text-sm uppercase mb-1">{owner?.fullName || 'S/R'}</p>
                                            <p className="text-slate-500 truncate">{owner?.phone || '-'}</p>
                                            <p className="text-[10px] text-slate-900 mt-2 font-black uppercase italic">Groomer: {profissional}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-10 text-slate-800 pb-10">
                                <section className={`p-6 rounded-sm bg-white border border-slate-300 relative overflow-hidden shadow-sm`}>
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${themeColor.bg}`}></div>
                                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 ${themeColor.text}`}>Serviços de Estética Realizados</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedServices.length > 0 ? selectedServices.map(s => (
                                            <Badge key={s} variant="outline" className={`text-[10px] px-3 py-1 font-black uppercase tracking-tight bg-slate-50 border-slate-200 text-slate-700 shadow-sm`}>{s}</Badge>
                                        )) : <p className="text-xs italic text-slate-400 font-medium">Nenhum serviço listado.</p>}
                                    </div>
                                </section>

                                <div className="grid grid-cols-2 gap-10">
                                    <section>
                                        <h3 className={`text-[11px] font-black uppercase tracking-widest mb-3 ${themeColor.text} border-b border-slate-100 pb-2`}>Avaliação Dermatológica</h3>
                                        <p className="text-[13px] font-medium leading-relaxed mt-2 text-slate-800 bg-slate-50/50 p-4 rounded-sm italic border-l-4 border-slate-200 break-words whitespace-pre-wrap">{estadoPele || "Pele e pelagem íntegras, sem alterações visuais identificadas no momento do atendimento."}</p>
                                    </section>
                                    <section>
                                        <h3 className={`text-[11px] font-black uppercase tracking-widest mb-3 ${themeColor.text} border-b border-slate-100 pb-2`}>Indicadores de Manejo</h3>
                                        <div className="space-y-3 mt-4 p-4 bg-slate-50/80 rounded-sm border border-slate-200 shadow-inner">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-4 rounded-full border-2 ${presencaParasitas ? 'bg-rose-500 border-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-slate-200 border-slate-300'}`}></div>
                                                <span className={`text-[11px] font-black uppercase ${presencaParasitas ? 'text-rose-700' : 'text-slate-400'}`}>Presença de Parasitas</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`size-4 rounded-full border-2 ${presencaNos ? 'bg-amber-500 border-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-slate-200 border-slate-300'}`}></div>
                                                <span className={`text-[11px] font-black uppercase ${presencaNos ? 'text-amber-700' : 'text-slate-400'}`}>Presença de Nós / Embaraço</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <section>
                                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-3 ${themeColor.text} border-b border-slate-100 pb-2`}>Observações Técnicas e de Bem-estar</h3>
                                    <p className="text-[13px] leading-relaxed mt-2 text-slate-600 font-medium italic break-words whitespace-pre-wrap">
                                        {observacoes || "Animal apresentou comportamento dócil e aceitou bem todos os procedimentos de higienização. Sem intercorrências."}
                                    </p>
                                </section>

                                <div className={`p-6 rounded-sm bg-slate-50 border border-slate-200 flex items-start gap-5 shadow-inner`}>
                                    <AlertCircle className={`size-6 ${themeColor.text} mt-0.5 opacity-60`} />
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Orientação Preventiva</p>
                                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                            A estética faz parte da saúde preventiva do seu pet. Observamos cuidadosamente a pele durante todo o processo. Caso note qualquer desconforto ou irritação persistente, procure nossa equipe veterinária.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-12 flex justify-between items-end border-t border-slate-100 italic">
                                <div className="text-[9px] opacity-40 leading-tight max-w-[200px] font-bold text-slate-500 uppercase">
                                    REGISTRO DIGITAL DE SERVIÇO DE ESTÉTICA • {format(new Date(), 'dd/MM/yyyy HH:mm')}
                                </div>
                                <div className="text-center w-64">
                                    <div className={`h-[2px] w-full ${themeColor.bg} opacity-20 mb-3`}></div>
                                    <p className="text-[14px] font-black uppercase text-slate-900 tracking-tighter">{profissional}</p>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Grooming Specialist</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
