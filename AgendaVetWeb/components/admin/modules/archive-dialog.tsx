'use client'

import { useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Folder, User, PawPrint, Calendar, Phone, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DOMPurify from 'dompurify'
import ReactToPrint from 'react-to-print'

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

    if (!pet) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-b border-border/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                            <Folder className="size-5" />
                        </div>
                        <div>
                            <DialogTitle>Arquivo de Paciente - {pet.name}</DialogTitle>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">ID: {pet.id} | Tutor: {owner?.fullName || owner?.firstName}</p>
                        </div>
                    </div>
                    {/* @ts-ignore */}
                    <ReactToPrint
                        trigger={() => (
                            <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 h-9">
                                <Printer className="size-4 mr-2" />
                                Imprimir Ficha
                            </Button>
                        )}
                        content={() => printRef.current}
                        documentTitle={`Arquivo_${pet.name}_${format(new Date(), 'yyyyMMdd')}`}
                    />
                </DialogHeader>

                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8">
                    <div
                        ref={printRef}
                        className="bg-white shadow-sm border rounded-lg p-8 md:p-12 max-w-4xl mx-auto min-h-screen text-slate-800 font-sans"
                    >
                        {/* Print Header */}
                        <div className="flex justify-between items-start border-b-2 border-emerald-500 pb-6 mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-emerald-700 tracking-tight mb-1">AgendaVet</h1>
                                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Prontuário e Arquivo Médico</p>
                            </div>
                            <div className="text-right text-[10px] font-mono text-slate-400">
                                <p>DATA DE EMISSÃO</p>
                                <p className="text-slate-600 font-bold">{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                            </div>
                        </div>

                        {/* Identification Grid */}
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            {/* Pet Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2 border-b border-emerald-100 pb-1">
                                    <PawPrint className="size-3" /> Paciente
                                </h3>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    <div className="flex justify-between border-b border-slate-50 pb-1">
                                        <span className="font-bold text-slate-500 uppercase text-[9px]">Nome:</span>
                                        <span className="font-black text-slate-800">{pet.name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-1">
                                        <span className="font-bold text-slate-500 uppercase text-[9px]">Espécie:</span>
                                        <span>{pet.species}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-1">
                                        <span className="font-bold text-slate-500 uppercase text-[9px]">Raça:</span>
                                        <span>{pet.breed || 'SRD'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-1">
                                        <span className="font-bold text-slate-500 uppercase text-[9px]">Sexo:</span>
                                        <span>{pet.gender || 'N/I'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-slate-500 uppercase text-[9px]">Peso:</span>
                                        <span className="font-bold">{pet.weight} kg</span>
                                    </div>
                                </div>
                            </div>

                            {/* Owner Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2 border-b border-emerald-100 pb-1">
                                    <User className="size-3" /> Responsável (Tutor)
                                </h3>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    <div className="flex justify-between border-b border-slate-50 pb-1">
                                        <span className="font-bold text-slate-500 uppercase text-[9px]">Nome:</span>
                                        <span className="font-bold text-slate-800">{owner?.fullName || `${owner?.firstName} ${owner?.lastName}`}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-1">
                                        <span className="font-bold text-slate-500 uppercase text-[9px]">Telefone:</span>
                                        <span>{owner?.phone || 'N/I'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-1">
                                        <span className="font-bold text-slate-500 uppercase text-[9px]">E-mail:</span>
                                        <span className="text-xs">{owner?.email || 'N/I'}</span>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <span className="font-bold text-slate-500 uppercase text-[9px] mt-1 shrink-0">Endereço:</span>
                                        <span className="text-right text-xs leading-tight">{owner?.address || 'N/I'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documents Section */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 border-l-4 border-emerald-500 pl-4 mb-8">
                                Histórico de Procedimentos e Atendimento
                            </h2>

                            {records.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 rounded-lg border-2 border-dashed border-slate-100 italic text-slate-400">
                                    Nenhum registro encontrado para emissão de arquivo.
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {records.map((record, index) => (
                                        <div key={record.id} className="relative page-break-inside-avoid">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="h-[2px] w-8 bg-emerald-500/20" />
                                                <span className="text-[10px] font-black font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                                    {format(new Date(record.date || record.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                                </span>
                                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                                    {medicalRecordTypeLabels[record.type] || record.type}
                                                </span>
                                            </div>
                                            <div className="border border-slate-100 rounded-lg p-5 bg-slate-50/20">
                                                <h4 className="font-bold text-slate-900 mb-2">{record.title}</h4>
                                                <div
                                                    className="text-sm text-slate-600 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-strong:text-slate-900"
                                                    dangerouslySetInnerHTML={{ __html: record.description ? DOMPurify.sanitize(record.description) : "" }}
                                                />
                                                {record.veterinarian && (
                                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
                                                        <span className="text-slate-400">PROFISSIONAL RESPONSÁVEL:</span>
                                                        <span className="font-bold text-slate-700 uppercase">{record.veterinarian}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col items-center text-center">
                            <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 grayscale">
                                <PawPrint className="size-8 text-slate-300" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AgendaVet Hospital Veterinário</p>
                            <p className="text-[8px] text-slate-300">ESTE DOCUMENTO É PARTE INTEGRANTE DO PRONTUÁRIO MÉDICO DO PACIENTE E TEM VALIDADE LEGAL.</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
