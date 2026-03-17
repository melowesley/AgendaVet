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
import { Syringe, Save, Trash2, Calendar, Edit2, ArrowLeft, FileDown, Plus, Printer, PawPrint, DollarSign, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useReactToPrint } from 'react-to-print'
import { usePet, useOwner, useMedicalRecords } from '@/lib/data-store'
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
    const { records: allRecords } = useMedicalRecords(petId)

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
    const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Vacina_${vaccineName}_${petName}` })

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
            <DialogContent className="w-screen sm:max-w-none !max-w-none h-screen max-h-none rounded-none p-0 flex flex-col overflow-hidden border-none text-slate-800">
                <DialogHeader className="p-4 md:p-6 border-b border-border/50 bg-white flex flex-row items-center justify-between shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100" onClick={onBack}>
                            <ArrowLeft className="size-5" />
                        </Button>
                        <div className={`flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-inner`}>
                            <Syringe className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">
                                Controle de Vacinação
                            </DialogTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 font-medium">
                                <span className="flex items-center gap-1"><PawPrint className="size-3.5" /> <span className="font-bold text-slate-700">{petName}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 font-bold text-emerald-600 uppercase tracking-tighter text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Doses & Reforços</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-bold text-slate-500">
                            Fechar
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className={`h-10 px-6 font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg`}>
                            <Save className="size-4 mr-2" />
                            {loading ? 'Salvando...' : 'Salvar Registro'}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex bg-slate-100/50">
                    {/* NEW: Left Sidebar with Patient History */}
                    <div className="hidden xl:block w-[380px] bg-slate-50/80 border-r border-border/30 p-8 overflow-y-auto shrink-0 shadow-inner">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-l-4 border-emerald-500 pl-4 mb-8">
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
                                    <div key={record.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-500 transition-all hover:shadow-md group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[11px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-[3px]">
                                                {format(new Date(record.date || record.createdAt), "dd/MM/yyyy")}
                                            </span>
                                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
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
                                    {editingId ? 'Editar Vacina' : 'Nova Aplicação'}
                                </h3>
                                {editingId && (
                                    <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-xs font-bold text-slate-500">
                                        Cancelar
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="vaccine_name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome da Vacina *</Label>
                                    <Input
                                        id="vaccine_name"
                                        value={vaccineName}
                                        onChange={(e) => setVaccineName(e.target.value)}
                                        placeholder="Ex: V10, Antirrábica..."
                                        className="h-12 border-slate-200 rounded-xl focus:ring-emerald-500 font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="app_date" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Aplicação *</Label>
                                        <Input id="app_date" type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} className="h-12 border-slate-200 rounded-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="next_date" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Próxima Dose</Label>
                                        <Input id="next_date" type="date" value={nextDoseDate} onChange={(e) => setNextDoseDate(e.target.value)} className="h-12 border-slate-200 rounded-xl font-bold" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="batch" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lote</Label>
                                        <Input id="batch" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="Nº do Lote" className="h-12 border-slate-200 rounded-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vet" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Veterinário</Label>
                                        <Input id="vet" value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} placeholder="Dr. Cleyton Chaves" className="h-12 border-slate-200 rounded-xl font-bold" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="vac-notes" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações Clínicas</Label>
                                    <Textarea
                                        id="vac-notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Notas adicionais sobre a aplicação ou reação..."
                                        className="min-h-[100px] border-slate-200 rounded-xl font-medium"
                                    />
                                </div>

                                {/* Billing Section */}
                                <div className="p-6 rounded-2xl border-2 border-dashed border-emerald-500/20 bg-emerald-500/[0.02] space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase tracking-[0.2em]">
                                        <DollarSign className="size-4" />
                                        Serviços e Valores
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor da Vacina (R$)</Label>
                                            <Input
                                                type="number"
                                                value={baseValue}
                                                onChange={(e) => setBaseValue(e.target.value)}
                                                className="h-10 border-slate-200 rounded-xl font-bold"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-10 border-emerald-500/30 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50"
                                                onClick={() => setServices([...services, { id: Math.random().toString(), name: 'Serviço Extra', value: 0 }])}
                                            >
                                                <Plus className="size-4 mr-1" /> Serviço
                                            </Button>
                                        </div>
                                    </div>

                                    {services.map((service, idx) => (
                                        <div key={service.id} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                            <Input
                                                value={service.name}
                                                onChange={(e) => {
                                                    const newServices = [...services]
                                                    newServices[idx].name = e.target.value
                                                    setServices(newServices)
                                                }}
                                                placeholder="Serviço"
                                                className="h-8 border-none shadow-none text-xs font-bold flex-1"
                                            />
                                            <Input
                                                type="number"
                                                value={service.value}
                                                onChange={(e) => {
                                                    const newServices = [...services]
                                                    newServices[idx].value = parseFloat(e.target.value) || 0
                                                    setServices(newServices)
                                                }}
                                                className="h-8 border-none shadow-none text-xs font-black w-20 text-right"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
                                                onClick={() => setServices(services.filter((_, i) => i !== idx))}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    <div className="pt-4 border-t border-emerald-500/10 flex justify-between items-center text-lg font-black text-emerald-800 uppercase tracking-tighter">
                                        <span>Total:</span>
                                        <span>R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button onClick={handleSave} disabled={loading} className={`flex-1 h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-lg`}>
                                        <Save className="size-4 mr-2" />
                                        {loading ? 'Salvando...' : 'Salvar Registro'}
                                    </Button>

                                    <Button variant="outline" className="h-10 px-4 rounded-lg" title="Visualizar/Imprimir" onClick={() => handlePrint()}>
                                        <Printer className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-1 bg-slate-200/50 p-6 lg:p-12 overflow-y-auto justify-center items-start">
                        <div
                            ref={printRef}
                            className={`w-full max-w-[650px] min-h-[920px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm border p-12 flex flex-col text-slate-900 border-emerald-200 border-t-8 border-emerald-600`}
                        >
                            <div className={`border-b-2 pb-4 mb-6 flex justify-between items-end border-emerald-500`}>
                                <div>
                                    <h2 className={`text-xl font-bold uppercase tracking-widest text-emerald-600`}>Comprovante de Vacinação</h2>
                                    <p className="text-[10px] opacity-70 mt-1 uppercase text-slate-500">Folha Médica de Atendimento</p>
                                </div>
                                <div className={`text-right text-emerald-600`}>
                                    <PawPrint className="size-8 ml-auto mb-1 opacity-20" />
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">AgendaVet System v2.0</p>
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
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
                                    <div className="flex items-center gap-5 mb-6 border-b border-slate-100 pb-5">
                                        <div className={`p-4 rounded-xl bg-emerald-600 text-white shadow-lg`}>
                                            <Syringe className="size-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-2xl text-slate-900 tracking-tighter">{vaccineName || 'Aguardando nome...'}</h3>
                                            <p className="text-xs text-emerald-600 font-black uppercase tracking-widest mt-0.5">Aplicada em {format(new Date(applicationDate), 'dd/MM/yyyy')}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="bg-slate-50 p-3 border border-slate-200 rounded-sm text-center">
                                            <p className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-2">Próxima Dose</p>
                                            <p className="text-base font-black text-emerald-600 tracking-tight">{nextDoseDate ? format(new Date(nextDoseDate), 'dd/MM/yyyy') : 'Não agendada'}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 border border-slate-200 rounded-sm text-center">
                                            <p className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-2">Vigilância Sanitária</p>
                                            <p className="text-base font-black text-slate-800 tracking-tight">{batchNumber || 'Lote N/I'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-slate-300 p-6 rounded-sm min-h-[150px] bg-slate-50/20">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 pb-2 mb-4">Observações Clínicas</h4>
                                    <div className="text-[12px] leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                                        {notes || "Nenhuma observação clínica adicional registrada para esta aplicação."}
                                    </div>
                                </div>

                                {(parseFloat(baseValue) > 0 || services.length > 0) && (
                                    <div className="border border-slate-800 rounded-sm overflow-hidden mt-6 bg-white shadow-sm">
                                        <div className="bg-slate-800 px-4 py-2 text-[10px] font-black uppercase text-white tracking-[0.25em]">Resumo Financeiro</div>
                                        <div className="p-6 space-y-3">
                                            {parseFloat(baseValue) > 0 && (
                                                <div className="flex justify-between text-[12px] border-b border-slate-100 pb-2">
                                                    <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Vacina: {vaccineName}</span>
                                                    <span className="font-black text-slate-900">R$ {parseFloat(baseValue).toFixed(2)}</span>
                                                </div>
                                            )}
                                            {services.map(s => (
                                                <div key={s.id} className="flex justify-between text-[12px] border-b border-slate-100 pb-2">
                                                    <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">{s.name}</span>
                                                    <span className="font-black text-slate-900">R$ {s.value.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between pt-4 mt-2 font-black text-xl text-emerald-600 tracking-tighter">
                                                <span>VALOR TOTAL</span>
                                                <span>R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-12 flex justify-between items-end">
                                <div className="text-[9px] opacity-40 italic max-w-[250px] leading-tight font-medium text-slate-500 uppercase">
                                    Documento autêntico AgendaVet. Validade jurídica conforme normas sanitárias vigentes.
                                </div>
                                <div className="text-center w-64">
                                    <div className="h-[2px] w-full bg-slate-300 mb-3"></div>
                                    <p className="text-[12px] font-black uppercase text-slate-900 tracking-tight">{veterinarian || 'Dr. Cleyton Chaves'}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Médico Veterinário • CRMV</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
