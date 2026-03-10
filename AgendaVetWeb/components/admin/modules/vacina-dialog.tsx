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
import { Syringe, Save, Trash2, Calendar, Edit2, ArrowLeft, FileDown, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface VacinaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

interface Vaccine {
    id: string
    vaccine_name: string
    application_date: string
    next_dose_date: string | null
    batch_number: string | null
    veterinarian: string | null
    notes: string | null
}

export function VacinaDialog({ open, onOpenChange, onBack, petId, petName }: VacinaDialogProps) {
    const [loading, setLoading] = useState(false)
    const [records, setRecords] = useState<Vaccine[]>([])
    const [vaccineName, setVaccineName] = useState('')
    const [applicationDate, setApplicationDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [nextDoseDate, setNextDoseDate] = useState('')
    const [batchNumber, setBatchNumber] = useState('')
    const [veterinarian, setVeterinarian] = useState('')
    const [notes, setNotes] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        if (open) loadRecords()
    }, [open, petId])

    const loadRecords = async () => {
        const { data, error } = await (supabase
            .from('pet_vaccines' as any)
            .select('*')
            .eq('pet_id', petId)
            .order('application_date', { ascending: false }) as any)

        if (error) {
            console.error('Error loading vaccines:', error)
            return
        }
        if (data) setRecords(data)
    }

    const handleSave = async () => {
        if (!vaccineName || !applicationDate) {
            toast.error('Nome da vacina e data são obrigatórios')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const payload = {
                pet_id: petId,
                user_id: userData.user?.id,
                vaccine_name: vaccineName,
                application_date: applicationDate,
                next_dose_date: nextDoseDate || null,
                batch_number: batchNumber || null,
                veterinarian: veterinarian || null,
                notes: notes || null,
            }

            if (editingId) {
                const { error } = await (supabase
                    .from('pet_vaccines' as any)
                    .update(payload as any)
                    .eq('id', editingId) as any)
                if (error) throw error
                toast.success('Vacina atualizada com sucesso!')
            } else {
                const { error } = await (supabase.from('pet_vaccines' as any).insert([payload] as any) as any)
                if (error) throw error
                toast.success('Vacina registrada com sucesso!')
            }

            resetForm()
            loadRecords()
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar vacina')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setVaccineName('')
        setNextDoseDate('')
        setBatchNumber('')
        setVeterinarian('')
        setNotes('')
        setApplicationDate(format(new Date(), 'yyyy-MM-dd'))
        setEditingId(null)
    }

    const handleEdit = (record: Vaccine) => {
        setVaccineName(record.vaccine_name)
        setApplicationDate(record.application_date)
        setNextDoseDate(record.next_dose_date || '')
        setBatchNumber(record.batch_number || '')
        setVeterinarian(record.veterinarian || '')
        setNotes(record.notes || '')
        setEditingId(record.id)
    }

    const handleDelete = async (id: string) => {
        try {
            const { error } = await (supabase.from('pet_vaccines' as any).delete().eq('id', id) as any)
            if (error) throw error
            toast.success('Vacina excluída')
            loadRecords()
        } catch (error: any) {
            toast.error(error.message || 'Erro ao excluir vacina')
        }
    }

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
                        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                            <Syringe className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Vacinas - {petName}</DialogTitle>
                            <DialogDescription>Gerencie o histórico de vacinação do paciente</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Form Side */}
                    <div className="w-full md:w-1/2 p-6 border-r border-border/30 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Plus className="size-4" />
                                    {editingId ? 'Editar Registro' : 'Novo Registro'}
                                </h3>
                                {editingId && (
                                    <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-xs">
                                        Cancelar Edição
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="vaccine_name">Nome da Vacina *</Label>
                                    <Input
                                        id="vaccine_name"
                                        value={vaccineName}
                                        onChange={(e) => setVaccineName(e.target.value)}
                                        placeholder="Ex: V10, Antirrábica..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="app_date">Data de Aplicação *</Label>
                                        <Input id="app_date" type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="next_date">Próxima Dose</Label>
                                        <Input id="next_date" type="date" value={nextDoseDate} onChange={(e) => setNextDoseDate(e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="batch">Lote</Label>
                                        <Input id="batch" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="Nº do Lote" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="vet">Veterinário</Label>
                                        <Input id="vet" value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} placeholder="Nome do Vet" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="vac-notes">Observações</Label>
                                    <Textarea
                                        id="vac-notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Notas adicionais..."
                                        className="min-h-[80px]"
                                    />
                                </div>

                                <Button onClick={handleSave} disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                                    <Save className="size-4 mr-2" />
                                    {loading ? 'Salvando...' : editingId ? 'Atualizar Vacina' : 'Salvar Vacina'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* List Side */}
                    <div className="w-full md:w-1/2 bg-muted/20 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-border/30 bg-muted/30 flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Histórico Recente</h3>
                            <Badge variant="outline" className="font-mono text-[10px]">{records.length} registros</Badge>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-3">
                                {records.length === 0 ? (
                                    <div className="text-center py-10">
                                        <Syringe className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">Nenhuma vacina registrada.</p>
                                    </div>
                                ) : (
                                    records.map((record) => (
                                        <Card key={record.id} className="border-border/30 shadow-none hover:border-emerald-500/30 transition-colors">
                                            <CardContent className="p-3">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-sm">{record.vaccine_name}</h4>
                                                            {record.batch_number && <Badge variant="secondary" className="text-[9px] h-4">Lote: {record.batch_number}</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                                                            <span className="flex items-center gap-1"><Calendar size={10} /> {format(new Date(record.application_date), 'dd/MM/yyyy')}</span>
                                                            {record.next_dose_date && (
                                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                                    <Calendar size={10} /> {format(new Date(record.next_dose_date), 'dd/MM/yyyy')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {record.notes && <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 italic">"{record.notes}"</p>}
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <Button variant="ghost" size="icon" className="size-7 rounded-full" onClick={() => handleEdit(record)}>
                                                            <Edit2 size={12} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-7 rounded-full text-destructive hover:bg-destructive/10" onClick={() => handleDelete(record.id)}>
                                                            <Trash2 size={12} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
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
