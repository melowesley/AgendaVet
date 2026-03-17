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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Skull, Save, ArrowLeft, Printer, DollarSign, Plus, Trash2, Heart, Clock, Calendar, PawPrint } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useReactToPrint } from 'react-to-print'

interface ObitoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

export function ObitoDialog({ open, onOpenChange, onBack, petId, petName }: ObitoDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')
    const { records: allRecords } = useMedicalRecords(petId)

    const themeColor = {
        bg: 'bg-zinc-800',
        bgHover: 'hover:bg-zinc-900',
        bgGhost: 'bg-zinc-500/10',
        bgLight: 'bg-zinc-50',
        text: 'text-zinc-800',
        border: 'border-zinc-500',
        borderLight: 'border-zinc-200',
    }

    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [time, setTime] = useState(format(new Date(), 'HH:mm'))
    const [causa, setCausa] = useState('')
    const [observacoes, setObservacoes] = useState('')
    const [veterinarian, setVeterinarian] = useState('Dr. Cleyton Chaves')

    // Billing state
    const [baseValue, setBaseValue] = useState('0.00')
    const [services, setServices] = useState<{ id: string, name: string, value: number }[]>([])

    const printRef = useRef<HTMLDivElement>(null)
    const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Obito_${petName}_${format(new Date(), 'dd_MM_yyyy')}` })

    const handleSave = async () => {
        if (!causa.trim()) {
            toast.error('Preencha a causa provável do óbito')
            return
        }

        const confirm = window.confirm(`Você está prestes a registrar o óbito de ${petName}. Esta ação é irreversível no prontuário. Confirmar?`)
        if (!confirm) return

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const description = {
                data_obito: date,
                hora_obito: time,
                causa,
                observacoes,
                billing: {
                    baseValue: parseFloat(baseValue),
                    services: services,
                    total: parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)
                }
            }

            const { error: recordError } = await (supabase.from('medical_records' as any).insert([{
                pet_id: petId,
                user_id: userData.user?.id,
                type: 'obito',
                title: 'Declaração de Óbito',
                description: JSON.stringify(description),
                date: new Date(`${date}T${time}`).toISOString(),
                veterinarian: veterinarian || 'Dr. Cleyton Chaves',
            }] as any) as any)

            if (recordError) throw recordError

            mutate('medical-records')
            toast.success('Óbito registrado com sucesso.')
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao registrar óbito')
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
                        <div className={`flex size-12 items-center justify-center rounded-xl ${themeColor.bgGhost} text-zinc-600 shadow-inner`}>
                            <Skull className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">
                                Registro de Óbito
                            </DialogTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 font-medium">
                                <span className="flex items-center gap-1"><PawPrint className="size-3.5" /> <span className="font-bold text-slate-700">{petName}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 font-bold text-zinc-600 uppercase tracking-tighter text-[11px] bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">Encerramento de Ficha</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-bold text-slate-500">
                            Fechar
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className={`h-10 px-6 font-black ${themeColor.bg} ${themeColor.bgHover} text-white shadow-lg`}>
                            <Save className="size-4 mr-2" />
                            {loading ? 'Processando...' : 'Finalizar Registro'}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex bg-slate-100/50">
                    {/* Left Sidebar with Patient History */}
                    <div className="hidden xl:block w-[380px] bg-slate-50/80 border-r border-border/30 p-8 overflow-y-auto shrink-0 shadow-inner">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-l-4 border-zinc-500 pl-4 mb-8">
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
                                    <div key={record.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-zinc-500 transition-all hover:shadow-md group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[11px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-[3px]">
                                                {format(new Date(record.date || record.createdAt), "dd/MM/yyyy")}
                                            </span>
                                            <span className="text-[10px] font-black uppercase text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 group-hover:bg-zinc-500 group-hover:text-white transition-colors">
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
                                    Declaração de Óbito
                                </h3>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data do Óbito *</Label>
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="h-12 border-slate-200 rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hora do Óbito *</Label>
                                        <Input
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="h-12 border-slate-200 rounded-xl font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Causa Provável *</Label>
                                    <Input
                                        placeholder="Ex: Parada Cardiorrespiratória, Falência Múltipla..."
                                        value={causa}
                                        onChange={(e) => setCausa(e.target.value)}
                                        className="h-12 border-slate-200 rounded-xl font-black text-slate-800"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Veterinário Responsável</Label>
                                    <Input
                                        value={veterinarian}
                                        onChange={(e) => setVeterinarian(e.target.value)}
                                        className="h-12 border-slate-200 rounded-xl font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações Adicionais</Label>
                                    <Textarea
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        placeholder="Circunstâncias, eutanásia (se houver), condutas finais..."
                                        className="min-h-[120px] border-slate-200 rounded-xl font-medium"
                                    />
                                </div>

                                {/* Billing Section */}
                                <div className={`p-6 rounded-2xl border-2 border-dashed ${themeColor.border}/20 ${themeColor.bgGhost}-30 space-y-4 shadow-inner`}>
                                    <div className={`flex items-center gap-2 ${themeColor.text} font-black text-[10px] uppercase tracking-[0.2em]`}>
                                        <DollarSign className="size-4" />
                                        Custos Finais (Eutanásia/Destinação)
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase">Taxa Base (R$)</Label>
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
                                                onClick={() => setServices([...services, { id: Math.random().toString(), name: 'Taxa Adicional', value: 0 }])}
                                            >
                                                <Plus className="size-3 mr-1" /> Add Taxa
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
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total:</span>
                                        <span className={`text-xl font-black ${themeColor.text}`}>
                                            R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button onClick={handleSave} disabled={loading} className={`flex-1 h-16 text-lg font-black ${themeColor.bg} ${themeColor.bgHover} text-white shadow-xl rounded-2xl transition-all hover:scale-[1.02] active:scale-95`}>
                                        <Save className="size-6 mr-2" />
                                        {loading ? 'Processando...' : 'Finalizar Registro'}
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
                            className={`w-full max-w-[650px] min-h-[920px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm border p-12 flex flex-col text-zinc-900 ${themeColor.borderLight} border-t-8 ${themeColor.border}`}
                        >
                            <div className={`border-b-4 border-zinc-900 pb-8 mb-10 text-center`}>
                                <h2 className="text-3xl font-serif font-bold uppercase tracking-[0.2em] text-zinc-900">Declaração de Óbito</h2>
                                <p className="text-[10px] text-zinc-500 mt-2 tracking-widest uppercase font-bold">Documento Técnico Veterinário Oficial</p>
                            </div>

                            <div className="flex-1 space-y-10">
                                <section>
                                    <p className="text-[12px] leading-relaxed text-zinc-800 text-justify font-serif italic">
                                        Declaramos para os devidos fins que o paciente animal de estimação, cujas especificações seguem abaixo,
                                        veio a óbito nesta unidade hospitalar na data e horário informados, sob os cuidados da equipe médica veterinária.
                                    </p>
                                </section>

                                <div className="border border-zinc-300 p-6 rounded-sm bg-zinc-50/50">
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PACIENTE</p>
                                            <p className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-1">{petName}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ESPÉCIE / RAÇA</p>
                                            <p className="text-base text-zinc-800 border-b border-zinc-200 pb-1">{pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : pet?.species} / {pet?.breed}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">TUTOR RESPONSÁVEL</p>
                                            <p className="text-base text-zinc-800 border-b border-zinc-200 pb-1">{owner?.fullName || "S/R"}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">DATA E HORÁRIO</p>
                                            <p className="text-base text-zinc-800 border-b border-zinc-200 pb-1">{format(new Date(date), 'dd/MM/yyyy')} às {time}</p>
                                        </div>
                                    </div>
                                </div>

                                <section>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 border-b border-zinc-200 pb-1">Causa Provável do Óbito</h3>
                                    <div className="p-8 bg-zinc-900 text-white rounded-sm italic text-xl text-center shadow-inner break-words break-all whitespace-pre-wrap">
                                        {causa || "_________________________________"}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 border-b border-zinc-200 pb-1">Notas e Observações Adicionais</h3>
                                    <p className="text-sm text-zinc-700 leading-relaxed min-h-[120px] bg-zinc-50/30 p-4 border-l-4 border-zinc-200 break-words break-all whitespace-pre-wrap">
                                        {observacoes || "Nenhuma observação clínica adicional registrada para este evento."}
                                    </p>
                                </section>

                                {(parseFloat(baseValue) > 0 || services.length > 0) && (
                                    <div className="border border-zinc-800 rounded-sm overflow-hidden mt-6 bg-white shadow-sm">
                                        <div className="bg-zinc-800 px-4 py-2 text-[10px] font-black uppercase text-white tracking-[0.25em]">Resumo Financeiro</div>
                                        <div className="p-6 space-y-3">
                                            {parseFloat(baseValue) > 0 && (
                                                <div className="flex justify-between text-[12px] border-b border-zinc-100 pb-2">
                                                    <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Taxa Base</span>
                                                    <span className="font-black text-zinc-900">R$ {parseFloat(baseValue).toFixed(2)}</span>
                                                </div>
                                            )}
                                            {services.map(s => (
                                                <div key={s.id} className="flex justify-between text-[12px] border-b border-zinc-100 pb-2">
                                                    <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">{s.name}</span>
                                                    <span className="font-black text-zinc-900">R$ {s.value.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between pt-4 mt-2 font-black text-xl text-zinc-800 tracking-tighter">
                                                <span>VALOR TOTAL</span>
                                                <span>R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-16 flex flex-col items-center">
                                <div className="w-80 border-t-2 border-zinc-900 pt-3 text-center">
                                    <p className="text-lg font-serif font-bold text-zinc-900 uppercase">{veterinarian || "Veterinário Responsável"}</p>
                                    <p className="text-xs text-zinc-500 font-bold tracking-widest">Médico Veterinário • CRMV-SP</p>
                                    <p className="text-[10px] text-zinc-400 mt-4 leading-tight">Emitido electronicamente em {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
