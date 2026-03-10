'use client'

import { useState, useEffect } from 'react'
import { mutate } from 'swr'
import { supabase } from '@/lib/data-store'
import { useRef } from 'react'
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
import { Syringe, Save, Trash2, Calendar, Edit2, ArrowLeft, FileDown, Plus, Printer, PawPrint, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactToPrint from 'react-to-print'
import { usePet, useOwner } from '@/lib/data-store'
import DOMPurify from 'dompurify'

interface VacinaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

interface Vaccine {
    id: string
    vaccine_name: string
    application_date: string
    next_dose_date: string | null
    batch_number: string | null
    veterinarian: string | null
    notes: string | null
}

export function VacinaDialog({ open, onOpenChange, onBack, petId, petName }: VacinaDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')

    const isFemale = pet?.gender === 'Fêmea'
    const themeColor = {
        bg: isFemale ? 'bg-pink-600' : 'bg-blue-600',
        bgHover: isFemale ? 'hover:bg-pink-700' : 'hover:bg-blue-700',
        bgGhost: isFemale ? 'bg-pink-500/10' : 'bg-blue-500/10',
        bgLight: isFemale ? 'bg-pink-50' : 'bg-blue-50',
        text: isFemale ? 'text-pink-600' : 'text-blue-600',
        border: isFemale ? 'border-pink-500' : 'border-blue-500',
        borderLight: isFemale ? 'border-pink-200' : 'border-blue-200',
    }

    const [loading, setLoading] = useState(false)
    const [records, setRecords] = useState<Vaccine[]>([])
    const [vaccineName, setVaccineName] = useState('')
    const [applicationDate, setApplicationDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [nextDoseDate, setNextDoseDate] = useState('')
    const [batchNumber, setBatchNumber] = useState('')
    const [veterinarian, setVeterinarian] = useState('Dr. Cleyton Chaves')
    const [notes, setNotes] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)

    // Billing state
    const [baseValue, setBaseValue] = useState('0.00')
    const [services, setServices] = useState<{ id: string, name: string, value: number }[]>([])

    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (open) loadRecords()
    }, [open, petId])

    const loadRecords = async () => {
        const { data, error } = await (supabase
            .from('pet_vaccines' as any)
            .select('*')
            .eq('pet_id', petId)
            .order('application_date', { ascending: false }) as any)

        if (error) {
            console.error('Error loading vaccines:', error)
            return
        }
        if (data) setRecords(data)
    }

    const handleSave = async () => {
        if (!vaccineName || !applicationDate) {
            toast.error('Nome da vacina e data são obrigatórios')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const payload = {
                pet_id: petId,
                user_id: userData.user?.id,
                vaccine_name: vaccineName,
                application_date: applicationDate,
                next_dose_date: nextDoseDate || null,
                batch_number: batchNumber || null,
                veterinarian: veterinarian || 'Dr. Cleyton Chaves',
                notes: JSON.stringify({
                    observation: notes,
                    billing: {
                        baseValue: parseFloat(baseValue),
                        services: services,
                        total: parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)
                    }
                }),
            }

            if (editingId) {
                const { error } = await (supabase
                    .from('pet_vaccines' as any)
                    .update(payload as any)
                    .eq('id', editingId) as any)
                if (error) throw error
                toast.success('Vacina atualizada com sucesso!')
            } else {
                const { error } = await (supabase.from('pet_vaccines' as any).insert([payload] as any) as any)
                if (error) throw error
                toast.success('Vacina registrada com sucesso!')
            }

            resetForm()
            loadRecords()
            mutate('medical-records')
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar vacina')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setVaccineName('')
        setNextDoseDate('')
        setBatchNumber('')
        setVeterinarian('Dr. Cleyton Chaves')
        setNotes('')
        setBaseValue('0.00')
        setServices([])
        setApplicationDate(format(new Date(), 'yyyy-MM-dd'))
        setEditingId(null)
    }

    const handleEdit = (record: Vaccine) => {
        setVaccineName(record.vaccine_name)
        setApplicationDate(record.application_date)
        setNextDoseDate(record.next_dose_date || '')
        setBatchNumber(record.batch_number || '')
        setVeterinarian(record.veterinarian || 'Dr. Cleyton Chaves')

        try {
            const parsed = JSON.parse(record.notes || '{}')
            setNotes(parsed.observation || record.notes || '')
            if (parsed.billing) {
                setBaseValue(parsed.billing.baseValue?.toString() || '0.00')
                setServices(parsed.billing.services || [])
            }
        } catch {
            setNotes(record.notes || '')
        }

        setEditingId(record.id)
    }

    const handleDelete = async (id: string) => {
        try {
            const { error } = await (supabase.from('pet_vaccines' as any).delete().eq('id', id) as any)
            if (error) throw error
            toast.success('Vacina excluída')
            loadRecords()
            mutate('medical-records')
        } catch (error: any) {
            toast.error(error.message || 'Erro ao excluir vacina')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0 border-b border-border/50">
                    <div className="flex items-center gap-4 mb-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onBack}>
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                            <Syringe className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Vacinas - {petName}</DialogTitle>
                            <DialogDescription>Gerencie o histórico de vacinação do paciente</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Form Side */}
                    <div className="w-full md:w-1/2 p-6 border-r border-border/30 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Plus className="size-4" />
                                    {editingId ? 'Editar Vacina' : 'Nova Aplicação'}
                                </h3>
                                {editingId && (
                                    <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-xs">
                                        Cancelar
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="vaccine_name">Nome da Vacina *</Label>
                                    <Input
                                        id="vaccine_name"
                                        value={vaccineName}
                                        onChange={(e) => setVaccineName(e.target.value)}
                                        placeholder="Ex: V10, Antirrábica..."
                                        className="focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="app_date">Data de Aplicação *</Label>
                                        <Input id="app_date" type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="next_date">Próxima Dose</Label>
                                        <Input id="next_date" type="date" value={nextDoseDate} onChange={(e) => setNextDoseDate(e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="batch">Lote</Label>
                                        <Input id="batch" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="Nº do Lote" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vet">Veterinário</Label>
                                        <Input id="vet" value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} placeholder="Dr. Cleyton Chaves" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="vac-notes">Observações Clínicas</Label>
                                    <Textarea
                                        id="vac-notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Notas adicionais..."
                                        className="min-h-[80px]"
                                    />
                                </div>

                                {/* Billing Section */}
                                <div className="p-4 rounded-xl border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                                        <DollarSign className="size-4" />
                                        Serviços e Valores
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Valor da Vacina (R$)</Label>
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
                                                className="w-full h-8 text-[10px] border-emerald-500/30 text-emerald-600"
                                                onClick={() => setServices([...services, { id: Math.random().toString(), name: 'Serviço Extra', value: 0 }])}
                                            >
                                                <Plus className="size-3 mr-1" /> Add Serviço
                                            </Button>
                                        </div>
                                    </div>

                                    {services.map((service, idx) => (
                                        <div key={service.id} className="flex gap-2 items-center">
                                            <Input
                                                value={service.name}
                                                onChange={(e) => {
                                                    const newServices = [...services]
                                                    newServices[idx].name = e.target.value
                                                    setServices(newServices)
                                                }}
                                                placeholder="Nome do serviço"
                                                className="h-7 text-[10px] flex-1"
                                            />
                                            <Input
                                                type="number"
                                                value={service.value}
                                                onChange={(e) => {
                                                    const newServices = [...services]
                                                    newServices[idx].value = parseFloat(e.target.value) || 0
                                                    setServices(newServices)
                                                }}
                                                className="h-7 text-[10px] w-16"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-destructive"
                                                onClick={() => setServices(services.filter((_, i) => i !== idx))}
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    ))}

                                    <div className="pt-2 border-t border-emerald-500/20 flex justify-between items-center text-sm font-bold text-emerald-700">
                                        <span>Total:</span>
                                        <span>R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={handleSave} disabled={loading} className={`flex-1 ${themeColor.bg} ${themeColor.bgHover} text-white`}>
                                        <Save className="size-4 mr-2" />
                                        {loading ? 'Salvando...' : 'Salvar Registro'}
                                    </Button>

                                    {/* @ts-ignore */}
                                    <ReactToPrint
                                        trigger={() => (
                                            <Button variant="outline" className="flex-1">
                                                <Printer className="size-4 mr-2" />
                                                Visualizar A4
                                            </Button>
                                        )}
                                        content={() => printRef.current}
                                        documentTitle={`Vacina_${vaccineName}_${petName}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className="hidden md:block w-1/2 bg-muted/10 p-8 overflow-y-auto">
                        <div
                            ref={printRef}
                            className={`w-full max-w-[600px] mx-auto aspect-[1/1.414] bg-white shadow-2xl rounded-sm border-2 p-8 flex flex-col text-slate-900 ${themeColor.borderLight}`}
                        >
                            <div className={`border-b-2 pb-4 mb-6 flex justify-between items-end ${themeColor.border}`}>
                                <div>
                                    <h2 className={`text-xl font-bold uppercase tracking-widest ${themeColor.text}`}>Comprovante de Vacinação</h2>
                                    <p className="text-[10px] opacity-70 mt-1 uppercase">Folha Médica de Atendimento</p>
                                </div>
                                <div className={`text-right ${themeColor.text}`}>
                                    <PawPrint className="size-8 ml-auto mb-1 opacity-20" />
                                    <p className="text-[8px] font-bold">AgendaVet System v2.0</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8 bg-muted/20 p-4 rounded-lg border border-border/50">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Paciente</p>
                                    <p className="text-sm font-bold">{petName}</p>
                                    <p className="text-[10px] opacity-70">Espécie: {pet?.species} | Raça: {pet?.breed}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Tutor</p>
                                    <p className="text-sm font-bold">{owner?.fullName || 'S/R'}</p>
                                    <p className="text-[10px] opacity-70">{owner?.phone || 'Sem contato'}</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-6">
                                <div className={`p-4 rounded-xl border ${themeColor.borderLight} ${themeColor.bgLight}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2 rounded-lg ${themeColor.bg} text-white`}>
                                            <Syringe className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{vaccineName || 'Aguardando nome...'}</h3>
                                            <p className="text-xs opacity-70">Aplicada em {format(new Date(applicationDate), 'dd/MM/yyyy')}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="font-bold text-muted-foreground uppercase text-[8px]">Próxima Dose</p>
                                            <p className="font-medium">{nextDoseDate ? format(new Date(nextDoseDate), 'dd/MM/yyyy') : 'Não agendada'}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-muted-foreground uppercase text-[8px]">Vigilância Sanitária (Lote)</p>
                                            <p className="font-medium">{batchNumber || 'N/I'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase border-b pb-1">Observações e Serviços</h4>
                                    <p className="text-[11px] italic leading-relaxed text-slate-600 min-h-[50px]">
                                        {notes || "Nenhuma observação clínica registrada."}
                                    </p>
                                </div>

                                {(parseFloat(baseValue) > 0 || services.length > 0) && (
                                    <div className="mt-4 border border-emerald-500/10 rounded-lg overflow-hidden">
                                        <div className="bg-emerald-500/5 px-3 py-1 text-[9px] font-bold uppercase text-emerald-700">Resumo Financeiro</div>
                                        <div className="p-3 space-y-1">
                                            {parseFloat(baseValue) > 0 && (
                                                <div className="flex justify-between text-[10px]">
                                                    <span>{vaccineName}</span>
                                                    <span>R$ {parseFloat(baseValue).toFixed(2)}</span>
                                                </div>
                                            )}
                                            {services.map(s => (
                                                <div key={s.id} className="flex justify-between text-[10px]">
                                                    <span>{s.name}</span>
                                                    <span>R$ {s.value.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between pt-1 mt-1 border-t font-bold text-sm">
                                                <span>Total Atendimento</span>
                                                <span>R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-10 flex justify-between items-end border-t border-dashed">
                                <div className="text-[9px] opacity-50 italic">Validade jurídica para comprovante de vacinação animal.</div>
                                <div className="text-center w-48">
                                    <div className="h-[1px] w-full bg-slate-400 mb-2"></div>
                                    <p className="text-[10px] font-bold uppercase">{veterinarian || 'Dr. Cleyton Chaves'}</p>
                                    <p className="text-[8px] opacity-70">Médico Veterinário • CRMV-SP</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
