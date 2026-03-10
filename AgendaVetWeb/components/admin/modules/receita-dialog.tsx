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
import { Pill, Save, Trash2, Edit2, ArrowLeft, FileDown, Plus, ScrollText, ShieldAlert, ChevronRight, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface ReceitaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

type ReceiptType = null | 'simples' | 'controlado'

interface Prescription {
    id: string
    pet_id: string
    medication_name: string
    prescription_date: string
    veterinarian: string | null
    notes: string | null
}

export function ReceitaDialog({ open, onOpenChange, onBack, petId, petName }: ReceitaDialogProps) {
    const [loading, setLoading] = useState(false)
    const [receiptType, setReceiptType] = useState<ReceiptType>(null)
    const [records, setRecords] = useState<Prescription[]>([])
    const [medicationName, setMedicationName] = useState('')
    const [prescriptionDate, setPrescriptionDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [veterinarian, setVeterinarian] = useState('')
    const [notes, setNotes] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        if (open) loadRecords()
        if (!open) setReceiptType(null)
    }, [open, petId])

    const loadRecords = async () => {
        const { data, error } = await (supabase.from('pet_prescriptions').select('*').eq('pet_id', petId).order('prescription_date', { ascending: false }) as any)
        if (error) {
            console.error('Error loading prescriptions:', error)
            return
        }
        if (data) setRecords(data)
    }

    const handleSave = async () => {
        if (!medicationName || !prescriptionDate) {
            toast.error('Nome do medicamento e data são obrigatórios')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const payload = {
                pet_id: petId,
                user_id: userData.user?.id,
                medication_name: medicationName,
                prescription_date: prescriptionDate,
                veterinarian: veterinarian || null,
                notes: JSON.stringify({
                    type: receiptType,
                    content: notes,
                }),
            }

            if (editingId) {
                const { error } = await (supabase.from('pet_prescriptions').update(payload).eq('id', editingId) as any)
                if (error) throw error
                toast.success('Receita atualizada com sucesso!')
            } else {
                const { error } = await (supabase.from('pet_prescriptions').insert([payload]) as any)
                if (error) throw error
                toast.success('Receita registrada com sucesso!')
            }

            resetForm()
            loadRecords()
            setReceiptType(null)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar receita')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setMedicationName('')
        setNotes('')
        setVeterinarian('')
        setPrescriptionDate(format(new Date(), 'yyyy-MM-dd'))
        setEditingId(null)
    }

    const handleEdit = (record: Prescription) => {
        setMedicationName(record.medication_name)
        setPrescriptionDate(record.prescription_date)
        setVeterinarian(record.veterinarian || '')
        try {
            const parsed = JSON.parse(record.notes || '{}')
            setNotes(parsed.content || '')
            setReceiptType(parsed.type || 'simples')
        } catch {
            setNotes(record.notes || '')
            setReceiptType('simples')
        }
        setEditingId(record.id)
    }

    const handleDelete = async (id: string) => {
        try {
            const { error } = await (supabase.from('pet_prescriptions').delete().eq('id', id) as any)
            if (error) throw error
            toast.success('Receita excluída')
            loadRecords()
        } catch (error: any) {
            toast.error(error.message || 'Erro ao excluir registro')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0 border-b border-border/50">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={receiptType ? () => setReceiptType(null) : onBack}>
                            <ArrowLeft size={18} />
                        </Button>
                        <div className="flex size-10 items-center justify-center rounded-full bg-pink-500/10 text-pink-500">
                            <Pill className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">
                                {receiptType === 'simples' ? 'Receituário Simples' : receiptType === 'controlado' ? 'Receituário Controlado' : 'Receitas'} - {petName}
                            </DialogTitle>
                            <DialogDescription>Gestão de prescrições e receituários</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    {receiptType === null && !editingId ? (
                        <div className="p-6 space-y-6 overflow-y-auto h-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setReceiptType('simples')}
                                    className="group flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-border/50 hover:border-blue-500 hover:bg-blue-500/5 transition-all duration-200 text-center"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                        <ScrollText className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">Receituário Simples</p>
                                        <p className="text-xs text-muted-foreground mt-1">Prescrição comum de medicamentos</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                                </button>

                                <button
                                    onClick={() => setReceiptType('controlado')}
                                    className="group flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-border/50 hover:border-pink-500 hover:bg-pink-500/5 transition-all duration-200 text-center"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                                        <ShieldAlert className="w-8 h-8 text-pink-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">Receituário Controlado</p>
                                        <p className="text-xs text-muted-foreground mt-1">2 vias - Controle especial</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm flex items-center gap-2">Histórico de Receitas</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {records.length === 0 ? (
                                        <div className="col-span-full text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                                            <Pill className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">Nenhuma receita registrada.</p>
                                        </div>
                                    ) : (
                                        records.map((record) => (
                                            <Card key={record.id} className="border-border/50 shadow-none hover:border-pink-500/30 transition-colors cursor-pointer" onClick={() => handleEdit(record)}>
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-sm truncate">{record.medication_name}</h4>
                                                            <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(record.prescription_date), 'dd/MM/yyyy')}</p>
                                                            {record.veterinarian && <p className="text-[10px] text-muted-foreground">Vet: {record.veterinarian}</p>}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" className="size-7 rounded-full text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}>
                                                                <Trash2 size={12} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row h-full overflow-hidden">
                            <div className="w-full md:w-1/2 p-6 border-r border-border/30 overflow-y-auto">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="med-name">Medicamento Principal / Título *</Label>
                                        <Input id="med-name" value={medicationName} onChange={(e) => setMedicationName(e.target.value)} placeholder="Ex: Amoxicilina + Clavulanato" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="rec-date">Data *</Label>
                                            <Input id="rec-date" type="date" value={prescriptionDate} onChange={(e) => setPrescriptionDate(e.target.value)} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="rec-vet">Veterinário</Label>
                                            <Input id="rec-vet" value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} placeholder="Nome do Vet" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="rec-content">Prescrição e Instruções</Label>
                                        <Textarea
                                            id="rec-content"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Posologia, via de administração, duração do tratamento..."
                                            className="min-h-[250px] font-serif leading-relaxed"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleSave} disabled={loading} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white">
                                            <Save className="size-4 mr-2" />
                                            {loading ? 'Salvando...' : 'Salvar Receita'}
                                        </Button>
                                        <Button variant="outline" className="flex-1">
                                            <FileDown className="size-4 mr-2" />
                                            Exportar PDF
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:block w-1/2 bg-muted/10 p-8 overflow-y-auto">
                                <div className="max-w-md mx-auto aspect-[1/1.414] bg-white shadow-2xl rounded-sm border border-border/20 p-8 flex flex-col text-[#1a1a1a]">
                                    <div className="border-b-2 border-pink-500 pb-4 mb-6 text-center">
                                        <h2 className="text-xl font-bold uppercase tracking-widest text-pink-600">Receituário {receiptType === 'controlado' ? 'Controlado' : 'Simples'}</h2>
                                        <p className="text-[10px] text-muted-foreground mt-1">AgendaVet - Gestão Veterinária Profissional</p>
                                    </div>
                                    <div className="flex-1 py-4">
                                        <div className="mb-4">
                                            <p className="text-[11px] font-bold text-pink-600">PACIENTE: <span className="text-black font-normal">{petName}</span></p>
                                        </div>
                                        <div className="space-y-4 whitespace-pre-wrap text-sm italic leading-relaxed">
                                            {notes || "A prescrição aparecerá aqui..."}
                                        </div>
                                    </div>
                                    <div className="mt-auto border-t border-border pt-4 text-center">
                                        <p className="text-xs font-bold">{veterinarian || "Veterinário Responsável"}</p>
                                        <p className="text-[10px] text-muted-foreground">Assinatura e Carimbo</p>
                                        <p className="text-[9px] text-muted-foreground mt-4">{format(new Date(prescriptionDate), 'dd/MM/yyyy')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
