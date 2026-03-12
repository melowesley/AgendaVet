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
import { Skull, Save, ArrowLeft, Printer, DollarSign, Plus, Trash2, Heart, Clock, Calendar } from 'lucide-react'
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

    const isMale = pet?.gender === 'Macho'
    const themeColor = {
        bg: 'bg-zinc-800', // Sober for death
        bgHover: 'hover:bg-zinc-900',
        bgGhost: 'bg-zinc-500/10',
        text: 'text-zinc-800',
        border: 'border-zinc-500',
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
    const handlePrint = useReactToPrint({ contentRef: printRef })

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

            // Mark pet as deceased - assuming there's a status or similar in pets table
            // If there's no status field, we might need to add one or just rely on the record
            // For now, let's just save the record.

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
            <DialogContent className="w-[95vw] max-w-[1400px] h-[95vh] flex flex-col p-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onBack}>
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className={`flex size-10 items-center justify-center rounded-full ${themeColor.bgGhost} text-zinc-600`}>
                            <Skull className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Registro de Óbito - {petName}</DialogTitle>
                            <DialogDescription>Procedimento de encerramento de ficha clínica</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* NEW: Left Sidebar with Patient History */}
                    <div className="hidden lg:block w-[300px] bg-slate-50/50 border-r border-border/30 p-6 overflow-y-auto shrink-0 mt-0">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-l-4 border-zinc-500 pl-3 mb-4">
                            Histórico do Paciente
                        </h3>
                        
                        {allRecords.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-xs text-muted-foreground italic">Nenhum registro anterior.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allRecords.map(record => (
                                    <div key={record.id} className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-zinc-300 transition-colors">
                                        <div className="flex justify-between items-start mb-1.5">
                                            <span className="text-[9px] font-bold text-slate-400">
                                                {format(new Date(record.date || record.createdAt), "dd/MM")}
                                            </span>
                                            <span className="text-[9px] font-black uppercase text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                                                {record.type}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{record.title}</h4>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Side */}
                    <div className="w-full md:w-1/3 lg:w-[400px] p-6 border-r border-border/30 overflow-y-auto shrink-0">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data do Óbito *</Label>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hora do Óbito *</Label>
                                    <Input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Causa Provável *</Label>
                                <Input
                                    placeholder="Ex: Parada Cardiorrespiratória, Falência Múltipla..."
                                    value={causa}
                                    onChange={(e) => setCausa(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações Adicionais</Label>
                                <Textarea
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    placeholder="Circunstâncias, eutanásia (se houver), condutas finais..."
                                    rows={4}
                                />
                            </div>

                            {/* Billing Section */}
                            <div className={`p-4 rounded-xl border-2 border-dashed ${themeColor.border}/20 bg-zinc-50/50 space-y-3`}>
                                <div className={`flex items-center gap-2 ${themeColor.text} font-bold text-xs uppercase tracking-wider`}>
                                    <DollarSign className="size-4" />
                                    Custos Finais (Eutanásia/Destinação)
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Taxa Base (R$)</Label>
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
                                            onClick={() => setServices([...services, { id: Math.random().toString(), name: 'Taxa Adicional', value: 0 }])}
                                        >
                                            <Plus className="size-3 mr-1" /> Add Taxa
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
                                            placeholder="Descrição"
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
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={handleSave} disabled={loading} className={`flex-1 ${themeColor.bg} ${themeColor.bgHover} text-white shadow-lg`}>
                                    <Save className="size-4 mr-2" />
                                    {loading ? 'Processando...' : 'Finalizar Registro'}
                                </Button>

                                <Button variant="outline" className="flex-1" onClick={() => handlePrint()}>
                                    <Printer className="size-4 mr-2" />
                                    Imprimir Declaração
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block flex-1 bg-zinc-100/50 p-4 lg:p-8 overflow-y-auto">
                        <div
                            ref={printRef}
                            className="w-full max-w-[600px] mx-auto min-h-[842px] bg-white shadow-2xl rounded-sm border-2 border-zinc-300 p-12 flex flex-col text-zinc-900"
                        >
                            <div className="border-b-4 border-zinc-900 pb-8 mb-10 text-center">
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
