'use client'

import { useState, useEffect, useRef } from 'react'
import { mutate } from 'swr'
import { supabase, usePet, useOwner } from '@/lib/data-store'
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
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse bg-muted rounded-md" /> })
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Pill, Save, Trash2, ArrowLeft, FileDown, ScrollText, ShieldAlert, ChevronRight, Printer, PawPrint } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import ReactToPrint from 'react-to-print'

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
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')

    const isFemale = pet?.gender === 'Fêmea'
    const themeColor = {
        bg: isFemale ? 'bg-pink-600' : 'bg-blue-600',
        bgHover: isFemale ? 'hover:bg-pink-700' : 'hover:bg-blue-700',
        bgLight: isFemale ? 'bg-pink-50' : 'bg-blue-50',
        bgGhost: isFemale ? 'bg-pink-500/10' : 'bg-blue-500/10',
        bgGhostHover: isFemale ? 'group-hover:bg-pink-500/20 hover:bg-pink-500/20' : 'group-hover:bg-blue-500/20 hover:bg-blue-500/20',
        text: isFemale ? 'text-pink-600' : 'text-blue-600',
        textDark: isFemale ? 'text-pink-900' : 'text-blue-900',
        border: isFemale ? 'border-pink-500' : 'border-blue-500',
        borderHover: isFemale ? 'hover:border-pink-500' : 'hover:border-blue-500',
        borderLight: isFemale ? 'border-pink-200' : 'border-blue-200',
    }

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['clean']
        ]
    }

    const [loading, setLoading] = useState(false)
    const [receiptType, setReceiptType] = useState<ReceiptType>(null)
    const [records, setRecords] = useState<Prescription[]>([])
    const [medicationName, setMedicationName] = useState('')
    const [prescriptionDate, setPrescriptionDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [veterinarian, setVeterinarian] = useState('')
    const [notes, setNotes] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)

    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (open) loadRecords()
        if (!open) setReceiptType(null)
    }, [open, petId])

    const loadRecords = async () => {
        const { data, error } = await (supabase.from('pet_prescriptions' as any).select('*').eq('pet_id', petId).order('prescription_date', { ascending: false }) as any)
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
                const { error } = await (supabase.from('pet_prescriptions' as any).update(payload as any).eq('id', editingId) as any)
                if (error) throw error
                toast.success('Receita atualizada com sucesso!')
            } else {
                const { error } = await (supabase.from('pet_prescriptions' as any).insert([payload] as any) as any)
                if (error) throw error
                toast.success('Receita registrada com sucesso!')
            }

            resetForm()
            loadRecords()
            mutate('medical-records')
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
            const { error } = await (supabase.from('pet_prescriptions' as any).delete().eq('id', id) as any)
            if (error) throw error
            toast.success('Receita excluída')
            loadRecords()
            mutate('medical-records')
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
                        <div className={`flex size-10 items-center justify-center rounded-full ${themeColor.bgGhost} ${themeColor.text}`}>
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
                                    className={`group flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-border/50 ${themeColor.borderHover} transition-all duration-200 text-center ${themeColor.bgGhostHover}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl ${themeColor.bgGhost} flex items-center justify-center transition-colors`}>
                                        <ScrollText className={`w-8 h-8 ${themeColor.text}`} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">Receituário Simples</p>
                                        <p className="text-xs text-muted-foreground mt-1">Prescrição comum de medicamentos</p>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-muted-foreground group-hover:${themeColor.text} transition-colors`} />
                                </button>

                                <button
                                    onClick={() => setReceiptType('controlado')}
                                    className={`group flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-border/50 ${themeColor.borderHover} transition-all duration-200 text-center ${themeColor.bgGhostHover}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl ${themeColor.bgGhost} flex items-center justify-center transition-colors`}>
                                        <ShieldAlert className={`w-8 h-8 ${themeColor.text}`} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">Receituário Controlado</p>
                                        <p className="text-xs text-muted-foreground mt-1">Controle especial</p>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-muted-foreground group-hover:${themeColor.text} transition-colors`} />
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
                                            <Card key={record.id} className={`border-border/50 shadow-none ${themeColor.borderHover} transition-colors cursor-pointer`} onClick={() => handleEdit(record)}>
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
                                        <Input id="med-name" value={medicationName} onChange={(e) => setMedicationName(e.target.value)} placeholder="Ex: Cloridrato de Fluoxetina" />
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
                                        <div className="bg-white text-black rounded-md overflow-hidden">
                                            <ReactQuill
                                                theme="snow"
                                                value={notes}
                                                onChange={setNotes}
                                                modules={modules}
                                                className="h-[200px] mb-12"
                                                placeholder="Posologia, via de administração, duração do tratamento..."
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleSave} disabled={loading} className={`flex-1 ${themeColor.bg} ${themeColor.bgHover} text-white`}>
                                            <Save className="size-4 mr-2" />
                                            {loading ? 'Salvando...' : 'Salvar Receita'}
                                        </Button>

                                        {/* @ts-ignore - React 19 type mismatch */}
                                        <ReactToPrint
                                            trigger={() => (
                                                <Button variant="outline" className="flex-1">
                                                    <Printer className="size-4 mr-2" />
                                                    Exportar PDF
                                                </Button>
                                            )}
                                            content={() => printRef.current}
                                            documentTitle={`Receituario_${receiptType}_${petName}`}
                                            pageStyle={`
                                              @page { size: auto; margin: 10mm; }
                                              @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                                            `}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* PREVIEW PANE */}
                            <div className={`hidden md:block w-1/2 bg-muted/10 p-4 md:p-8 overflow-y-auto`}>
                                <div
                                    ref={printRef}
                                    className={`w-full max-w-[600px] mx-auto aspect-[1/1.414] bg-white shadow-2xl rounded-sm border-2 p-6 flex flex-col text-slate-900 ${themeColor.borderLight}`}
                                >
                                    {/* SIMPLES LAYOUT */}
                                    {receiptType === 'simples' && (
                                        <>
                                            <div className={`border-b-2 pb-4 mb-6 text-center ${themeColor.border}`}>
                                                <h2 className={`text-xl font-bold uppercase tracking-widest ${themeColor.text}`}>Receituário Simples</h2>
                                                <p className="text-[10px] opacity-70 mt-1">AgendaVet - Gestão Veterinária Profissional</p>
                                            </div>
                                            <div className="flex-1 py-4">
                                                <div className="mb-4">
                                                    <p className={`text-[11px] font-bold ${themeColor.text}`}>PACIENTE: <span className="font-normal opacity-80">{petName}</span></p>
                                                </div>
                                                <div
                                                    className="space-y-4 text-sm italic leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1"
                                                    dangerouslySetInnerHTML={{ __html: notes ? DOMPurify.sanitize(notes) : "A prescrição aparecerá aqui..." }}
                                                />
                                            </div>
                                            <div className={`mt-auto border-t pt-4 text-center ${themeColor.borderLight}`}>
                                                <p className="text-xs font-bold">{veterinarian || "Veterinário Responsável"}</p>
                                                <p className="text-[10px] opacity-70">Assinatura e Carimbo</p>
                                                <p className="text-[9px] opacity-60 mt-4">{format(new Date(prescriptionDate), 'dd/MM/yyyy')}</p>
                                            </div>
                                        </>
                                    )}

                                    {/* CONTROLADO LAYOUT */}
                                    {receiptType === 'controlado' && (
                                        <div className={`flex flex-col h-full bg-white`}>
                                            <div className="flex border border-slate-400 mb-3">
                                                <div className="w-[55%] p-2 border-r border-slate-400 flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className={`size-6 rounded ${themeColor.bgGhost} flex items-center justify-center`}><PawPrint className={`size-4 ${themeColor.text}`} /></div>
                                                        <span className="font-bold text-[10px]">IDENTIFICAÇÃO DO EMITENTE</span>
                                                    </div>
                                                    <div className="text-[9px] space-y-1">
                                                        <div className="flex border-b border-slate-200 pb-0.5"><span className="font-bold w-12">Nome:</span> <span className="flex-1 truncate">{veterinarian || '________________'}</span></div>
                                                        <div className="flex border-b border-slate-200 pb-0.5"><span className="font-bold w-12">CRMV:</span> <span className="flex-1">_________</span></div>
                                                        <div className="flex border-b border-slate-200 pb-0.5"><span className="font-bold w-12">Telefone:</span> <span className="flex-1">________________</span></div>
                                                        <div className="flex border-b border-slate-200 pb-0.5"><span className="font-bold w-12">Endereço:</span> <span className="flex-1 truncate">________________</span></div>
                                                        <div className="flex border-b border-slate-200 pb-0.5"><span className="font-bold w-12">Cidade:</span> <span className="flex-1">________________</span> <span className="font-bold mx-1">UF:</span> <span>__</span></div>
                                                    </div>
                                                </div>
                                                <div className="w-[45%] p-2 flex flex-col items-center justify-center text-center">
                                                    <h1 className="font-bold text-sm leading-tight text-slate-800">RECEITUÁRIO DE<br />CONTROLE ESPECIAL</h1>
                                                    <p className="text-[10px] mt-2 text-slate-500">Receita Veterinária</p>
                                                </div>
                                            </div>

                                            <div className="border border-slate-400 p-2 mb-3">
                                                <h2 className="text-[9px] font-bold mb-1 text-slate-600">DADOS DO PACIENTE</h2>
                                                <div className="text-[10px] space-y-1">
                                                    <div className="flex border-b border-slate-200 pb-0.5"><span className="font-bold mr-1">Tutor:</span> <span>{owner?.fullName || owner?.firstName || '________________'}</span></div>
                                                    <div className="flex border-b border-slate-200 pb-0.5"><span className="font-bold mr-1">Endereço:</span> <span className="truncate">{owner?.address || '________________'}</span></div>
                                                    <div className="flex border-b border-slate-200 pb-0.5 gap-2">
                                                        <span className="flex-[1.5] flex"><span className="font-bold mr-1">Animal:</span> <span className="flex-1 truncate">{pet?.name || '________________'}</span></span>
                                                        <span className="flex-1 flex"><span className="font-bold mr-1">Espécie:</span> <span>{(pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : pet?.species) || '______'}</span></span>
                                                        <span className="flex-1 flex"><span className="font-bold mr-1">Raça:</span> <span className="truncate">{pet?.breed || '______'}</span></span>
                                                        <span className="flex-[0.8] flex"><span className="font-bold mr-1">Idade:</span> <span>{pet?.dateOfBirth ? `${new Date().getFullYear() - new Date(pet.dateOfBirth).getFullYear()} anos` : '___'}</span></span>
                                                    </div>
                                                    <div className="flex pt-0.5"><span className="font-bold mr-2">Sexo:</span> <span><span className="mr-1">[{isFemale ? 'X' : '  '}]</span> F</span> <span className="ml-4"><span className="mr-1">[{!isFemale ? 'X' : '  '}]</span> M</span></div>
                                                </div>
                                            </div>

                                            <div className="flex-1 border border-slate-400 p-2 mb-3 flex flex-col">
                                                <h2 className="text-[9px] font-bold mb-1 border-b border-slate-300 pb-1">PRESCRIÇÃO</h2>
                                                <div
                                                    className="flex-1 text-[11px] font-serif leading-relaxed mt-2 pt-1 prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-0.5"
                                                    dangerouslySetInnerHTML={{ __html: notes ? DOMPurify.sanitize(notes) : "O conteúdo da prescrição aparecerá aqui..." }}
                                                />
                                            </div>

                                            <div className="flex justify-between items-end mb-3 px-2">
                                                <span className="text-[10px] font-bold">Data: {format(new Date(prescriptionDate), 'dd/MM/yyyy')}</span>
                                                <div className="text-center w-48 border-t border-slate-400 pt-1">
                                                    <p className="text-[10px] font-bold">{veterinarian || '____________________'}</p>
                                                    <p className="text-[9px] text-slate-500">Médico Veterinário - CRMV: ________</p>
                                                </div>
                                            </div>

                                            <div className="flex border border-slate-400 mt-auto">
                                                <div className="w-1/2 p-2 border-r border-slate-400">
                                                    <h2 className="text-[8px] font-bold text-center mb-2">IDENTIFICAÇÃO DO COMPRADOR</h2>
                                                    <div className="space-y-1 text-[9px] leading-tight">
                                                        <div className="flex justify-between border-b border-slate-200"><span>Nome:</span></div>
                                                        <div className="flex justify-between border-b border-slate-200"><span>Identidade:</span> <span className="ml-2">Órgão Emissor:</span></div>
                                                        <div className="flex justify-between border-b border-slate-200"><span>Endereço:</span></div>
                                                        <div className="flex justify-between border-b border-slate-200"><span>Cidade:</span> <span className="ml-2">UF:</span></div>
                                                        <div className="flex justify-between border-b border-slate-200"><span>Telefone:</span></div>
                                                    </div>
                                                </div>
                                                <div className="w-1/2 p-2 flex flex-col justify-end text-center">
                                                    <h2 className="text-[8px] font-bold text-center mb-2">IDENTIFICAÇÃO DO FORNECEDOR</h2>
                                                    <div className="text-[9px] text-left mt-auto mb-4">Data: ___/___/______</div>
                                                    <div className="border-t border-slate-400 text-[9px] pt-1">Assinatura do Farmacêutico</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
