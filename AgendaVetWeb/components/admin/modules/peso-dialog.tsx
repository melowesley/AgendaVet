'use client'

import { useState, useEffect } from 'react'
import { mutate } from 'swr'
import { supabase } from '@/lib/data-store'
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
import { toast } from 'sonner'
import { Scale, Save, Trash2, Edit2, TrendingUp, TrendingDown, Minus, ArrowLeft, History, Plus, User, Info, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { usePet, useOwner, addMedicalRecord } from '@/lib/data-store'

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
    const [veterinarian, setVeterinarian] = useState('Dr. Cleyton Chaves')

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
                    veterinarian: 'Dr. Cleyton Chaves',
                })

                // Also insert into pet_weight_records for historical tracking
                const { error } = await (supabase.from('pet_weight_records' as any).insert([payload] as any) as any)
                if (error) throw error

                // Update the main pet weight in the pets table as well
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
            <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onBack}>
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className={`flex size-10 items-center justify-center rounded-full ${themeColor.bgGhost} ${themeColor.text}`}>
                            <Scale className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Peso e Crescimento - {petName}</DialogTitle>
                            <DialogDescription>Acompanhamento de peso e evolução corporal do paciente</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Form Side */}
                    <div className="w-full md:w-[45%] p-6 border-r border-border/30 overflow-y-auto">
                        <div className="space-y-8">
                            {/* Patient Badge */}
                            <div className={`p-4 rounded-2xl border-2 border-dashed ${themeColor.border}/30 ${themeColor.bgLight}/50 flex items-center gap-4`}>
                                <div className={`size-12 rounded-xl ${themeColor.bg} flex items-center justify-center text-white shadow-lg`}>
                                    <User className="size-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Paciente Registrado</p>
                                    <p className={`text-lg font-bold ${themeColor.text}`}>{petName}</p>
                                    <p className="text-[10px] opacity-70">{pet?.species} | {pet?.breed}</p>
                                </div>
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
                                <div className="flex items-center gap-2">
                                    <div className={`size-1.5 rounded-full ${themeColor.bg}`}></div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        {editingId ? 'Editar Pesagem' : 'Novo Registro de Peso'}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Peso Corporal (kg) *</Label>
                                        <div className="relative">
                                            <Scale className="absolute left-3 top-2.5 size-4 opacity-30" />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value)}
                                                placeholder="0.00"
                                                className="pl-9 h-11 text-lg font-mono font-bold focus:ring-red-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Data da Pesagem *</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-2.5 size-4 opacity-30" />
                                            <Input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="pl-9 h-11"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Observações do Estado Corporal</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Ex: Pós-jejum, balança nova, animal agitado..."
                                        className="min-h-[100px] bg-muted/10 resize-none hover:bg-muted/20 transition-all"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button onClick={handleSave} disabled={loading} className={`flex-1 h-12 ${themeColor.bg} ${themeColor.bgHover} text-white shadow-xl`}>
                                        <Save className="size-5 mr-3" />
                                        {loading ? 'Processando...' : editingId ? 'Atualizar Registro' : 'Confirmar Pesagem'}
                                    </Button>
                                    {editingId && (
                                        <Button variant="outline" className="h-12 px-6" onClick={resetForm}>Cancelar</Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Side */}
                    <div className="w-full md:w-[55%] bg-muted/5 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-border/30 bg-muted/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <History className={`size-5 ${themeColor.text}`} />
                                <h3 className="font-bold text-sm uppercase tracking-tight">Histórico de Desenvolvimento</h3>
                            </div>
                            <Badge variant="secondary" className="font-mono px-3 py-1 bg-white border-border/50 shadow-sm">{records.length} registros</Badge>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-3">
                                {records.length === 0 ? (
                                    <div className="text-center py-20 flex flex-col items-center gap-4">
                                        <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center">
                                            <Scale className="size-8 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-sm text-muted-foreground tracking-tight">Ainda não há registros de peso para este paciente.</p>
                                    </div>
                                ) : (
                                    records.map((record, idx) => (
                                        <div key={record.id} className="group relative flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-white hover:border-border hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                                            <div className="flex items-center gap-5">
                                                <div className={`flex size-12 items-center justify-center rounded-xl ${idx === 0 ? themeColor.bg : 'bg-muted'} text-white font-mono font-black text-lg shadow-sm group-hover:scale-105 transition-transform`}>
                                                    {record.weight}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(record.date), "dd 'de' MMMM, yyyy")}</p>
                                                    <p className="text-sm font-bold text-slate-700 tracking-tight">Registro de Desenvolvimento</p>
                                                    {record.notes && (
                                                        <div className="flex items-start gap-1.5 mt-2">
                                                            <Info className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                                                            <p className="text-[10px] text-muted-foreground italic leading-relaxed">{record.notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <Button variant="secondary" size="icon" className="size-9 rounded-full bg-muted shadow-sm hover:bg-white border border-border/50" onClick={() => handleEdit(record)}>
                                                    <Edit2 size={14} className="text-slate-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="size-9 rounded-full text-rose-500 hover:bg-rose-50" onClick={() => handleDelete(record.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                            {idx === 0 && (
                                                <div className={`absolute -top-2 -left-2 px-2 py-0.5 rounded-full ${themeColor.bg} text-white font-black text-[8px] uppercase tracking-tighter shadow-sm ring-2 ring-white`}>
                                                    Atual
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        {/* Footer context */}
                        <div className="p-4 border-t border-border/30 bg-muted/20">
                            <p className="text-[9px] text-center text-muted-foreground uppercase font-medium tracking-widest italic">
                                Monitoramento realizado por Dr. Cleyton Chaves através da plataforma AgendaVet
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
