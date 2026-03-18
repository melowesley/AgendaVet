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
import { FlaskConical, Save, Trash2, Download, Edit2, ArrowLeft, Plus, History, Clock, Printer, PawPrint, DollarSign, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { usePet, useOwner, useMedicalRecords } from '@/lib/data-store'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

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
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')
    const { records: allRecords } = useMedicalRecords(petId)
    
    const printRef = useRef<HTMLDivElement>(null)
    const handlePrint = useReactToPrint({ contentRef: printRef })

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
            <DialogContent className="w-[95vw] max-w-[1400px] h-[90vh] max-h-[90vh] rounded-2xl p-0 flex flex-col overflow-hidden border border-border/20 shadow-2xl text-slate-800">
                <DialogHeader className="p-4 md:p-6 border-b border-border/50 bg-white flex flex-row items-center justify-between shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100" onClick={onBack}>
                                <ArrowLeft className="size-5" />
                            </Button>
                        )}
                        <div className={`flex size-12 items-center justify-center rounded-xl shadow-inner`} style={{background: 'linear-gradient(135deg, #13C8CC, #002653)'}}>
                            <FlaskConical className="size-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">
                                Central de Exames
                            </DialogTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 font-medium">
                                <span className="flex items-center gap-1"><PawPrint className="size-3.5" /> <span className="font-bold text-slate-700">{petName}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 font-bold text-violet-600 uppercase tracking-tighter text-[11px] bg-violet-50 px-2 py-0.5 rounded border border-violet-100">Laudos & Imagens</span>
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
                    <div className="hidden xl:block w-[380px] bg-slate-50/80 border-r border-border/30 p-8 overflow-y-auto shrink-0 shadow-inner">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-l-4 border-violet-500 pl-4 mb-8">
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
                                    <div key={record.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-violet-500 transition-all hover:shadow-md group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[11px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-[3px]">
                                                {format(new Date(record.date || record.createdAt), "dd/MM/yyyy")}
                                            </span>
                                            <span className="text-[10px] font-black uppercase text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 group-hover:bg-violet-500 group-hover:text-white transition-colors">
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
                                    {editingId ? 'Editar Exame' : 'Novo Registro'}
                                </h3>
                                {editingId && (
                                    <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-xs font-bold text-slate-500">
                                        Cancelar
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="exam-type" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Exame *</Label>
                                    <Input
                                        id="exam-type"
                                        value={examType}
                                        onChange={(e) => setExamType(e.target.value)}
                                        placeholder="Ex: Hemograma, Raio-X, Ultrassom..."
                                        className="h-12 border-slate-200 rounded-xl focus:ring-violet-500 font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="exam-date" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data do Exame *</Label>
                                        <Input id="exam-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="h-12 border-slate-200 rounded-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="exam-vet" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Veterinário Ref.</Label>
                                        <Input id="exam-vet" value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} placeholder="Nome do Vet" className="h-12 border-slate-200 rounded-xl font-bold" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="exam-results" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Laudo / Conclusão</Label>
                                    <Textarea
                                        id="exam-results"
                                        value={results}
                                        onChange={(e) => setResults(e.target.value)}
                                        placeholder="Descreva os achados, valores de referência ou conclusão do exame..."
                                        className="min-h-[150px] border-slate-200 rounded-xl font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="exam-url" className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL do Arquivo (Laudo Digital)</Label>
                                    <div className="relative">
                                        <Input id="exam-url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." className="h-12 border-slate-200 rounded-xl font-bold pl-10" />
                                        <FileText className="absolute left-3.5 top-3.5 size-5 text-slate-300" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="exam-notes" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações Internas</Label>
                                    <Textarea
                                        id="exam-notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Notas para controle interno (ex: repetir em 30 dias)..."
                                        className="min-h-[80px] border-slate-200 rounded-xl font-medium bg-slate-50/50"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button onClick={handleSave} disabled={loading} className={`flex-1 h-10 font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm rounded-lg`}>
                                        <Save className="size-4 mr-2" />
                                        {loading ? 'Salvando...' : 'Salvar Registro'}
                                    </Button>

                                    <Button variant="outline" className="h-10 px-4 rounded-lg" title="Imprimir" onClick={() => handlePrint()}>
                                        <Printer className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-1 bg-slate-200/50 p-6 lg:p-12 overflow-y-auto justify-center items-start">
                        <div
                            ref={printRef}
                            className={`w-full max-w-[650px] min-h-[700px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm border p-12 flex flex-col text-slate-900 border-slate-200 border-t-8`}
                            style={{borderImage: 'linear-gradient(to right, #13C8CC, #002653) 1', borderTopColor: 'transparent'}}
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
                                <p className="text-lg font-black text-slate-800 uppercase tracking-tight">RELATÓRIO DE EXAME</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Documento Auxiliar de Diagnóstico</p>
                                <p className="text-[9px] text-slate-400 mt-2">Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
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
                                <div className={`border border-slate-300 p-6 rounded-sm bg-white relative`}>
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600"></div>
                                    <div className="flex items-center gap-5 mb-6 border-b border-slate-100 pb-5">
                                        <div className={`p-4 rounded-xl bg-violet-600 text-white shadow-lg`}>
                                            <FlaskConical className="size-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-2xl text-slate-900 tracking-tighter uppercase">{examType || 'Aguardando tipo...'}</h3>
                                            <p className="text-xs text-violet-600 font-black uppercase tracking-widest mt-0.5">Realizado em {format(new Date(examDate), 'dd/MM/yyyy')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em]">Veterinário Responsável</p>
                                        <p className="text-sm font-black text-slate-800 tracking-tight border-l-2 border-slate-200 pl-3">{veterinarian || 'Não informado'}</p>
                                    </div>
                                </div>

                                <div className="border border-slate-300 p-6 rounded-sm min-h-[300px] bg-slate-50/20">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 pb-2 mb-4">Laudo Técnico / Resultados</h4>
                                    <div className="text-[12px] leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                                        {results || "O laudo detalhado deste exame não foi preenchido ou está pendente de processamento laboratorial."}
                                    </div>
                                </div>

                                {fileUrl && (
                                    <div className="p-4 bg-violet-50 border border-violet-100 rounded-sm flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="size-5 text-violet-500" />
                                            <div>
                                                <p className="text-[10px] font-black text-violet-700 uppercase tracking-widest">Documento Digital Disponível</p>
                                                <p className="text-[11px] text-violet-600/70 font-medium truncate max-w-[300px]">{fileUrl}</p>
                                            </div>
                                        </div>
                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="bg-violet-600 text-white text-[10px] font-black px-4 py-2 rounded uppercase tracking-widest hover:bg-violet-700 transition-colors">
                                            Ver Original
                                        </a>
                                    </div>
                                )}
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
