'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/data-store'
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
import { FlaskConical, Save, Trash2, Download, Edit2, ArrowLeft, Plus, History } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface ExameDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

interface Exam {
    id: string
    pet_id: string
    exam_type: string
    exam_date: string
    results: string | null
    veterinarian: string | null
    file_url: string | null
    notes: string | null
}

export function ExameDialog({ open, onOpenChange, onBack, petId, petName }: ExameDialogProps) {
    const [loading, setLoading] = useState(false)
    const [records, setRecords] = useState<Exam[]>([])
    const [examType, setExamType] = useState('')
    const [examDate, setExamDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [results, setResults] = useState('')
    const [veterinarian, setVeterinarian] = useState('')
    const [fileUrl, setFileUrl] = useState('')
    const [notes, setNotes] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        if (open) loadRecords()
    }, [open, petId])

    const loadRecords = async () => {
        const { data, error } = await (supabase
            .from('pet_exams' as any)
            .select('*')
            .eq('pet_id', petId)
            .order('exam_date', { ascending: false }) as any)

        if (error) {
            console.error('Error loading exams:', error)
            return
        }
        if (data) setRecords(data)
    }

    const handleSave = async () => {
        if (!examType || !examDate) {
            toast.error('Tipo de exame e data são obrigatórios')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const payload = {
                pet_id: petId,
                user_id: userData.user?.id,
                exam_type: examType,
                exam_date: examDate,
                results: results || null,
                veterinarian: veterinarian || null,
                file_url: fileUrl || null,
                notes: notes || null,
            }

            if (editingId) {
                const { error } = await (supabase
                    .from('pet_exams' as any)
                    .update(payload as any)
                    .eq('id', editingId) as any)
                if (error) throw error
                toast.success('Exame atualizado com sucesso!')
            } else {
                const { error } = await (supabase.from('pet_exams' as any).insert([payload] as any) as any)
                if (error) throw error
                toast.success('Exame registrado com sucesso!')
            }

            mutate('medical-records')
            resetForm()
            loadRecords()
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar exame')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setExamType('')
        setResults('')
        setVeterinarian('')
        setFileUrl('')
        setNotes('')
        setExamDate(format(new Date(), 'yyyy-MM-dd'))
        setEditingId(null)
    }

    const handleEdit = (record: Exam) => {
        setExamType(record.exam_type)
        setExamDate(record.exam_date)
        setResults(record.results || '')
        setVeterinarian(record.veterinarian || '')
        setFileUrl(record.file_url || '')
        setNotes(record.notes || '')
        setEditingId(record.id)
    }

    const handleDelete = async (id: string) => {
        try {
            const { error } = await (supabase.from('pet_exams' as any).delete().eq('id', id) as any)
            if (error) throw error
            mutate('medical-records')
            toast.success('Exame excluído')
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
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onBack}>
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className="flex size-10 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
                            <FlaskConical className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Exames - {petName}</DialogTitle>
                            <DialogDescription>Registro e acompanhamento de exames laboratoriais e de imagem</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Form Side */}
                    <div className="w-full md:w-1/2 p-6 border-r border-border/30 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Plus className="size-4" />
                                    {editingId ? 'Editar Resultado' : 'Novo Resultado'}
                                </h3>

                                <div className="space-y-1.5">
                                    <Label htmlFor="exam-type">Tipo de Exame *</Label>
                                    <Input id="exam-type" value={examType} onChange={(e) => setExamType(e.target.value)} placeholder="Ex: Hemograma, Raio-X, Ultrassom..." />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="exam-date">Data *</Label>
                                        <Input id="exam-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="exam-vet">Veterinário Ref.</Label>
                                        <Input id="exam-vet" value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} placeholder="Nome do Vet" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="exam-results">Resultados / Conclusão</Label>
                                    <Textarea id="exam-results" value={results} onChange={(e) => setResults(e.target.value)} placeholder="Valores de referência, achados, laudo..." className="min-h-[120px]" />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="exam-url">URL do Laudo/Arquivo</Label>
                                    <Input id="exam-url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="exam-notes">Observações Internas</Label>
                                    <Textarea id="exam-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Solicitar repetição em 30 dias..." className="min-h-[60px]" />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button onClick={handleSave} disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
                                        <Save className="size-4 mr-2" />
                                        {loading ? 'Salvando...' : 'Salvar Exame'}
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
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <History className="size-4" />
                                Histórico de Exames
                            </h3>
                            <Badge variant="outline" className="font-mono text-[10px]">{records.length} registros</Badge>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-3">
                                {records.length === 0 ? (
                                    <div className="text-center py-10 border border-dashed rounded-xl border-border/50 bg-background/50">
                                        <FlaskConical className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Nenhum exame cadastrado.</p>
                                    </div>
                                ) : (
                                    records.map((record) => (
                                        <Card key={record.id} className="border-border/50 shadow-sm overflow-hidden group">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-sm text-violet-700">{record.exam_type}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="secondary" className="font-mono text-[10px] bg-violet-100 text-violet-700 border-none">
                                                                {format(new Date(record.exam_date), 'dd/MM/yyyy')}
                                                            </Badge>
                                                            {record.veterinarian && (
                                                                <span className="text-[10px] text-muted-foreground border-l border-border pl-2">
                                                                    Vet: {record.veterinarian}
                                                                </span>
                                                            )}
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

                                                {record.results && (
                                                    <div className="bg-muted/30 rounded-md p-3 text-xs border border-border/30 mb-2">
                                                        <p className="font-semibold mb-1 text-muted-foreground text-[10px] uppercase">Resultados</p>
                                                        <p className="whitespace-pre-wrap">{record.results}</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-3 text-xs">
                                                    {record.notes ? (
                                                        <p className="text-muted-foreground italic flex-1 truncate pr-2">Obs: {record.notes}</p>
                                                    ) : <div className="flex-1"></div>}

                                                    {record.file_url && (
                                                        <a
                                                            href={record.file_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-1 rounded"
                                                        >
                                                            <Download size={12} />
                                                            Laudo
                                                        </a>
                                                    )}
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
