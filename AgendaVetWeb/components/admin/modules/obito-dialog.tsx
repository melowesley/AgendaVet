'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase, usePet, useOwner, useMedicalRecords } from '@/lib/data-store'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css'
import { BaseAttendanceDialog } from '../shared/base-attendance-dialog'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Skull, Save, ArrowLeft, Printer, DollarSign, Plus, Trash2, Heart, Clock, Calendar, User, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })

interface ObitoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

export function ObitoDialog({ open, onOpenChange, onBack, petId, petName }: ObitoDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')
    const { records: allRecords } = useMedicalRecords(petId)

    const isMale = pet?.gender === 'Macho'
    const themeColor = {
        bg: 'bg-zinc-800', // Sober for death
        bgHover: 'hover:bg-zinc-900',
        bgGhost: 'bg-zinc-500/10',
        text: 'text-zinc-800',
        border: 'border-zinc-500',
    }

    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [time, setTime] = useState(format(new Date(), 'HH:mm'))
    const [causa, setCausa] = useState('')
    const [observacoes, setObservacoes] = useState('')
    const [veterinarian, setVeterinarian] = useState('Dr. Cleyton Chaves')

    // Billing state
    const [baseValue, setBaseValue] = useState('0.00')
    const [services, setServices] = useState<{ id: string, name: string, value: number }[]>([])

    const printRef = useRef<HTMLDivElement>(null)
    
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Declaracao_Obito_${petName}_${format(new Date(), 'dd_MM_yyyy')}`,
        pageStyle: `
            @page { size: A4; margin: 0; }
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
                html { margin: 0; padding: 0; }
                .no-print { display: none !important; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
        `
    })

    const handleSave = async () => {
        if (!causa.trim()) {
            toast.error('Preencha a causa provável do óbito')
            return
        }

        const confirm = window.confirm(`Você está prestes a registrar o óbito de ${petName}. Esta ação é irreversível no prontuário. Confirmar?`)
        if (!confirm) return

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const description = {
                data_obito: date,
                hora_obito: time,
                causa,
                observacoes,
                billing: {
                    baseValue: parseFloat(baseValue),
                    services: services,
                    total: parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)
                }
            }

            const { error: recordError } = await (supabase.from('medical_records' as any).insert([{
                pet_id: petId,
                user_id: userData.user?.id,
                type: 'obito',
                title: 'Declaração de Óbito',
                description: JSON.stringify(description),
                date: new Date(`${date}T${time}`).toISOString(),
                veterinarian: veterinarian || 'Dr. Cleyton Chaves',
            }] as any) as any)

            if (recordError) throw recordError

            // Mark pet as deceased - assuming there's a status or similar in pets table
            // If there's no status field, we might need to add one or just rely on the record
            // For now, let's just save the record.

            mutate('medical-records')
            toast.success('Óbito registrado com sucesso.')
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao registrar óbito')
        } finally {
            setLoading(false)
        }
    }

    const previewContent = (
        <div className="space-y-8">
            {/* Cabeçalho Solene */}
            <div className="text-center border-b-2 border-slate-600 pb-6">
                <h1 className="text-3xl font-bold mb-2 text-slate-700 flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-slate-600" />
                    DECLARAÇÃO DE ÓBITO E ENCERRAMENTO DE FICHA
                </h1>
                <p className="text-lg text-gray-600">AgendaVet Medical Unit v2.0</p>
                <p className="text-sm text-gray-500">Centro de Saúde e Bem-Estar Animal</p>
                <p className="text-xs mt-2">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>

            {/* Cards de Dados */}
            <div className="grid grid-cols-2 gap-6">
                {/* Card DADOS DO PACIENTE */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-blue-400 flex items-center gap-2">
                        <Heart className="w-5 h-5" />
                        DADOS DO PACIENTE
                    </h3>
                    <div className="space-y-2">
                        <p><span className="font-bold">Nome:</span> {petName}</p>
                        <p><span className="font-bold">Espécie:</span> {pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'}</p>
                        <p><span className="font-bold">Raça:</span> {pet?.breed || 'Não informada'}</p>
                        <p><span className="font-bold">Idade:</span> {pet ? Math.floor((new Date().getTime() - new Date(pet.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) + ' anos' : ''}</p>
                        <p><span className="font-bold">Sexo:</span> {pet?.gender === 'Macho' ? 'Macho' : pet?.gender === 'Fêmea' ? 'Fêmea' : 'Não informado'}</p>
                    </div>
                </div>

                {/* Card DADOS DO PROPRIETÁRIO */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-blue-400 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        DADOS DO PROPRIETÁRIO
                    </h3>
                    <div className="space-y-2">
                        <p><span className="font-bold">Nome:</span> {owner?.fullName || 'Proprietário S/R'}</p>
                        <p><span className="font-bold">Contato:</span> {owner?.phone || 'Não informado'}</p>
                        <p><span className="font-bold">Endereço:</span> {owner?.address || 'Não informado'}</p>
                        <p><span className="font-bold">CPF/CNPJ:</span> Não informado</p>
                    </div>
                </div>
            </div>

            {/* Informações do Óbito */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-lg mb-3 text-slate-600">INFORMAÇÕES DO ÓBITO</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p><span className="font-bold">Data do Óbito:</span> {date || 'A definir'}</p>
                        <p><span className="font-bold">Hora do Óbito:</span> {time || 'A definir'}</p>
                    </div>
                    <div>
                        <p><span className="font-bold">Causa Provável:</span> {causa || 'A ser determinada'}</p>
                        <p><span className="font-bold">Veterinário:</span> {veterinarian}</p>
                    </div>
                </div>
            </div>

            {/* Observações com Rich Text */}
            {observacoes && (
                <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
                    <h3 className="font-bold text-lg mb-3 text-slate-600">OBSERVAÇÕES E CIRCUNSTÂNCIAS</h3>
                    <div className="text-base leading-relaxed prose prose-sm max-w-none" 
                         dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(observacoes) }} />
                </div>
            )}

            {/* AUTORIZAÇÃO DE DESTINAÇÃO */}
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-lg mb-3 text-slate-600">AUTORIZAÇÃO DE DESTINAÇÃO</h3>
                <div className="space-y-4">
                    <p className="text-sm text-gray-700">
                        Eu, abaixo assinado, proprietário(a) do animal acima descrito, autorizo o procedimento de destinação final conforme orientação médica veterinária.
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-bold mb-2">Assinatura do Responsável:</p>
                            <div className="border-b-2 border-slate-400 h-12"></div>
                            <p className="text-xs text-gray-500 mt-1">Data: ___/___/_____</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold mb-2">Testemunha (se houver):</p>
                            <div className="border-b-2 border-slate-400 h-12"></div>
                            <p className="text-xs text-gray-500 mt-1">Data: ___/___/_____</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rodapé com Assinaturas */}
            <div className="mt-12 pt-8 border-t-2 border-slate-600">
                <div className="grid grid-cols-2 gap-8">
                    <div className="text-center">
                        <div className="border-t-2 border-slate-600 w-64 mx-auto mb-2"></div>
                        <p className="font-bold text-slate-700">{veterinarian}</p>
                        <p className="text-sm">Médico Veterinário Responsável</p>
                        <p className="text-xs mt-2">CRMV: 12345-SP</p>
                        <p className="text-xs mt-1">Carimbo e Assinatura</p>
                    </div>
                    <div className="text-center">
                        <div className="border-t-2 border-slate-600 w-64 mx-auto mb-2"></div>
                        <p className="font-bold text-slate-700">{owner?.fullName || 'Proprietário'}</p>
                        <p className="text-sm">Responsável pelo Animal</p>
                        <p className="text-xs mt-2">Assinatura</p>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <BaseAttendanceDialog
            open={open}
            onOpenChange={onOpenChange}
            onBack={onBack}
            title="Registro de Óbito"
            previewContent={previewContent}
            onSave={handleSave}
            saveLabel="Finalizar Registro"
            isSaving={loading}
            printTitle={`Declaracao_Obito_${petName}_${format(new Date(), 'dd_MM_yyyy')}`}
        >
            <div className="space-y-6">
                {/* Data e Hora */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-sm font-bold">Data do Óbito *</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="h-9"
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-bold">Hora do Óbito *</Label>
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="h-9"
                        />
                    </div>
                </div>

                {/* Causa Provável */}
                <div>
                    <Label className="text-sm font-bold">Causa Provável *</Label>
                    <Input
                        placeholder="Ex: Parada Cardiorrespiratória, Falência Múltipla..."
                        value={causa}
                        onChange={(e) => setCausa(e.target.value)}
                        className="h-9"
                    />
                </div>

                {/* Rich Text Editor para Observações */}
                <div>
                    <Label className="text-sm font-bold">Observações e Circunstâncias</Label>
                    <div className="border border-gray-200 rounded-lg">
                        <ReactQuill
                            value={observacoes}
                            onChange={setObservacoes}
                            theme="snow"
                            modules={{
                                toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline'],
                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                    ['clean']
                                ],
                            }}
                            style={{ height: '150px' }}
                            placeholder="Descreva as circunstâncias do óbito, procedimentos realizados, eutanásia (se houver), condutas finais..."
                        />
                    </div>
                </div>

                {/* Custos Finais */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-4 text-slate-600 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Custos Finais
                    </h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-sm">Taxa Base (R$)</Label>
                                <Input
                                    type="number"
                                    value={baseValue}
                                    onChange={(e) => setBaseValue(e.target.value)}
                                    className="h-8"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-8"
                                    onClick={() => setServices([...services, { id: Math.random().toString(), name: 'Taxa Adicional', value: 0 }])}
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Adicionar
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
                                    placeholder="Descrição"
                                    className="h-7 text-sm flex-1"
                                />
                                <Input
                                    type="number"
                                    value={service.value}
                                    onChange={(e) => {
                                        const newServices = [...services]
                                        newServices[idx].value = parseFloat(e.target.value) || 0
                                        setServices(newServices)
                                    }}
                                    className="h-7 text-sm w-16"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive"
                                    onClick={() => setServices(services.filter((_, i) => i !== idx))}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Veterinário Responsável */}
                <div>
                    <Label className="text-sm font-bold">Veterinário Responsável</Label>
                    <Input
                        value={veterinarian}
                        onChange={(e) => setVeterinarian(e.target.value)}
                        placeholder="Nome do veterinário"
                        className="h-9"
                    />
                </div>
            </div>
        </BaseAttendanceDialog>
    )
}
