'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Stethoscope,
    Syringe,
    Pill,
    Activity,
    FlaskConical,
    StickyNote,
    HeartPulse,
    Scale,
    Calendar,
    FileText,
    Camera,
    Video,
    Skull,
    History,
    ClipboardList,
    Scissors,
    PlusCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttendanceTypeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (type: string) => void
}

const attendanceTypes = [
    { id: 'consulta', label: 'Consulta', icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'vacina', label: 'Vacina', icon: Syringe, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'procedimento', label: 'Procedimento', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'exame', label: 'Exame', icon: FlaskConical, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'receita', label: 'Receita', icon: Pill, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { id: 'peso', label: 'Peso', icon: Scale, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { id: 'cirurgia', label: 'Cirurgia', icon: HeartPulse, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'internacao', label: 'Internação', icon: ClipboardList, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'diagnostico', label: 'Diagnóstico', icon: Stethoscope, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
    { id: 'documento', label: 'Documento', icon: FileText, color: 'text-slate-500', bg: 'bg-slate-500/10' },
    { id: 'fotos', label: 'Fotos', icon: Camera, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'video', label: 'Vídeo', icon: Video, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { id: 'banho-tosa', label: 'Banho e Tosa', icon: Scissors, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { id: 'obito', label: 'Óbito', icon: Skull, color: 'text-zinc-700', bg: 'bg-zinc-500/10' },
    { id: 'observacoes', label: 'Observações', icon: StickyNote, color: 'text-lime-600', bg: 'bg-lime-500/10' },
    { id: 'retorno', label: 'Retorno', icon: Calendar, color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { id: 'outros', label: 'Outros', icon: PlusCircle, color: 'text-gray-500', bg: 'bg-gray-500/10' },
]

export function AttendanceTypeDialog({ open, onOpenChange, onSelect }: AttendanceTypeDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardList className="size-6 text-emerald-500" />
                        Novo Atendimento
                    </DialogTitle>
                    <DialogDescription>
                        Selecione o tipo de atendimento para o paciente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
                    {attendanceTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => onSelect(type.id)}
                            className={cn(
                                "group flex flex-col items-center justify-center p-4 rounded-xl border border-border/50 transition-all duration-200",
                                "hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1",
                                type.bg
                            )}
                        >
                            <type.icon className={cn("size-8 mb-3 transition-transform group-hover:scale-110", type.color)} />
                            <span className="text-xs font-semibold text-center leading-tight">{type.label}</span>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
