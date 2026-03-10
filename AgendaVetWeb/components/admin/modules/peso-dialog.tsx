'use client'

import { useState, useEffect } from 'react'
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
import { Scale, Save, Trash2, Edit2, TrendingUp, TrendingDown, Minus, ArrowLeft, History, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

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
    const [loading, setLoading] = useState(false)
    const [records, setRecords] = useState<WeightRecord[]>([])
    const [weight, setWeight] = useState('')
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [notes, setNotes] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        if (open) loadRecords()
    }, [open, petId])

    const loadRecords = async () => {
        const { data, error } = await supabase
            .from('pet_weight_records')
            .select('*')
            .eq('pet_id', petId)
            .order('date', { ascending: false })

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
                const { error } = await supabase
                    .from('pet_weight_records')
                    .update(payload)
                    .eq('id', editingId)
                if (error) throw error
                toast.success('Peso atualizado com sucesso!')
            } else {
                const { error } = await supabase.from('pet_weight_records').insert([payload])
                if (error) throw error
                toast.success('Peso registrado com sucesso!')

                // Update the main pet weight in the pets table as well
                await supabase.from('pets').update({ weight: parseFloat(weight) }).eq('id', petId)
            }

            resetForm()
            loadRecords()
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
            const { error } = await supabase.from('pet_weight_records').delete().eq('id', id)
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
            <DialogContent className="sm:max-w-3xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0 border-b border-border/50">
                    <div className="flex items-center gap-4 mb-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onBack}>
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className="flex size-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                            <Scale className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Peso - {petName}</DialogTitle>
                            <DialogDescription>Acompanhamento de peso e evolução</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Form Side */}
                    <div className="w-full md:w-1/2 p-6 border-r border-border/30 overflow-y-auto">
                        <div className="space-y-6">
                            {/* Quick Stats */}
                            {records.length > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                    <Card className="bg-muted/30 border-none shadow-none text-center p-3">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Último Peso</p>
                                        <p className="text-2xl font-bold font-mono">{records[0].weight} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
                                    </Card>
                                    <Card className="bg-muted/30 border-none shadow-none text-center p-3">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Variação</p>
                                        {variation ? (
                                            <div className="flex items-center justify-center gap-1">
                                                {variation.isPositive ? <TrendingUp size={18} className="text-emerald-500" /> : variation.isNeutral ? <Minus size={18} className="text-muted-foreground" /> : <TrendingDown size={18} className="text-rose-500" />}
                                                <p className={`text-xl font-bold font-mono ${variation.isPositive ? 'text-emerald-500' : variation.isNeutral ? 'text-muted-foreground' : 'text-rose-500'}`}>
                                                    {variation.diff > 0 ? '+' : ''}{variation.diff.toFixed(2)}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-xl font-bold text-muted-foreground">-</p>
                                        )}
                                    </Card>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Plus className="size-4" />
                                    {editingId ? 'Editar Registro' : 'Novo Registro'}
                                </h3>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="weight-input">Peso (kg) *</Label>
                                        <Input id="weight-input" type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.00" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="weight-date">Data *</Label>
                                        <Input id="weight-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="weight-notes">Observações</Label>
                                    <Textarea id="weight-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Pós-jejum, balança nova..." className="min-h-[80px]" />
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={handleSave} disabled={loading} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                                        <Save className="size-4 mr-2" />
                                        {loading ? 'Salvando...' : 'Salvar Peso'}
                                    </Button>
                                    {editingId && (
                                        <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* List Side */}
                    <div className="w-full md:w-1/2 bg-muted/20 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-border/30 bg-muted/30 flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Histórico</h3>
                            <Badge variant="outline" className="font-mono text-[10px]">{records.length} pesagens</Badge>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-2">
                                {records.length === 0 ? (
                                    <div className="text-center py-10">
                                        <Scale className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">Nenhum histórico de peso.</p>
                                    </div>
                                ) : (
                                    records.map((record) => (
                                        <div key={record.id} className="group flex items-center justify-between p-3 rounded-lg border border-border/30 bg-background/50 hover:bg-background transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-8 items-center justify-center rounded bg-muted text-muted-foreground font-mono font-bold text-xs ring-1 ring-border/50">
                                                    {record.weight}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium">{format(new Date(record.date), 'dd/MM/yyyy')}</p>
                                                    {record.notes && <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{record.notes}</p>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="size-7 rounded-full" onClick={() => handleEdit(record)}>
                                                    <Edit2 size={12} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="size-7 rounded-full text-destructive hover:bg-destructive/10" onClick={() => handleDelete(record.id)}>
                                                    <Trash2 size={12} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
