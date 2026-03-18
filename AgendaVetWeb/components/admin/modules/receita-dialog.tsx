'use client'

import { useState, useEffect, useRef } from 'react'
import { mutate } from 'swr'
import { supabase, usePet, useOwner, useMedicalRecords } from '@/lib/data-store'
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
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[200px] w-full animate-pulse bg-muted rounded-md" /> })
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Pill, Save, Trash2, ArrowLeft, FileDown, ScrollText, ShieldAlert, ChevronRight, Printer, PawPrint, Stethoscope, History as HistoryIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { useReactToPrint } from 'react-to-print'

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
    const { records: allRecords } = useMedicalRecords(petId)

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
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Receituario_${receiptType}_${petName}`,
        pageStyle: `
          @page { size: auto; margin: 10mm; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        `
    })

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
            <DialogContent className="w-[95vw] max-w-[1400px] h-[90vh] max-h-[90vh] rounded-2xl p-0 flex flex-col overflow-hidden border border-border/20 shadow-2xl">
                <DialogHeader className="p-4 md:p-6 border-b border-border/50 bg-white flex flex-row items-center justify-between shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        {(receiptType || onBack) && (
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100" onClick={receiptType ? () => setReceiptType(null) : onBack}>
                                <ArrowLeft className="size-5" />
                            </Button>
                        )}
                        <div className="flex size-12 items-center justify-center rounded-xl text-white shadow-inner" style={{background: 'linear-gradient(135deg, #13C8CC, #002653)'}}>
                            <Pill className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">
                                {receiptType === 'simples' ? 'Receituário Simples' : receiptType === 'controlado' ? 'Receituário Controlado' : 'Receitas Médicas'}
                            </DialogTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 font-medium">
                                <span className="flex items-center gap-1"><PawPrint className="size-3.5" /> <span className="font-bold text-slate-700">{petName}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1"><ScrollText className="size-3.5" /> Gestão de Prescrições</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-bold text-slate-500">
                            Fechar
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    {receiptType === null && !editingId ? (
                        <div className="p-8 md:p-12 space-y-12 overflow-y-auto h-full max-w-[1200px] mx-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <button
                                    onClick={() => setReceiptType('simples')}
                                    className={`group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-border/40 ${themeColor.borderHover} transition-all duration-200 text-center ${themeColor.bgGhostHover} hover:shadow-lg hover:-translate-y-0.5`}
                                >
                                    <div className={`size-14 rounded-xl ${themeColor.bgGhost} flex items-center justify-center transition-all group-hover:scale-105`}>
                                        <ScrollText className={`size-7 ${themeColor.text}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-base tracking-tight">Receituário Simples</p>
                                        <p className="text-sm text-muted-foreground">Prescrição comum de medicamentos e orientações gerais</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setReceiptType('controlado')}
                                    className={`group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-border/40 ${themeColor.borderHover} transition-all duration-200 text-center ${themeColor.bgGhostHover} hover:shadow-lg hover:-translate-y-0.5`}
                                >
                                    <div className={`size-14 rounded-xl ${themeColor.bgGhost} flex items-center justify-center transition-all group-hover:scale-105`}>
                                        <ShieldAlert className={`size-7 ${themeColor.text}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-base tracking-tight">Receituário Controlado</p>
                                        <p className="text-sm text-muted-foreground">Medicamentos de controle especial (Lista A, B ou C)</p>
                                    </div>
                                </button>
                            </div>

                            <div className="space-y-6 pt-10 border-t border-slate-100">
                                <h3 className="text-sm font-black uppercase tracking-[0.25em] text-slate-400 border-l-4 border-emerald-500 pl-4 mb-8">
                                    Histórico de Receitas Anteriores
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                        <div className="flex-1 flex overflow-hidden bg-slate-100/50">
                            {/* NEW: Left Sidebar with Patient History - Styled more like a column */}
                            <div className="hidden xl:block w-[280px] bg-slate-50/80 border-r border-border/30 p-4 overflow-y-auto shrink-0 shadow-inner">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-l-4 border-emerald-500 pl-3 mb-6">
                                    Histórico de Consultas
                                </h3>
                                
                                {allRecords.length === 0 ? (
                                    <div className="text-center py-20 flex flex-col items-center gap-4 opacity-50">
                                        <Clock className="size-10 text-slate-300" />
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Sem registros prévios</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {allRecords.map(record => (
                                            <div key={record.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-500 transition-all hover:shadow-md group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[9px] font-black text-white bg-slate-900 px-1.5 py-0.5 rounded-[3px]">
                                                        {format(new Date(record.date || record.createdAt), "dd/MM/yyyy")}
                                                    </span>
                                                    <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                        {record.type}
                                                    </span>
                                                </div>
                                                <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-snug">{record.title}</h4>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="w-full xl:w-[480px] p-6 bg-white border-r border-border/30 overflow-y-auto shrink-0 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.1)] z-10 relative">
                                <div className="space-y-8">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-l-4 border-slate-900 pl-4">
                                        Nova Prescrição
                                    </h3>
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
                                    <div className="flex gap-3 pt-6">
                                        <Button onClick={handleSave} disabled={loading} className="flex-1 h-10 font-semibold text-white shadow-sm rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700">
                                            <Save className="size-4 mr-2" />
                                            {loading ? 'Salvando...' : 'Salvar e Registrar'}
                                        </Button>

                                        <Button variant="outline" className="h-10 px-4 rounded-lg" title="Imprimir" onClick={() => handlePrint()}>
                                            <Printer className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* PREVIEW PANE */}
                            <div className={`hidden md:flex flex-1 bg-slate-200/50 p-6 lg:p-12 overflow-y-auto justify-center items-start`}>
                                <div
                                    ref={printRef}
<<<<<<< HEAD
                                    className={`w-full max-w-[595px] aspect-[1/1.414] bg-white shadow-[0_15px_40px_-15px_rgba(0,0,0,0.15)] rounded-md border p-8 flex flex-col text-slate-900 m-auto`}
                                >                                
=======
                                    className={`w-full max-w-[650px] min-h-[920px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm border p-12 flex flex-col text-slate-900 ${themeColor.borderLight} border-t-8 ${themeColor.border}`}
                                >
>>>>>>> f7ad3363f5708e76ac575285b4ab3c4ea9c4105c
                                    {/* SIMPLES LAYOUT */}
                                    {receiptType === 'simples' && (
                                        <>
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
<<<<<<< HEAD
                                                  <div className="text-2xl font-black tracking-tight" style={{background: 'linear-gradient(to right, #13C8CC, #002653)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                                                    AgendaVet
                                                  </div>
                                                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Gestão Veterinária Inteligente</p>
=======
                                                    <h2 className={`text-xl font-black uppercase tracking-widest ${themeColor.text}`}>Receituário Simples</h2>
                                                    <p className="text-[10px] opacity-60 mt-1 uppercase text-slate-500">Prescrição e Orientação Veterinária</p>
                                                </div>
                                                <div className={`text-right ${themeColor.text}`}>
                                                    <Stethoscope className="size-8 ml-auto mb-1 opacity-20" />
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">AgendaVet</p>
>>>>>>> f7ad3363f5708e76ac575285b4ab3c4ea9c4105c
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-lg font-black text-slate-800 uppercase tracking-tight">Receituário Simples</p>
                                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Prescrição e Orientação Veterinária</p>
                                                <p className="text-[9px] text-slate-400 mt-2">Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
                                              </div>
                                            </div>

                                            <div className="border border-slate-400 p-6 mb-8 rounded-sm bg-slate-50/50">
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-1.5">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">PACIENTE</p>
                                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{petName}</p>
                                                        <div className="space-y-0.5 border-t border-slate-200 pt-2 text-[10px] text-slate-600 font-medium mt-2">
                                                            <p><span className="font-bold text-slate-400 uppercase text-[9px]">Espécie:</span> {pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : pet?.species}</p>
                                                            <p><span className="font-bold text-slate-400 uppercase text-[9px]">Raça:</span> {pet?.breed}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5 border-l border-slate-200 pl-8 text-right">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">TUTOR</p>
                                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{owner?.fullName || 'S/R'}</p>
                                                        <p className="text-[10px] mt-2 border-t border-slate-200 pt-2 text-slate-600 font-medium">Data: {format(new Date(prescriptionDate), 'dd/MM/yyyy')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-6">
                                                <section className="border border-slate-300 p-6 rounded-sm bg-white relative overflow-hidden">
                                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${themeColor.bg}`}></div>
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Prescrição e Instruções</h3>
                                                    <div
                                                        className="text-[13px] text-slate-800 leading-relaxed prose prose-sm max-w-none prose-p:my-2 break-words whitespace-pre-wrap"
                                                        dangerouslySetInnerHTML={{ __html: notes ? DOMPurify.sanitize(notes) : "<p class='italic opacity-30'>Aguardando preenchimento da prescrição...</p>" }}
                                                    />
                                                </section>
                                            </div>

<<<<<<< HEAD
                                            <div className="mt-auto pt-8 border-t border-slate-100">
                                              <div className="flex justify-between items-end">
                                                <div className="text-[9px] text-slate-400 leading-tight max-w-[220px]">
                                                  <p className="font-semibold" style={{background: 'linear-gradient(to right, #13C8CC, #002653)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>AgendaVet © 2026</p>
                                                  <p className="opacity-70 mt-0.5">Gestão Veterinária Profissional. As informações são de responsabilidade do médico veterinário.</p>
=======
                                            <div className="mt-auto pt-10 flex justify-between items-end border-t border-slate-100">
                                                <div className="text-[9px] opacity-40 italic max-w-[220px] leading-tight font-medium text-slate-500 uppercase">
                                                    Documento autêntico AgendaVet. Validade conforme normas sanitárias vigentes.
                                                </div>
                                                <div className="text-center w-56">
                                                    <div className="h-[2px] w-full bg-slate-300 mb-3"></div>
                                                    <p className="text-[12px] font-black uppercase text-slate-900 tracking-tight">{veterinarian || 'Médico Veterinário'}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Médico Veterinário • CRMV</p>
>>>>>>> f7ad3363f5708e76ac575285b4ab3c4ea9c4105c
                                                </div>
                                                <div className="text-center w-56">
                                                  <div className="h-[2px] w-full mb-3 rounded" style={{background: 'linear-gradient(to right, #13C8CC, #002653)'}}></div>
                                                  <p className="text-[13px] font-black uppercase text-slate-900 tracking-tight">{veterinarian || 'Dr. Responsável'}</p>
                                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Médico Veterinário • CRMV</p>
                                                </div>
                                              </div>
                                            </div>
                                        </>
                                    )}

                                    {/* CONTROLADO LAYOUT */}
                                    {receiptType === 'controlado' && (
                                        <div className={`flex flex-col h-full bg-white`}>
                                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-300">
                                              <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded flex items-center justify-center" style={{background: 'linear-gradient(135deg, #13C8CC, #002653)'}}>
                                                  <svg width="14" height="14" viewBox="0 0 28 28" fill="none"><path d="M14 4C9 4 5 8 5 13c0 3 1.5 5.5 3.8 7L14 24l5.2-4C21.5 18.5 23 16 23 13c0-5-4-9-9-9z" fill="white" opacity="0.9"/></svg>
                                                </div>
                                                <span className="text-[10px] font-black" style={{background: 'linear-gradient(to right, #13C8CC, #002653)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>AgendaVet</span>
                                              </div>
                                              <span className="text-[9px] text-slate-400">{format(new Date(prescriptionDate), 'dd/MM/yyyy')}</span>
                                            </div>
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
                                                    className="flex-1 text-[11px] font-serif leading-relaxed mt-2 pt-1 prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-0.5 break-words break-all whitespace-pre-wrap"
                                                    dangerouslySetInnerHTML={{ __html: notes ? DOMPurify.sanitize(notes) : "O conteúdo da prescrição aparecerá aqui..." }}
                                                />
                                            </div>

                                            <div className="flex justify-between items-end mb-3 px-2">
                                                <span className="text-[10px] font-bold">Data: {format(new Date(prescriptionDate), 'dd/MM/yyyy')}</span>
                                                <div className="text-center w-48">
                                                    <div className="h-[2px] w-full bg-slate-300 mb-2"></div>
                                                    <p className="text-[12px] font-black uppercase text-slate-900 tracking-tight">{veterinarian || 'Médico Veterinário'}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Médico Veterinário • CRMV</p>
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
