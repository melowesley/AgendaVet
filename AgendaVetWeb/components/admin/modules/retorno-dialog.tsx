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
import { toast } from 'sonner'
import { CalendarClock, RotateCcw, Save, ArrowLeft, Printer, Calendar, User, FileText, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })

interface RetornoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

const RETORNO_REASONS = [
    'Reavaliação Clínica',
    'Retorno Pós-Cirúrgico',
    'Acompanhamento de Tratamento',
    'Retorno Vacinal',
    'Revisão de Exames',
    'Avaliação Laboratorial',
    'Retorno Nutricional',
    'Acompanhamento Comportamental',
]

export function RetornoDialog({ open, onOpenChange, onBack, petId, petName }: RetornoDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')

    const [loading, setLoading] = useState(false)
    const [retornoDate, setRetornoDate] = useState('')
    const [retornoTime, setRetornoTime] = useState('')
    const [retornoReason, setRetornoReason] = useState('')
    const [recomendacoes, setRecomendacoes] = useState('')
    const [veterinarian, setVeterinarian] = useState('Dr. Cleyton Chaves')

    const printRef = useRef<HTMLDivElement>(null)
    
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Confirmacao_Retorno_${petName}_${format(new Date(), 'dd_MM_yyyy')}`,
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

    useEffect(() => {
        // Set default date to 7 days from now
        const defaultDate = new Date()
        defaultDate.setDate(defaultDate.getDate() + 7)
        setRetornoDate(format(defaultDate, 'yyyy-MM-dd'))
        setRetornoTime('10:00')
    }, [])

    const handleSave = async () => {
        if (!retornoDate || !retornoTime || !retornoReason) {
            toast.error('Preencha todos os campos obrigatórios')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const description = {
                dataRetorno: retornoDate,
                horaRetorno: retornoTime,
                motivo: retornoReason,
                recomendacoes,
                veterinarian,
            }

            const { error } = await (supabase.from('medical_records' as any).insert([{
                pet_id: petId,
                user_id: userData.user?.id,
                type: 'retorno',
                title: `Retorno Agendado - ${retornoReason}`,
                description: JSON.stringify(description),
                date: new Date().toISOString(),
                veterinarian: veterinarian,
            }] as any) as any)

            if (error) throw error

            mutate('medical-records')
            toast.success('Retorno agendado com sucesso!')
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao agendar retorno')
        } finally {
            setLoading(false)
        }
    }

    const previewContent = (
        <div className="space-y-8">
            {/* Cabeçalho */}
            <div className="text-center border-b-2 border-blue-600 pb-6">
                <h1 className="text-3xl font-bold mb-2 text-blue-600 flex items-center justify-center gap-3">
                    <CalendarClock className="w-8 h-8 text-blue-600" />
                    CONFIRMAÇÃO DE RETORNO
                </h1>
                <p className="text-lg text-gray-700">AgendaVet Medical Unit v2.0</p>
                <p className="text-sm text-gray-500">Centro de Saúde e Bem-Estar Animal</p>
                <p className="text-xs mt-2">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>

            {/* Card Centralizado com Data e Hora */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-8 shadow-lg text-center">
                <h3 className="text-xl font-bold mb-4 text-blue-600">PRÓXIMA CONSULTA</h3>
                <div className="space-y-4">
                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-md">
                        <div className="text-4xl font-black text-blue-700 mb-2">
                            {retornoDate ? format(new Date(retornoDate), 'dd/MM/yyyy') : 'DD/MM/YYYY'}
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                            {retornoTime || 'HH:MM'}
                        </div>
                    </div>
                    <div className="text-lg font-semibold text-gray-700">
                        {retornoReason || 'Motivo do retorno'}
                    </div>
                </div>
            </div>

            {/* Cards de Informações */}
            <div className="grid grid-cols-2 gap-6">
                {/* Card DADOS DO PET */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-blue-600 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        DADOS DO PET
                    </h3>
                    <div className="space-y-2">
                        <p><span className="font-bold">Nome:</span> {petName}</p>
                        <p><span className="font-bold">Espécie:</span> {pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'}</p>
                        <p><span className="font-bold">Raça:</span> {pet?.breed || 'Não informada'}</p>
                        <p><span className="font-bold">Idade:</span> {pet ? Math.floor((new Date().getTime() - new Date(pet.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) + ' anos' : ''}</p>
                        <p><span className="font-bold">Proprietário:</span> {owner?.fullName || 'Proprietário S/R'}</p>
                    </div>
                </div>

                {/* Card DETALHES DO RETORNO */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-blue-600 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        DETALHES DO RETORNO
                    </h3>
                    <div className="space-y-2">
                        <p><span className="font-bold">Veterinário:</span> {veterinarian}</p>
                        <p><span className="font-bold">Motivo:</span> {retornoReason || 'A ser definido'}</p>
                        <p><span className="font-bold">Data:</span> {retornoDate ? format(new Date(retornoDate), 'dd/MM/yyyy') : 'A definir'}</p>
                        <p><span className="font-bold">Horário:</span> {retornoTime || 'A definir'}</p>
                        <p><span className="font-bold">Agendado em:</span> {format(new Date(), 'dd/MM/yyyy')}</p>
                    </div>
                </div>
            </div>

            {/* Recomendações Pré-Retorno */}
            {recomendacoes && (
                <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
                    <h3 className="font-bold text-lg mb-3 text-blue-600">RECOMENDAÇÕES PRÉ-RETORNO</h3>
                    <div className="text-base leading-relaxed prose prose-sm max-w-none" 
                         dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(recomendacoes) }} />
                </div>
            )}

            {/* Orientações Gerais */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-lg mb-3 text-blue-600">ORIENTAÇÕES IMPORTANTES</h3>
                <div className="space-y-2 text-sm">
                    <p className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Compareça com 15 minutos de antecedência</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Traga a carteira de vacinação atualizada</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Em caso de impossibilidade, avise com 24h de antecedência</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Mantenha o pet em jejum se solicitado pelo veterinário</span>
                    </p>
                </div>
            </div>

            {/* Assinatura */}
            <div className="mt-12 pt-8 border-t-2 border-blue-600">
                <div className="text-center">
                    <div className="border-t-2 border-blue-600 w-80 mx-auto mb-2"></div>
                    <p className="font-bold text-lg text-blue-600">{veterinarian}</p>
                    <p className="text-sm">Médico Veterinário Responsável</p>
                    <p className="text-xs mt-2">CRMV: 12345-SP</p>
                    <p className="text-xs mt-1">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
                </div>
            </div>
        </div>
    )

    return (
        <BaseAttendanceDialog
            open={open}
            onOpenChange={onOpenChange}
            onBack={onBack}
            title="Agendar Retorno"
            previewContent={previewContent}
            onSave={handleSave}
            saveLabel="Agendar Retorno"
            isSaving={loading}
            printTitle={`Confirmacao_Retorno_${petName}_${format(new Date(), 'dd_MM_yyyy')}`}
        >
            <div className="space-y-6">
                {/* Data do Retorno */}
                <div>
                    <Label className="text-sm font-bold">Data do Retorno *</Label>
                    <Input
                        type="date"
                        value={retornoDate}
                        onChange={(e) => setRetornoDate(e.target.value)}
                        className="h-9"
                    />
                </div>

                {/* Horário do Retorno */}
                <div>
                    <Label className="text-sm font-bold">Horário do Retorno *</Label>
                    <Input
                        type="time"
                        value={retornoTime}
                        onChange={(e) => setRetornoTime(e.target.value)}
                        className="h-9"
                    />
                </div>

                {/* Motivo do Retorno */}
                <div>
                    <Label className="text-sm font-bold">Motivo do Retorno *</Label>
                    <Select value={retornoReason} onValueChange={setRetornoReason}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione o motivo" />
                        </SelectTrigger>
                        <SelectContent>
                            {RETORNO_REASONS.map((reason) => (
                                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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

                {/* Rich Text Editor para Recomendações */}
                <div>
                    <Label className="text-sm font-bold">Recomendações Pré-Retorno</Label>
                    <div className="border border-gray-200 rounded-lg">
                        <ReactQuill
                            value={recomendacoes}
                            onChange={setRecomendacoes}
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
                            placeholder="Descreva recomendações importantes para o próximo retorno: jejum, exames a trazer, medicamentos, preparações especiais..."
                        />
                    </div>
                </div>
            </div>
        </BaseAttendanceDialog>
    )
}
