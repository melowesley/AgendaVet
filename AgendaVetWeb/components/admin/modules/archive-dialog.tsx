'use client'

import { useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Folder, User, PawPrint, Calendar, Phone, MapPin, History as HistoryIcon, Clock, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DOMPurify from 'dompurify'
import { useReactToPrint } from 'react-to-print'

interface ArchiveDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pet: any
    owner: any
    records: any[]
}

const medicalRecordTypeLabels: Record<string, string> = {
    vaccination: 'Vacinação',
    diagnosis: 'Diagnóstico',
    prescription: 'Receita',
    procedure: 'Procedimento',
    'lab-result': 'Exame',
    note: 'Observação',
}

export function ArchiveDialog({ open, onOpenChange, pet, owner, records }: ArchiveDialogProps) {
    const printRef = useRef<HTMLDivElement>(null)
    const handlePrint = useReactToPrint({ 
        contentRef: printRef, 
        documentTitle: `Arquivo_${pet?.name}_${format(new Date(), 'yyyyMMdd')}` 
    })

    if (!pet) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[1400px] h-[90vh] max-h-[90vh] rounded-2xl p-0 flex flex-col overflow-hidden border border-border/20 shadow-2xl">
                <DialogHeader className="p-4 md:p-6 border-b border-border/50 bg-white flex flex-row items-center justify-between shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-xl text-white shadow-lg" style={{background: 'linear-gradient(135deg, #13C8CC, #002653)'}}>
                            <Folder className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">Arquivo Médico Consolidado</DialogTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 font-medium">
                                <span className="flex items-center gap-1"><PawPrint className="size-3.5" /> <span className="font-bold text-slate-700">{pet.name}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1"><User className="size-3.5" /> {owner?.fullName || owner?.firstName}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-bold text-slate-500">
                            Fechar
                        </Button>
                        <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 h-10 px-8 shadow-xl shadow-emerald-200 font-bold" onClick={() => handlePrint()}>
                            <Printer className="size-4 mr-2" />
                            Imprimir Dossiê Completo
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-slate-100/80 overflow-hidden p-4 md:p-8">
                    {/* BOOK LAYOUT: Two A4 pages side by side */}
                    <div className="h-full max-w-[1600px] mx-auto flex gap-8 justify-center items-start overflow-hidden">
                        
                        {/* Page 1 (Column 1) */}
                        <div className="flex-1 h-full bg-white shadow-2xl rounded-sm border border-slate-300 p-10 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide page-container relative">
                            {/* Watermark/Logo Background */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                                <PawPrint className="size-[400px]" />
                            </div>

                            <div ref={printRef} className="flex-1 flex flex-col relative z-10 print-canvas w-full">
                                {/* Document Header */}
                                <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                                    <div className="space-y-1">
                                        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Histórico Clínico</h1>
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Dossiê de Evolução Biológica de Longo Prazo</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 justify-end mb-1">
                                            <PawPrint className="size-4 text-emerald-600" />
                                            <h2 className="text-xl font-black text-slate-800 leading-none">AgendaVet</h2>
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">Hub Médico Digital v5.0</p>
                                    </div>
                                </div>

                                {/* Bio Box */}
                                <div className="border border-slate-400 p-6 rounded-sm bg-slate-50/50 mb-10 shadow-inner">
                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b-2 border-slate-200 pb-1.5 flex items-center gap-2">
                                                <PawPrint className="size-3 text-emerald-500" /> IDENTIFICAÇÃO DO PACIENTE
                                            </h3>
                                            <div className="space-y-2 text-[11px]">
                                                <p><span className="font-bold text-slate-400 uppercase text-[9px] w-24 inline-block">NOME:</span> <span className="font-black text-slate-900 text-sm tracking-tight">{pet.name}</span></p>
                                                <p><span className="font-bold text-slate-400 uppercase text-[9px] w-24 inline-block">ESPÉCIE/RAÇA:</span> <span className="font-bold text-slate-700">{pet.species.toUpperCase()} | {pet.breed || 'SRD'}</span></p>
                                                <p><span className="font-bold text-slate-400 uppercase text-[9px] w-24 inline-block">ID REGISTRO:</span> <span className="font-mono text-slate-500 font-bold tracking-tighter uppercase">{pet.id?.split('-')[0]}</span></p>
                                            </div>
                                        </div>
                                        <div className="space-y-4 border-l-2 border-slate-200 pl-8">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b-2 border-slate-200 pb-1.5 flex items-center gap-2">
                                                <User className="size-3 text-emerald-500" /> DADOS DO RESPONSÁVEL
                                            </h3>
                                            <div className="space-y-2 text-[11px]">
                                                <p><span className="font-bold text-slate-400 uppercase text-[9px] w-20 inline-block">TUTOR:</span> <span className="font-bold text-slate-800">{owner?.fullName || `${owner?.firstName} ${owner?.lastName}`}</span></p>
                                                <p><span className="font-bold text-slate-400 uppercase text-[9px] w-20 inline-block">CONTATO:</span> <span className="font-bold text-slate-600">{owner?.phone || 'NÃO INFORMADO'}</span></p>
                                                <p className="text-[9px] text-slate-400 font-mono tracking-tighter italic break-all underline decoration-1">{owner?.email || owner?.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Chronology Section - Split logic here if records are many */}
                                <div className="space-y-12">
                                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600 text-center flex items-center gap-6">
                                        <div className="h-[2px] flex-1 bg-emerald-100" />
                                        LINHA DO TEMPO MÉDICA
                                        <div className="h-[2px] flex-1 bg-emerald-100" />
                                    </h2>

                                    {records.length === 0 ? (
                                        <div className="text-center py-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-sm italic text-slate-400 text-sm flex flex-col items-center gap-4">
                                            <Clock className="size-10 text-slate-200" />
                                            Aguardando inclusão de dados clínicos...
                                        </div>
                                    ) : (
                                        <div className="space-y-10">
                                            {/* We show half on first page or all scrollable */}
                                            {records.map((record) => (
                                                <div key={record.id} className="relative page-break-inside-avoid group">
                                                    <div className="flex items-center gap-6 mb-4">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[12px] font-black font-mono text-white bg-slate-900 px-4 py-1.5 rounded-[3px] shadow-md transform -rotate-1 group-hover:rotate-0 transition-transform">
                                                                {format(new Date(record.date || record.createdAt), "dd/MM/yyyy")}
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] uppercase font-black text-emerald-600 tracking-widest bg-emerald-50 px-3 py-1.5 rounded border border-emerald-100 shadow-sm">
                                                            {medicalRecordTypeLabels[record.type] || record.type}
                                                        </span>
                                                    </div>
                                                    <div className="border-2 border-slate-200 rounded-sm p-6 bg-white border-l-[6px] border-l-slate-900 shadow-sm group-hover:shadow-md transition-shadow">
                                                        <h4 className="font-black text-slate-900 text-base mb-4 flex justify-between items-center border-b-2 border-slate-50 pb-3">
                                                            {record.title}
                                                            <HistoryIcon className="size-4 opacity-20" />
                                                        </h4>
                                                        <div
                                                            className="text-[12px] text-slate-700 leading-relaxed font-medium prose prose-sm max-w-none prose-p:my-2 break-words whitespace-pre-wrap"
                                                            dangerouslySetInnerHTML={{ __html: record.description ? DOMPurify.sanitize(record.description) : "" }}
                                                        />
                                                        {record.veterinarian && (
                                                            <div className="mt-8 pt-5 border-t-2 border-slate-50 flex justify-between items-center text-[11px] font-black text-slate-400 italic">
                                                                <span className="uppercase tracking-widest text-[9px]">Autenticação Digital:</span>
                                                                <span className="text-slate-900 uppercase font-bold not-italic font-mono border-b border-slate-900">Dr(a). {record.veterinarian}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Document Footer */}
                                <div className="mt-20 pt-10 border-t-4 border-slate-900 flex justify-between items-end shrink-0">
                                    <div className="space-y-1.5 max-w-[400px]">
                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Validação Documental AgendaVet Digital Archive</p>
                                        <p className="text-[9px] text-slate-400 leading-tight uppercase font-bold italic opacity-70">
                                            Este documento é uma representação digital auditada do histórico clínico do paciente. 
                                            Registros protegidos por criptografia de ponta-a-ponta em nuvem soberana.
                                        </p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[11px] font-black text-slate-900 font-mono">CERTIFICAÇÃO: {format(new Date(), 'dd.MM.yyyy · HH:mm')}</p>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter bg-slate-50 px-2 py-0.5 border border-slate-100">CÓD. RASTREAMENTO: AGV-ARC-{pet.id?.split('-')[0].toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Page 2 (Column 2) - Detailed View or Continuation of Records */}
                        <div className="hidden lg:flex flex-1 h-full bg-white shadow-2xl rounded-sm border border-slate-300 p-10 flex-col overflow-y-auto scrollbar-hide relative border-l-8 border-l-slate-200">
                             <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none transform scale-150 rotate-45">
                                <HistoryIcon className="size-[500px]" />
                            </div>

                            <div className="flex-1 flex flex-col relative z-10 w-full">
                                <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end opacity-40 grayscale">
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Anexo Detalhado</h2>
                                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase italic">Controle Auxiliar de Fluxo Clínico</p>
                                </div>

                                <div className="flex-1">
                                    <div className="grid grid-cols-2 gap-4 mb-10">
                                        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded flex flex-col items-center justify-center gap-2">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total de Registros</span>
                                            <span className="text-3xl font-black text-emerald-700">{records.length}</span>
                                        </div>
                                        <div className="p-4 bg-slate-50/50 border border-slate-100 rounded flex flex-col items-center justify-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Último Acesso</span>
                                            <span className="text-sm font-black text-slate-800 uppercase">{format(new Date(), "MMM yyyy", { locale: ptBR })}</span>
                                        </div>
                                    </div>

                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-l-4 border-slate-300 pl-4 mb-8">
                                        Distribuição por Categoria
                                    </h3>
                                    
                                    <div className="space-y-3 mb-12">
                                        {['Prescription', 'Diagnosis', 'Procedure', 'Vaccination'].map(type => {
                                            const count = records.filter(r => r.type.toLowerCase().includes(type.toLowerCase())).length;
                                            const pct = records.length > 0 ? (count / records.length) * 100 : 0;
                                            return (
                                                <div key={type} className="space-y-1.5">
                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                                                        <span>{type}</span>
                                                        <span>{count}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div className="mt-auto border-2 border-slate-900 p-8 rounded-sm bg-slate-900 text-white shadow-2xl overflow-hidden relative">
                                         {/* Abstract Design Elements */}
                                        <div className="absolute top-0 right-0 h-full w-24 bg-emerald-500/20 skew-x-12 transform translate-x-12" />
                                        
                                        <h4 className="text-lg font-black uppercase mb-4 tracking-tighter">Observação do Auditor</h4>
                                        <p className="text-[11px] leading-relaxed font-medium opacity-80 mb-6 italic">
                                            "Este dossiê agrega todas as intervenções terapêuticas e preventivas realizadas desde o primeiro contato registrado no sistema. 
                                            Recomenda-se a revisão semestral deste arquivo para ajuste de condutas clínicas baseadas no histórico pregressivo."
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded bg-white/10 flex items-center justify-center border border-white/20">
                                                <Activity className="size-6 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase">Stat Health Analysis</p>
                                                <p className="text-[9px] opacity-60 font-mono italic">Validated by AgendaVet Core AI</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-20 pt-10 border-t-2 border-slate-100 flex justify-between items-center opacity-30 grayscale shrink-0">
                                    <p className="text-[11px] font-black text-slate-400 uppercase">Auxiliary Summary Page</p>
                                    <p className="text-[9px] text-slate-300 font-mono">PÁGINA 2 DE 2</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
