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
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Scissors, Save, ArrowLeft, History, FileDown } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CirurgiaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

const TIPOS_ANESTESIA = [
    'Anestesia geral inalatória',
    'Anestesia geral intravenosa (TIVA)',
    'Anestesia dissociativa',
    'Bloqueio regional / epidural',
    'Sedação + anestesia local',
]

const MATERIAIS_SUTURA = [
    'Nylon', 'Poliglactina 910 (Vicryl)', 'Polidioxanona (PDS)',
    'Categute cromado', 'Polipropileno (Prolene)', 'Ácido poliglicólico (Dexon)',
]

export function CirurgiaDialog({ open, onOpenChange, onBack, petId, petName }: CirurgiaDialogProps) {
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

    // Form fields
    const [procedimento, setProcedimento] = useState('')
    const [tecnica, setTecnica] = useState('')
    const [tipoAnestesia, setTipoAnestesia] = useState('')
    const [duracao, setDuracao] = useState('')
    const [protocolo, setProtocolo] = useState('')
    const [materiais, setMateriais] = useState<string[]>([])
    const [intercorrencias, setIntercorrencias] = useState('')
    const [posOperatorio, setPosOperatorio] = useState('')
    const [prescricao, setPrescricao] = useState('')
    const [retorno, setRetorno] = useState('')

    const toggleMaterial = (mat: string) => {
        setMateriais(prev => prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat])
    }

    const resetForm = () => {
        setProcedimento('')
        setTecnica('')
        setTipoAnestesia('')
        setDuracao('')
        setProtocolo('')
        setMateriais([])
        setIntercorrencias('')
        setPosOperatorio('')
        setPrescricao('')
        setRetorno('')
        setDate(format(new Date(), 'yyyy-MM-dd'))
    }

    const handleSave = async () => {
        if (!procedimento.trim()) {
            toast.error('Preencha o procedimento realizado')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            // Save to medical_records to keep it standalone from appointments
            const details = {
                tecnica_cirurgica: tecnica,
                tipo_anestesia: tipoAnestesia,
                duracao_minutos: duracao,
                protocolo_anestesico: protocolo,
                materiais_sutura: materiais,
                intercorrencias: intercorrencias,
                pos_operatorio_imediato: posOperatorio,
                prescricao_pos_op: prescricao,
                retorno_previsto: retorno
            }

            const { error } = await (supabase.from('medical_records' as any).insert([{
                pet_id: petId,
                user_id: userData.user?.id,
                type: 'surgery',
                title: procedimento,
                description: JSON.stringify(details),
                date: new Date(date).toISOString(),
                veterinarian: 'Veterinário Responsável', // Optional: add veterinarian selection later
            }] as any) as any)

            if (error) throw error

            toast.success('Registro cirúrgico salvo com sucesso!')
            resetForm()
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar registro cirúrgico')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0 border-b border-border/50">
                    <div className="flex items-center gap-4 mb-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onBack}>
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className="flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                            <Scissors className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Cirurgia - {petName}</DialogTitle>
                            <DialogDescription>Registro e ficha de procedimento cirúrgico</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-semibold">Procedimento Realizado *</Label>
                                <Input
                                    placeholder="Ex: Ovariohisterectomia"
                                    value={procedimento}
                                    onChange={(e) => setProcedimento(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Data da Cirurgia *</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold">Técnica Cirúrgica</Label>
                            <Textarea
                                placeholder="Descreva a técnica utilizada..."
                                value={tecnica}
                                onChange={(e) => setTecnica(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-semibold">Tipo de Anestesia</Label>
                                <Select value={tipoAnestesia} onValueChange={setTipoAnestesia}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIPOS_ANESTESIA.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Duração (min)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={duracao}
                                    onChange={(e) => setDuracao(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold">Protocolo Anestésico</Label>
                            <Textarea
                                placeholder="MPA, indução, manutenção, fármacos e doses..."
                                value={protocolo}
                                onChange={(e) => setProtocolo(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold">Materiais de Sutura Utilizados</Label>
                            <div className="grid grid-cols-2 gap-3 bg-muted/30 p-4 rounded-lg border border-border/50">
                                {MATERIAIS_SUTURA.map((mat) => (
                                    <label key={mat} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors">
                                        <Checkbox
                                            checked={materiais.includes(mat)}
                                            onCheckedChange={() => toggleMaterial(mat)}
                                        />
                                        {mat}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold">Intercorrências</Label>
                            <Textarea
                                placeholder="Descreva intercorrências durante o procedimento (se houver)..."
                                value={intercorrencias}
                                onChange={(e) => setIntercorrencias(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold">Pós-operatório Imediato</Label>
                            <Textarea
                                placeholder="Estado do paciente na recuperação anestésica..."
                                value={posOperatorio}
                                onChange={(e) => setPosOperatorio(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold">Prescrição Pós-operatória</Label>
                            <Textarea
                                placeholder="Medicamentos, curativos, restrições..."
                                value={prescricao}
                                onChange={(e) => setPrescricao(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold">Retorno Previsto</Label>
                            <Input
                                placeholder="Ex: 10 dias para retirada de pontos"
                                value={retorno}
                                onChange={(e) => setRetorno(e.target.value)}
                            />
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
                            <Button onClick={handleSave} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                                <Save size={18} className="mr-2" />
                                {loading ? 'Salvando...' : 'Finalizar Registro'}
                            </Button>
                            <Button variant="outline" className="flex-1">
                                <History size={18} className="mr-2" />
                                Ver Histórico
                            </Button>
                            <Button variant="outline" className="flex-1">
                                <FileDown size={18} className="mr-2" />
                                Exportar PDF
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
