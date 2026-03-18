'use client'

import { useState, useEffect, useRef } from 'react'
import { mutate } from 'swr'
import { supabase } from '@/lib/data-store'
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
import { Scale, Save, Trash2, Edit2, TrendingUp, TrendingDown, ArrowLeft, Plus, Printer, PawPrint, Clock, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { usePet, useOwner, useMedicalRecords, addMedicalRecord } from '@/lib/data-store'
import { useReactToPrint } from 'react-to-print'

interface PesoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

interface WeightRecord {
    id: string
    weight: number
    date: string
    notes: string | null
}

export function PesoDialog({ open, onOpenChange, onBack, petId, petName }: PesoDialogProps) {
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
    const [records, setRecords] = useState<WeightRecord[]>([])
    const [weight, setWeight] = useState('')
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [notes, setNotes] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [veterinarian, setVeterinarian] = useState('')

    const printRef = useRef<HTMLDivElement>(null)
    const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Peso_${petName}_${format(new Date(), 'dd_MM_yyyy')}` })

    useEffect(() => {
        if (open) loadRecords()
    }, [open, petId])

    const loadRecords = async () => {
        const { data, error } = await (supabase
            .from('pet_weight_records' as any)
            .select('*')
            .eq('pet_id', petId)
            .order('date', { ascending: false }) as any)

        if (error) {
            console.error('Error loading weights:', error)
            return
        }
        if (data) setRecords(data)
    }

    const handleSave = async () => {
        if (!weight || !date) {
            toast.error('Peso e data são obrigatórios')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const payload = {
                pet_id: petId,
                user_id: userData.user?.id,
                weight: parseFloat(weight),
                date,
                notes: notes || null,
            }

            if (editingId) {
                const { error } = await (supabase
                    .from('pet_weight_records' as any)
                    .update(payload as any)
                    .eq('id', editingId) as any)
                if (error) throw error
                toast.success('Peso atualizado com sucesso!')
            } else {
                await addMedicalRecord({
                    petId,
                    date: new Date(date).toISOString(),
                    type: 'procedure',
                    title: 'Pesagem',
                    description: `Peso: ${weight} kg. ${notes ? `Obs: ${notes}` : ''}`,
                    veterinarian: '',
                })

                const { error } = await (supabase.from('pet_weight_records' as any).insert([payload] as any) as any)
                if (error) throw error

                await (supabase.from('pets').update({ weight: parseFloat(weight) } as any).eq('id', petId) as any)

                toast.success('Peso registrado com sucesso!')
            }

            resetForm()
            loadRecords()
            mutate('pets')
            mutate('medical-records')
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar peso')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setWeight('')
        setNotes('')
        setDate(format(new Date(), 'yyyy-MM-dd'))
        setEditingId(null)
    }

    const handleEdit = (record: WeightRecord) => {
        setWeight(record.weight.toString())
        setDate(record.date)
        setNotes(record.notes || '')
        setEditingId(record.id)
    }

    const handleDelete = async (id: string) => {
        try {
            const { error } = await (supabase.from('pet_weight_records' as any).delete().eq('id', id) as any)
            if (error) throw error
            toast.success('Registro de peso excluído')
            loadRecords()
        } catch (error: any) {
            toast.error(error.message || 'Erro ao excluir registro')
        }
    }

    const calculateVariation = () => {
        if (records.length < 2) return null
        const latest = records[0].weight
        const previous = records[1].weight
        const diff = latest - previous
        return { diff, isPositive: diff > 0, isNeutral: diff === 0 }
    }

    const variation = calculateVariation()

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
                            <Scale className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">
                                Peso e Crescimento
                            </DialogTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 font-medium">
                                <span className="flex items-center gap-1"><PawPrint className="size-3.5" /> <span className="font-bold text-slate-700">{petName}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className={`flex items-center gap-1 font-bold ${themeColor.text} uppercase tracking-tighter text-[11px] ${themeColor.bgGhost} px-2 py-0.5 rounded border ${themeColor.borderLight}`}>Body Score</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-bold text-slate-500">
                            Fechar
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className={`h-10 px-6 font-black ${themeColor.bg} ${themeColor.bgHover} text-white shadow-lg`}>
                            <Save className="size-4 mr-2" />
                            {loading ? 'Processando...' : editingId ? 'Atualizar' : 'Confirmar Pesagem'}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex bg-slate-100/50">
                    {/* Left Sidebar with Patient History */}
                    <div className="hidden xl:block w-[380px] bg-slate-50/80 border-r border-border/30 p-8 overflow-y-auto shrink-0 shadow-inner">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-l-4 border-emerald-500 pl-4 mb-8">
                            Histórico de Pesagens
                        </h3>

                        {records.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center gap-4 opacity-50">
                                <Scale className="size-10 text-slate-300" />
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Sem registros prévios</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {records.map((record, idx) => (
                                    <div key={record.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-500 transition-all hover:shadow-md group relative">
                                        {idx === 0 && (
                                            <div className={`absolute -top-2 -left-2 px-2 py-0.5 rounded-full ${themeColor.bg} text-white font-black text-[8px] uppercase tracking-tighter shadow-sm ring-2 ring-white`}>
                                                Atual
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[11px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-[3px]">
                                                {format(new Date(record.date), "dd/MM/yyyy")}
                                            </span>
                                            <span className={`text-lg font-black font-mono ${themeColor.text}`}>
                                                {record.weight} kg
                                            </span>
                                        </div>
                                        {record.notes && (
                                            <p className="text-[10px] text-muted-foreground italic leading-relaxed mb-2">{record.notes}</p>
                                        )}
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <Button variant="secondary" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => handleEdit(record)}>
                                                <Edit2 size={10} className="mr-1" /> Editar
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-7 text-[10px] text-rose-500 hover:bg-rose-50 rounded-lg" onClick={() => handleDelete(record.id)}>
                                                <Trash2 size={10} className="mr-1" /> Excluir
                                            </Button>
                                        </div>
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
                                    {editingId ? 'Editar Pesagem' : 'Novo Registro de Peso'}
                                </h3>
                                {editingId && (
                                    <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-xs font-bold text-slate-500">
                                        Cancelar
                                    </Button>
                                )}
                            </div>

                            {/* Stats */}
                            {records.length > 0 && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-2xl ${themeColor.bgGhost} border border-border/50 text-center relative overflow-hidden group`}>
                                        <div className={`absolute top-0 right-0 p-1 opacity-10 group-hover:scale-110 transition-transform ${themeColor.text}`}>
                                            <Scale className="size-12" />
                                        </div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 relative z-10">Última Pesagem</p>
                                        <p className="text-3xl font-black font-mono relative z-10">{records[0].weight} <span className="text-xs font-normal">kg</span></p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:scale-110 transition-transform">
                                            {variation?.isPositive ? <TrendingUp className="size-12 text-emerald-500" /> : <TrendingDown className="size-12 text-rose-500" />}
                                        </div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 relative z-10">Variação</p>
                                        {variation ? (
                                            <div className="flex items-center justify-center gap-2 relative z-10">
                                                <p className={`text-2xl font-black font-mono ${variation.isPositive ? 'text-emerald-500' : variation.isNeutral ? 'text-muted-foreground' : 'text-rose-500'}`}>
                                                    {variation.diff > 0 ? '+' : ''}{variation.diff.toFixed(2)}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-2xl font-black text-muted-foreground relative z-10">-</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Peso Corporal (kg) *</Label>
                                        <div className="relative">
                                            <Scale className="absolute left-3 top-3.5 size-4 opacity-30" />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value)}
                                                placeholder="0.00"
                                                className="pl-9 h-12 text-lg font-mono font-bold border-slate-200 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data da Pesagem *</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3.5 size-4 opacity-30" />
                                            <Input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="pl-9 h-12 border-slate-200 rounded-xl font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações do Estado Corporal</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Ex: Pós-jejum, balança nova, animal agitado..."
                                        className="min-h-[120px] border-slate-200 rounded-xl font-medium resize-none"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button onClick={handleSave} disabled={loading} className={`flex-1 h-16 text-lg font-black ${themeColor.bg} ${themeColor.bgHover} text-white shadow-xl rounded-2xl transition-all hover:scale-[1.02] active:scale-95`}>
                                        <Save className="size-6 mr-2" />
                                        {loading ? 'Processando...' : editingId ? 'Atualizar Registro' : 'Confirmar Pesagem'}
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
                            <div className={`border-b-2 pb-4 mb-6 flex justify-between items-end ${themeColor.border}`}>
                                <div>
                                    <h2 className={`text-xl font-bold uppercase tracking-widest ${themeColor.text}`}>Ficha de Acompanhamento de Peso</h2>
                                    <p className="text-[10px] opacity-70 mt-1 uppercase text-slate-500">Relatório de Evolução Corporal</p>
                                </div>
                                <div className={`text-right ${themeColor.text}`}>
                                    <Scale className="size-8 ml-auto mb-1 opacity-20" />
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">AgendaVet System v2.0</p>
                                </div>
                            </div>

                            <div className="border border-slate-400 p-6 mb-8 rounded-sm bg-slate-50/50">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">PACIENTE</p>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{petName}</p>
                                        <div className="text-[10px] space-y-0.5 mt-2 border-t border-slate-200 pt-2 text-slate-600 font-medium">
                                            <p><span className="font-bold text-slate-400 uppercase text-[9px]">Espécie:</span> {pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : pet?.species}</p>
                                            <p><span className="font-bold text-slate-400 uppercase text-[9px]">Raça:</span> {pet?.breed}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-right border-l border-slate-200 pl-8">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">TUTOR</p>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{owner?.fullName || 'S/R'}</p>
                                        <p className="text-[10px] mt-2 border-t border-slate-200 pt-2 text-slate-600 font-medium">{owner?.phone || 'Sem contato'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-8">
                                {/* Current Weight Highlight */}
                                <div className={`border border-slate-300 p-6 rounded-sm bg-white relative`}>
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${themeColor.bg}`}></div>
                                    <div className="flex items-center gap-5 mb-4 border-b border-slate-100 pb-4">
                                        <div className={`p-4 rounded-xl ${themeColor.bg} text-white shadow-lg`}>
                                            <Scale className="size-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-3xl text-slate-900 tracking-tighter">
                                                {weight || (records.length > 0 ? records[0].weight : '---')} <span className="text-base font-normal text-slate-400">kg</span>
                                            </h3>
                                            <p className={`text-xs ${themeColor.text} font-black uppercase tracking-widest mt-0.5`}>
                                                Pesagem em {format(new Date(date), 'dd/MM/yyyy')}
                                            </p>
                                        </div>
                                    </div>

                                    {variation && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-3 border border-slate-200 rounded-sm text-center">
                                                <p className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-2">Variação</p>
                                                <p className={`text-lg font-black tracking-tight ${variation.isPositive ? 'text-emerald-500' : variation.isNeutral ? 'text-slate-500' : 'text-rose-500'}`}>
                                                    {variation.diff > 0 ? '+' : ''}{variation.diff.toFixed(2)} kg
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-3 border border-slate-200 rounded-sm text-center">
                                                <p className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-2">Total de Registros</p>
                                                <p className="text-lg font-black text-slate-800 tracking-tight">{records.length}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Observation */}
                                <div className="border border-slate-300 p-6 rounded-sm min-h-[120px] bg-slate-50/20">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 pb-2 mb-4">Observações do Estado Corporal</h4>
                                    <div className="text-[12px] leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                                        {notes || "Nenhuma observação registrada para esta pesagem."}
                                    </div>
                                </div>

                                {/* Weight History Table */}
                                {records.length > 0 && (
                                    <div className="border border-slate-300 rounded-sm overflow-hidden">
                                        <div className={`px-4 py-2 text-[10px] font-black uppercase text-white tracking-[0.25em] ${themeColor.bg}`}>Histórico de Evolução</div>
                                        <div className="divide-y divide-slate-100">
                                            {records.slice(0, 8).map((rec, idx) => (
                                                <div key={rec.id} className="flex justify-between items-center px-6 py-3 text-[11px]">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-mono font-black ${idx === 0 ? themeColor.text : 'text-slate-600'}`}>{rec.weight} kg</span>
                                                        {idx === 0 && <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 font-black uppercase">Atual</Badge>}
                                                    </div>
                                                    <span className="text-slate-400 font-bold">{format(new Date(rec.date), 'dd/MM/yyyy')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                        {/* Footer context */}
                        <div className="p-4 border-t border-border/30 bg-muted/20">
                            <p className="text-[9px] text-center text-muted-foreground uppercase font-medium tracking-widest italic">
                                Monitoramento de peso e crescimento · Plataforma AgendaVet
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            </DialogContent>
        </Dialog>
    )
}
