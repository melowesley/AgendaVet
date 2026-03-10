'use client'

import { useState, useRef } from 'react'
import { supabase, usePet, useOwner } from '@/lib/data-store'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Scissors, Save, ArrowLeft, Printer, DollarSign, Plus, Trash2, Brush, Sparkles, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
// @ts-ignore
import ReactToPrint from 'react-to-print'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface BanhoTosaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

const GROOMING_SERVICES = [
    'Banho Simples',
    'Banho Terapêutico',
    'Tosa Higiênica',
    'Tosa da Raça',
    'Tosa na Máquina',
    'Tosa na Tesoura',
    'Corte de Unhas',
    'Limpeza de Ouvidos',
    'Escovação de Dentes',
    'Hidratação',
]

export function BanhoTosaDialog({ open, onOpenChange, onBack, petId, petName }: BanhoTosaDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')

    const isMale = pet?.gender === 'Macho'
    const themeColor = {
        bg: isMale ? 'bg-sky-600' : 'bg-rose-500',
        bgHover: isMale ? 'hover:bg-sky-700' : 'hover:bg-rose-600',
        bgGhost: isMale ? 'bg-sky-500/10' : 'bg-rose-500/10',
        bgLight: isMale ? 'bg-sky-50' : 'bg-rose-50',
        text: isMale ? 'text-sky-600' : 'text-rose-600',
        border: isMale ? 'border-sky-500' : 'border-rose-500',
        borderLight: isMale ? 'border-sky-200' : 'border-rose-200',
    }

    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

    // Form fields
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [estadoPele, setEstadoPele] = useState('')
    const [presencaParasitas, setPresencaParasitas] = useState(false)
    const [presencaNos, setPresencaNos] = useState(false)
    const [observacoes, setObservacoes] = useState('')
    const [profissional, setProfissional] = useState('Equipe de Estética')

    // Billing state
    const [baseValue, setBaseValue] = useState('0.00')
    const [extraServices, setExtraServices] = useState<{ id: string, name: string, value: number }[]>([])

    const printRef = useRef<HTMLDivElement>(null)

    const toggleService = (service: string) => {
        setSelectedServices(prev =>
            prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
        )
    }

    const handleSave = async () => {
        if (selectedServices.length === 0) {
            toast.error('Selecione pelo menos um serviço')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const description = {
                servicos: selectedServices,
                avaliação: {
                    pele: estadoPele,
                    parasitas: presencaParasitas,
                    nos: presencaNos
                },
                observacoes,
                billing: {
                    baseValue: parseFloat(baseValue),
                    extras: extraServices,
                    total: parseFloat(baseValue) + extraServices.reduce((acc, s) => acc + s.value, 0)
                }
            }

            const { error } = await (supabase.from('medical_records' as any).insert([{
                pet_id: petId,
                user_id: userData.user?.id,
                type: 'banho-tosa',
                title: `Estética - ${selectedServices[0]}`,
                description: JSON.stringify(description),
                date: new Date(date).toISOString(),
                veterinarian: profissional, // Using professional here
            }] as any) as any)

            if (error) throw error

            mutate('medical-records')
            toast.success('Registro de estética salvo!')
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar registro')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-7xl max-h-[95vh] flex flex-col p-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onBack}>
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className={`flex size-10 items-center justify-center rounded-full ${themeColor.bgGhost} ${themeColor.text}`}>
                            <Brush className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Banho e Tosa - {petName}</DialogTitle>
                            <DialogDescription>Registro de serviços de estética e bem-estar</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Form Side */}
                    <div className="w-full md:w-1/2 p-6 border-r border-border/30 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data do Serviço *</Label>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profissional Responsável</Label>
                                    <Input
                                        value={profissional}
                                        onChange={(e) => setProfissional(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Serviços Realizados</Label>
                                <div className="grid grid-cols-2 gap-2 p-4 rounded-xl bg-muted/30 border border-border/50">
                                    {GROOMING_SERVICES.map((s) => (
                                        <label key={s} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                                            <Checkbox
                                                checked={selectedServices.includes(s)}
                                                onCheckedChange={() => toggleService(s)}
                                                className={themeColor.border}
                                            />
                                            {s}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avaliação Pré-Serviço</Label>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <Checkbox checked={presencaParasitas} onCheckedChange={(v) => setPresencaParasitas(!!v)} />
                                            Presença de Parasitas
                                        </label>
                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <Checkbox checked={presencaNos} onCheckedChange={(v) => setPresencaNos(!!v)} />
                                            Presença de Nós
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Estado da Pele e Pelagem</Label>
                                        <Input
                                            value={estadoPele}
                                            onChange={(e) => setEstadoPele(e.target.value)}
                                            placeholder="Ex: Pele íntegra, Pelagem brilhante, Vermelhidão abdominal..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações Adicionais</Label>
                                <Textarea
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    placeholder="Reações, comportamento durante o banho, recomendações ao tutor..."
                                    rows={3}
                                />
                            </div>

                            {/* Billing Section */}
                            <div className={`p-4 rounded-xl border-2 border-dashed ${themeColor.border}/20 ${themeColor.bgLight}/30 space-y-3`}>
                                <div className={`flex items-center gap-2 ${themeColor.text} font-bold text-xs uppercase tracking-wider`}>
                                    <DollarSign className="size-4" />
                                    Faturamento do Serviço
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Valor Base (Serviços) (R$)</Label>
                                        <Input
                                            type="number"
                                            value={baseValue}
                                            onChange={(e) => setBaseValue(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`w-full h-8 text-[10px] ${themeColor.border}/30 ${themeColor.text}`}
                                            onClick={() => setExtraServices([...extraServices, { id: Math.random().toString(), name: 'Extra (Laço/Hidrat)', value: 0 }])}
                                        >
                                            <Plus className="size-3 mr-1" /> Add Extra
                                        </Button>
                                    </div>
                                </div>

                                {extraServices.map((service, idx) => (
                                    <div key={service.id} className="flex gap-2 items-center">
                                        <Input
                                            value={service.name}
                                            onChange={(e) => {
                                                const newServices = [...extraServices]
                                                newServices[idx].name = e.target.value
                                                setExtraServices(newServices)
                                            }}
                                            placeholder="Descrição"
                                            className="h-7 text-[10px] flex-1"
                                        />
                                        <Input
                                            type="number"
                                            value={service.value}
                                            onChange={(e) => {
                                                const newServices = [...extraServices]
                                                newServices[idx].value = parseFloat(e.target.value) || 0
                                                setExtraServices(newServices)
                                            }}
                                            className="h-7 text-[10px] w-16"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-destructive"
                                            onClick={() => setExtraServices(extraServices.filter((_, i) => i !== idx))}
                                        >
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </div>
                                ))}

                                <div className={`pt-2 border-t ${themeColor.border}/20 flex justify-between items-center text-sm font-bold ${themeColor.text}`}>
                                    <span>Total Final:</span>
                                    <span>R$ {(parseFloat(baseValue) + extraServices.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={handleSave} disabled={loading} className={`flex-1 ${themeColor.bg} ${themeColor.bgHover} text-white shadow-lg`}>
                                    <Save className="size-4 mr-2" />
                                    {loading ? 'Salvando...' : 'Finalizar Estética'}
                                </Button>

                                <ReactToPrint
                                    trigger={() => (
                                        <Button variant="outline" className="flex-1">
                                            <Printer className="size-4 mr-2" />
                                            Relatório de Banho
                                        </Button>
                                    )}
                                    content={() => printRef.current}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className="hidden md:block w-1/2 bg-muted/10 p-8 overflow-y-auto">
                        <div
                            ref={printRef}
                            className={`w-full max-w-[600px] mx-auto min-h-[842px] bg-white shadow-2xl rounded-sm border-2 p-10 flex flex-col text-slate-900 ${themeColor.borderLight}`}
                        >
                            <div className={`border-b-2 pb-6 mb-8 flex justify-between items-end ${themeColor.border}`}>
                                <div>
                                    <h2 className={`text-2xl font-bold uppercase tracking-widest ${themeColor.text}`}>Relatório de Estética</h2>
                                    <p className="text-[10px] opacity-70 mt-1 uppercase">Cuidados e Higienização Professional</p>
                                </div>
                                <div className={`text-right ${themeColor.text}`}>
                                    <Sparkles className="size-10 ml-auto mb-1 opacity-20" />
                                    <p className="text-[8px] font-bold">AgendaVet Grooming Hub</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10 bg-muted/20 p-5 rounded-xl border border-border/50">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Paciente</p>
                                    <p className="text-sm font-bold">{petName}</p>
                                    <p className="text-[10px] opacity-70">{pet?.species} | {pet?.breed}</p>
                                    <p className="text-[10px] opacity-70">Data: {format(new Date(date), 'dd/MM/yyyy')}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Responsável</p>
                                    <p className="text-sm font-bold">{owner?.fullName || "S/R"}</p>
                                    <p className="text-[10px] opacity-70">{owner?.phone || "Sem contato"}</p>
                                    <p className="text-[10px] opacity-70">Profissional: {profissional}</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-8 text-slate-800 pb-10">
                                <section className={`p-5 rounded-xl bg-muted/30 border-l-4 ${themeColor.border}`}>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text}`}>Serviços Realizados</h3>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {selectedServices.length > 0 ? selectedServices.map(s => (
                                            <Badge key={s} className={`${themeColor.bg} text-white border-none`}>{s}</Badge>
                                        )) : <p className="text-xs italic text-muted-foreground tracking-tight">Nenhum serviço selecionado...</p>}
                                    </div>
                                </section>

                                <div className="grid grid-cols-2 gap-8">
                                    <section>
                                        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Avaliação Dermatológica</h3>
                                        <p className="text-[11px] leading-relaxed mt-2">{estadoPele || "Pele e pelagem sem alterações visíveis."}</p>
                                    </section>
                                    <section>
                                        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Alertas Rápidos</h3>
                                        <div className="space-y-2 mt-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`size-3 rounded-full ${presencaParasitas ? 'bg-rose-500 shadow-sm' : 'bg-muted border border-border/50'}`}></div>
                                                <span className={`text-[10px] font-bold ${presencaParasitas ? 'text-rose-600' : 'text-muted-foreground'}`}>Presença de Parasitas</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`size-3 rounded-full ${presencaNos ? 'bg-amber-500 shadow-sm' : 'bg-muted border border-border/50'}`}></div>
                                                <span className={`text-[10px] font-bold ${presencaNos ? 'text-amber-600' : 'text-muted-foreground'}`}>Presença de Nós</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <section>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Observações Técnicas</h3>
                                    <p className="text-[11px] leading-relaxed mt-2 whitespace-pre-wrap italic text-slate-600 border-l-2 border-slate-100 pl-4">
                                        {observacoes || "Procedimento realizado sem intercorrências comportamentais ou dermatológicas."}
                                    </p>
                                </section>

                                <div className={`p-6 rounded-2xl ${themeColor.bgGhost} border border-dashed ${themeColor.border}/30 flex items-center gap-4`}>
                                    <AlertCircle className={`size-5 ${themeColor.text}`} />
                                    <p className="text-[10px] font-medium leading-snug">
                                        Lembramos que a estética faz parte da saúde preventiva. Em caso de alterações na pele notadas após o banho, procure orientação médica veterinária.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto pt-10 flex justify-between items-end border-t border-dashed">
                                <div className="text-[9px] opacity-40 italic font-mono uppercase tracking-tighter">AgendaVet Smart Grooming Registry - {format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
                                <div className="text-center w-64">
                                    <div className={`h-[1px] w-full ${themeColor.border} mb-3`}></div>
                                    <p className="text-[11px] font-bold uppercase">{profissional}</p>
                                    <p className="text-[9px] opacity-60">Centro de Estética AgendaVet</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
