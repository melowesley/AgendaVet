'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/data-store'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })

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
import { toast } from 'sonner'
import {
    Activity, Save, ArrowLeft, Printer, History, PawPrint,
    Stethoscope, FileText, StickyNote, Calendar, PlusCircle, Link as LinkIcon
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useReactToPrint } from 'react-to-print'
import { usePet, useOwner, useMedicalRecords } from '@/lib/data-store'

interface RegistroLivreDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
    recordType: string
}

const TYPE_CONFIG: Record<string, {
    label: string
    icon: React.ComponentType<{ className?: string }>
    color: { bg: string, bgHover: string, bgGhost: string, text: string, border: string, borderLight: string }
    dbType: string
    accentBorder: string
    reportLabel: string
}> = {
    procedimento: {
        label: 'Procedimento Clínico',
        icon: Activity,
        color: { bg: 'bg-orange-600', bgHover: 'hover:bg-orange-700', bgGhost: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500', borderLight: 'border-orange-200' },
        dbType: 'procedimento',
        accentBorder: 'border-orange-500',
        reportLabel: 'Relatório de Procedimento',
    },
    diagnostico: {
        label: 'Diagnóstico',
        icon: Stethoscope,
        color: { bg: 'bg-yellow-600', bgHover: 'hover:bg-yellow-700', bgGhost: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500', borderLight: 'border-yellow-200' },
        dbType: 'diagnostico',
        accentBorder: 'border-yellow-500',
        reportLabel: 'Laudo de Diagnóstico',
    },
    documento: {
        label: 'Documento',
        icon: FileText,
        color: { bg: 'bg-slate-600', bgHover: 'hover:bg-slate-700', bgGhost: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-500', borderLight: 'border-slate-200' },
        dbType: 'documento',
        accentBorder: 'border-slate-500',
        reportLabel: 'Documento Clínico',
    },
    observacoes: {
        label: 'Observações',
        icon: StickyNote,
        color: { bg: 'bg-lime-600', bgHover: 'hover:bg-lime-700', bgGhost: 'bg-lime-500/10', text: 'text-lime-600', border: 'border-lime-500', borderLight: 'border-lime-200' },
        dbType: 'observacoes',
        accentBorder: 'border-lime-500',
        reportLabel: 'Registro de Observações',
    },
    retorno: {
        label: 'Retorno / Follow-up',
        icon: Calendar,
        color: { bg: 'bg-teal-600', bgHover: 'hover:bg-teal-700', bgGhost: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-500', borderLight: 'border-teal-200' },
        dbType: 'retorno',
        accentBorder: 'border-teal-500',
        reportLabel: 'Relatório de Retorno',
    },
    outros: {
        label: 'Outros',
        icon: PlusCircle,
        color: { bg: 'bg-gray-600', bgHover: 'hover:bg-gray-700', bgGhost: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500', borderLight: 'border-gray-200' },
        dbType: 'outros',
        accentBorder: 'border-gray-500',
        reportLabel: 'Registro Clínico',
    },
}

export function RegistroLivreDialog({ open, onOpenChange, onBack, petId, petName, recordType }: RegistroLivreDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')
    const { records: allRecords } = useMedicalRecords(petId)

    const config = TYPE_CONFIG[recordType] || TYPE_CONFIG['outros']
    const { color, label, reportLabel, dbType, accentBorder } = config
    const Icon = config.icon

    const [loading, setLoading] = useState(false)
    const [titulo, setTitulo] = useState('')
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [veterinarian, setVeterinarian] = useState('')
    const [conteudo, setConteudo] = useState('')
    const [fileUrl, setFileUrl] = useState('')

    const printRef = useRef<HTMLDivElement>(null)
    const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `${label}_${petName}_${format(new Date(), 'dd_MM_yyyy')}` })

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ]
    }

    const resetForm = () => {
        setTitulo('')
        setDate(format(new Date(), 'yyyy-MM-dd'))
        setVeterinarian('')
        setConteudo('')
        setFileUrl('')
    }

    const handleSave = async () => {
        if (!titulo.trim()) {
            toast.error('Preencha o título do registro')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const { error } = await (supabase.from('medical_records' as any).insert([{
                pet_id: petId,
                user_id: userData.user?.id,
                type: dbType,
                title: titulo,
                description: JSON.stringify({ conteudo, fileUrl }),
                date: new Date(date + 'T12:00:00').toISOString(),
                veterinarian: veterinarian || '',
            }] as any) as any)

            if (error) throw error

            mutate('medical-records')
            toast.success(`${label} salvo com sucesso!`)
            resetForm()
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar registro')
        } finally {
            setLoading(false)
        }
    }

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
                        <div className={`flex size-12 items-center justify-center rounded-xl ${color.bgGhost} ${color.text} shadow-inner`}>
                            <Icon className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">
                                {label}
                            </DialogTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 font-medium">
                                <span className="flex items-center gap-1"><PawPrint className="size-3.5" /> <span className="font-bold text-slate-700">{petName}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className={`flex items-center gap-1 font-bold ${color.text} uppercase tracking-tighter text-[11px] ${color.bgGhost} px-2 py-0.5 rounded border ${color.borderLight}`}>
                                    Registro Clínico
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-bold text-slate-500">
                            Fechar
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className={`h-10 px-6 font-black ${color.bg} ${color.bgHover} text-white shadow-lg`}>
                            <Save className="size-4 mr-2" />
                            {loading ? 'Salvando...' : 'Salvar Registro'}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex bg-slate-100/50">
                    {/* Left Sidebar - History */}
                    <div className="hidden xl:block w-[320px] bg-slate-50/80 border-r border-border/30 p-6 overflow-y-auto shrink-0 shadow-inner">
                        <h3 className={`text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-l-4 ${accentBorder} pl-4 mb-6`}>
                            Histórico do Paciente
                        </h3>
                        {allRecords.length === 0 ? (
                            <div className="text-center py-16 flex flex-col items-center gap-4 opacity-50">
                                <History className="size-10 text-slate-300" />
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Sem registros prévios</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allRecords.map(record => (
                                    <div key={record.id} className={`p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:${color.border} transition-all hover:shadow-md group`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-[3px]">
                                                {format(new Date(record.date || record.createdAt), "dd/MM/yyyy")}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase ${color.text} ${color.bgGhost} px-1.5 py-0.5 rounded border ${color.borderLight}`}>
                                                {record.type}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-snug">{record.title}</h4>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Side */}
                    <div className="w-full xl:w-[460px] p-8 bg-white border-r border-border/30 overflow-y-auto shrink-0 shadow-lg z-10 relative">
                        <div className="space-y-8">
                            <div className="border-l-4 border-slate-900 pl-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 leading-none py-1">
                                    Novo Registro — {label}
                                </h3>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título *</Label>
                                    <Input
                                        placeholder={`Ex: ${recordType === 'diagnostico' ? 'Diagnóstico de dermatite' : recordType === 'retorno' ? 'Retorno 30 dias pós-cirurgia' : recordType === 'procedimento' ? 'Curativo de pata' : 'Título do registro'}`}
                                        value={titulo}
                                        onChange={(e) => setTitulo(e.target.value)}
                                        className="h-12 border-slate-200 rounded-xl font-black text-slate-800 placeholder:font-normal placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data *</Label>
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="h-12 border-slate-200 rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Responsável</Label>
                                        <Input
                                            value={veterinarian}
                                            onChange={(e) => setVeterinarian(e.target.value)}
                                            placeholder="Dr. Nome"
                                            className="h-12 border-slate-200 rounded-xl font-bold font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {recordType === 'documento' ? 'Descrição / Observações' : 'Conteúdo / Descrição'}
                                    </Label>
                                    <div className={`bg-white text-black rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-${color.border}/20`}>
                                        <ReactQuill
                                            theme="snow"
                                            value={conteudo}
                                            onChange={setConteudo}
                                            modules={modules}
                                            className="min-h-[180px]"
                                            placeholder={
                                                recordType === 'diagnostico' ? 'Descreva o diagnóstico, hipóteses diagnósticas, achados...' :
                                                recordType === 'procedimento' ? 'Descreva o procedimento realizado, materiais utilizados, resultados...' :
                                                recordType === 'retorno' ? 'Evolução clínica, conduta atual, próximos passos...' :
                                                recordType === 'documento' ? 'Anotações sobre o documento, referências...' :
                                                'Descreva detalhadamente...'
                                            }
                                        />
                                    </div>
                                </div>

                                {(recordType === 'documento' || recordType === 'exame') && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <LinkIcon className="size-3 inline mr-1" /> URL do Arquivo (Google Drive, iCloud...)
                                        </Label>
                                        <Input
                                            value={fileUrl}
                                            onChange={(e) => setFileUrl(e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                            className="h-12 border-slate-200 rounded-xl font-medium text-slate-700"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <Button onClick={handleSave} disabled={loading} className={`flex-1 h-14 text-base font-black ${color.bg} ${color.bgHover} text-white shadow-xl rounded-2xl transition-all hover:scale-[1.02] active:scale-95`}>
                                        <Save className="size-5 mr-2" />
                                        {loading ? 'Salvando...' : 'Salvar Registro'}
                                    </Button>
                                    <Button variant="outline" className="h-14 px-6 border-2 font-bold hover:bg-slate-50 rounded-2xl" onClick={() => handlePrint()}>
                                        <Printer className="size-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview A4 */}
                    <div className="hidden md:flex flex-1 bg-slate-200/50 p-6 lg:p-12 overflow-y-auto justify-center items-start">
                        <div
                            ref={printRef}
                            className={`w-full max-w-[650px] min-h-[920px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm border p-12 flex flex-col text-slate-900 ${color.borderLight} border-t-8 ${color.border}`}
                        >
                            <div className={`border-b-2 pb-6 mb-8 flex justify-between items-end ${color.border}`}>
                                <div>
                                    <h2 className={`text-2xl font-black uppercase tracking-tight ${color.text}`}>{reportLabel}</h2>
                                    <p className="text-[10px] opacity-70 mt-1 uppercase font-bold text-slate-500">Registro Clínico Veterinário</p>
                                </div>
                                <div className={`text-right ${color.text}`}>
                                    <Icon className="size-10 ml-auto mb-1 opacity-20" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AgendaVet</p>
                                </div>
                            </div>

                            <div className="border border-slate-300 p-6 mb-8 rounded-sm bg-slate-50/50 shadow-inner">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">DADOS DO PACIENTE</p>
                                        <div className="space-y-0.5 border-t border-slate-200 pt-3 text-[11px] font-medium text-slate-900 uppercase">
                                            <p className="text-sm font-black text-slate-800 mb-1 leading-none">{petName}</p>
                                            <p className="text-slate-600 truncate">{pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'} | {pet?.breed}</p>
                                            <p className="text-slate-500">Peso: <span className="font-bold text-slate-800">{pet?.weight || '-'} kg</span></p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 border-l border-slate-200 pl-8 text-right font-medium">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">TUTOR / DATA</p>
                                        <div className="space-y-0.5 border-t border-slate-200 pt-3 text-[11px]">
                                            <p className="font-black text-slate-800 text-sm uppercase mb-1">{owner?.fullName || 'S/R'}</p>
                                            <p className={`font-black uppercase text-[10px] mt-2 inline-block px-2 py-0.5 rounded ${color.bgGhost} ${color.text}`}>
                                                {date ? format(parseISO(date), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-8 text-slate-800 pb-10">
                                <section className={`p-6 rounded-sm bg-white border border-slate-300 relative overflow-hidden shadow-sm`}>
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${color.bg}`}></div>
                                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-2 ${color.text}`}>{label}</h3>
                                    <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter underline decoration-4 decoration-slate-100 underline-offset-8">
                                        {titulo || 'Em preenchimento...'}
                                    </p>
                                </section>

                                <section>
                                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 ${color.text} border-b border-slate-100 pb-2`}>
                                        Conteúdo / Observações
                                    </h3>
                                    <div
                                        className="text-[13px] leading-relaxed prose prose-slate max-w-none text-slate-700 font-medium break-words bg-slate-50/30 p-4 border border-slate-100 rounded-sm italic"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(conteudo || 'Aguardando descrição...') }}
                                    />
                                </section>

                                {fileUrl && (
                                    <section className="bg-slate-50 p-4 rounded-sm border border-slate-200">
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${color.text}`}>Arquivo Anexado</h3>
                                        <p className="text-[11px] text-blue-600 font-medium break-all">{fileUrl}</p>
                                    </section>
                                )}
                            </div>

                            <div className="mt-auto pt-12 flex justify-between items-end border-t border-slate-100 italic">
                                <div className="text-[9px] opacity-40 leading-tight max-w-[200px] font-black text-slate-500 uppercase">
                                    {label.toUpperCase()} • AGENDAVET • {format(new Date(), 'dd/MM/yyyy HH:mm')}
                                </div>
                                <div className="text-center w-64">
                                    <div className={`h-[2px] w-full ${color.bg} opacity-20 mb-3`}></div>
                                    <p className="text-[14px] font-black uppercase text-slate-900 tracking-tighter">{veterinarian || '____________________'}</p>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Médico Veterinário / CRMV-XX</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
