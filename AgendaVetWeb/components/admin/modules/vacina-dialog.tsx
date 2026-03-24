'use client'

import { useState, useEffect } from 'react'
import { mutate } from 'swr'
import { supabase } from '@/lib/data-store'
import { usePet, useOwner, useMedicalRecords } from '@/lib/data-store'
import { BaseAttendanceDialog } from '../shared/base-attendance-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

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
    const [baseValue, setBaseValue] = useState('50.00')
    const [services, setServices] = useState<{ id: string, name: string, value: number }[]>([])

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
                veterinarian: veterinarian || null,
                notes: notes || null,
            }

            if (editingId) {
                const { error } = await (supabase.from('pet_vaccines' as any).update(payload as any).eq('id', editingId) as any)
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
        setApplicationDate(format(new Date(), 'yyyy-MM-dd'))
        setNextDoseDate('')
        setBatchNumber('')
        setVeterinarian('Dr. Cleyton Chaves')
        setNotes('')
        setEditingId(null)
    }

    const handleEdit = (record: Vaccine) => {
        setVaccineName(record.vaccine_name)
        setApplicationDate(record.application_date)
        setNextDoseDate(record.next_dose_date || '')
        setBatchNumber(record.batch_number || '')
        setVeterinarian(record.veterinarian || 'Dr. Cleyton Chaves')
        setNotes(record.notes || '')
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
            toast.error(error.message || 'Erro ao excluir registro')
        }
    }

    // Generate auth code for QR
    const authCode = `VAC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const previewContent = (
        <div className="flex flex-col h-full border-2 border-green-100 rounded-lg p-10 bg-white">
            {/* Cabeçalho com Selo de Autenticidade */}
            <div className="flex justify-between items-start border-b-2 border-green-500 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-green-700 tracking-tight">CERTIFICADO DE VACINAÇÃO</h1>
                    <p className="text-sm text-gray-500 mt-1 uppercase font-semibold">Registro de Imunização Veterinária</p>
                </div>
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-2 border-green-200">
                    <div className="text-green-600 text-2xl">💉</div>
                </div>
            </div>

            {/* Info do Paciente em Grid */}
            <div className="grid grid-cols-2 gap-6 mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Paciente</p>
                    <p className="text-lg font-bold text-gray-800">{petName}</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Espécie / Raça</p>
                    <p className="text-lg text-gray-700">{pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'} - {pet?.breed}</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Proprietário</p>
                    <p className="text-lg text-gray-700">{owner?.fullName || 'Proprietário S/R'}</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Data de Nascimento</p>
                    <p className="text-lg text-gray-700">{pet?.dateOfBirth ? format(new Date(pet.dateOfBirth), 'dd/MM/yyyy') : '-'}</p>
                </div>
            </div>

            {/* Tabela de Vacinas */}
            <div className="flex-grow">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Histórico de Vacinação</h2>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="py-3 text-[11px] font-bold text-gray-400 uppercase">Vacina/Aplicação</th>
                            <th className="py-3 text-[11px] font-bold text-gray-400 uppercase">Data</th>
                            <th className="py-3 text-[11px] font-bold text-gray-400 uppercase text-right">Próxima Dose</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Mostrar vacina atual sendo editada */}
                        {vaccineName && (
                            <tr className="border-b border-gray-50 bg-green-50">
                                <td className="py-4 font-semibold text-gray-800">{vaccineName}</td>
                                <td className="py-4 text-gray-600">{format(new Date(applicationDate), 'dd/MM/yyyy')}</td>
                                <td className="py-4 text-right font-bold text-green-600">{nextDoseDate ? format(new Date(nextDoseDate), 'dd/MM/yyyy') : '-'}</td>
                            </tr>
                        )}
                        {/* Mostrar vacinas já registradas */}
                        {records.map((record) => (
                            <tr key={record.id} className="border-b border-gray-50">
                                <td className="py-4 font-semibold text-gray-800">{record.vaccine_name}</td>
                                <td className="py-4 text-gray-600">{format(new Date(record.application_date), 'dd/MM/yyyy')}</td>
                                <td className="py-4 text-right font-bold text-green-600">
                                    {record.next_dose_date ? format(new Date(record.next_dose_date), 'dd/MM/yyyy') : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Rodapé com Assinatura e QR Code */}
            <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-end">
                <div className="text-center">
                    <div className="w-48 border-b border-gray-400 mb-2"></div>
                    <p className="text-[12px] font-bold text-gray-800">{veterinarian || 'Dr. Cleyton Chaves'}</p>
                    <p className="text-[10px] text-gray-500 italic">Médico Veterinário - CRMV-SP</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded mb-1 flex items-center justify-center border border-gray-200">
                        <span className="text-[8px] text-gray-400 font-mono">QR</span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-mono">AUTENTICIDADE: {authCode}</p>
                </div>
            </div>
        </div>
    )

    return (
        <BaseAttendanceDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Vacinação"
            previewContent={previewContent}
            onSave={handleSave}
            saveLabel="Registrar Vacina"
            isSaving={loading}
            printTitle={`Vacina_${petName}_${format(new Date(), 'dd_MM_yyyy')}`}
            onBack={onBack}
        >
            <div className="space-y-6 bg-slate-50/50 p-6 rounded-lg">
                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Vacina *</Label>
                        <Input
                            value={vaccineName}
                            onChange={(e) => setVaccineName(e.target.value)}
                            placeholder="Ex: V8 ou Antirrábica"
                            className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-bold text-slate-600 font-semibold">Data de Aplicação *</Label>
                            <Input
                                type="date"
                                value={applicationDate}
                                onChange={(e) => setApplicationDate(e.target.value)}
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-slate-600 font-semibold">Próxima Dose</Label>
                            <Input
                                type="date"
                                value={nextDoseDate}
                                onChange={(e) => setNextDoseDate(e.target.value)}
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-bold text-slate-600 font-semibold">Lote</Label>
                            <Input
                                value={batchNumber}
                                onChange={(e) => setBatchNumber(e.target.value)}
                                placeholder="Número do lote"
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-slate-600 font-semibold">Veterinário</Label>
                            <Input
                                value={veterinarian}
                                onChange={(e) => setVeterinarian(e.target.value)}
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Observações</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Reações, recomendações..."
                            className="min-h-[80px] bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                        />
                    </div>
                </div>

                {/* Histórico de Vacinas */}
                {records.length > 0 && (
                    <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 font-semibold">Histórico de Vacinas</h3>
                        <div className="space-y-2">
                            {records.map((record) => (
                                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-slate-200">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{record.vaccine_name}</p>
                                        <p className="text-xs text-gray-600">
                                            {format(new Date(record.application_date), 'dd/MM/yyyy')}
                                            {record.next_dose_date && ` • Próxima: ${format(new Date(record.next_dose_date), 'dd/MM/yyyy')}`}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(record)}
                                            className="h-8 px-2 border-slate-200 hover:bg-slate-100"
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(record.id)}
                                            className="h-8 px-2 text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Billing Section */}
                <div className="p-4 rounded-xl border border-white/50 shadow-sm bg-white/80 space-y-3">
                    <div className="flex items-center gap-2 text-green-700 font-bold text-xs uppercase tracking-wider">
                        💉 Serviços e Faturamento
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-slate-600 font-semibold">Valor da Vacinação (R$)</Label>
                            <Input
                                type="number"
                                value={baseValue}
                                onChange={(e) => setBaseValue(e.target.value)}
                                className="h-8 text-sm bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                    </div>
                    <div className="pt-2 border-t border-green-200 flex justify-between items-center text-sm font-bold text-green-700">
                        <span>Total:</span>
                        <span>R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </BaseAttendanceDialog>
    )
}
