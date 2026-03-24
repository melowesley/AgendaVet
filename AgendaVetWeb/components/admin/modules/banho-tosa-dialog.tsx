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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Scissors, Save, ArrowLeft, Printer, DollarSign, Plus, Trash2, Brush, Sparkles, AlertCircle, PawPrint, Clock, History, Waves, User, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })

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
    const { records: allRecords } = useMedicalRecords(petId)

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
    
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Certificado_Estetica_${petName}_${format(new Date(), 'dd_MM_yyyy')}`,
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

    const previewContent = (
        <div className="space-y-8">
            {/* Cabeçalho */}
            <div className="text-center border-b-2 border-blue-600 pb-6">
                <h1 className="text-3xl font-bold mb-2 text-blue-600 flex items-center justify-center gap-3">
                    <Scissors className="w-8 h-8 text-blue-600" />
                    CERTIFICADO DE ESTÉTICA ANIMAL
                </h1>
                <p className="text-lg text-gray-700">AgendaVet Medical Unit v2.0</p>
                <p className="text-sm text-gray-500">Centro de Estética e Bem-Estar Animal</p>
                <p className="text-xs mt-2">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>

            {/* Cards de Dados */}
            <div className="grid grid-cols-2 gap-6">
                {/* Card DADOS DO PET */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-blue-600 flex items-center gap-2">
                        <PawPrint className="w-5 h-5" />
                        DADOS DO PET
                    </h3>
                    <div className="space-y-2">
                        <p><span className="font-bold">Nome:</span> {petName}</p>
                        <p><span className="font-bold">Espécie:</span> {pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'}</p>
                        <p><span className="font-bold">Raça:</span> {pet?.breed || 'Não informada'}</p>
                        <p><span className="font-bold">Idade:</span> {pet ? Math.floor((new Date().getTime() - new Date(pet.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) + ' anos' : ''}</p>
                        <p><span className="font-bold">Sexo:</span> {pet?.gender === 'Macho' ? 'Macho' : pet?.gender === 'Fêmea' ? 'Fêmea' : 'Não informado'}</p>
                        <p><span className="font-bold">Proprietário:</span> {owner?.fullName || 'Proprietário S/R'}</p>
                    </div>
                </div>

                {/* Card SERVIÇOS REALIZADOS */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-blue-600 flex items-center gap-2">
                        <Waves className="w-5 h-5" />
                        SERVIÇOS REALIZADOS
                    </h3>
                    <div className="space-y-2">
                        {selectedServices.length > 0 ? (
                            selectedServices.map((service, index) => (
                                <p key={index} className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                    {service}
                                </p>
                            ))
                        ) : (
                            <p className="text-gray-500 italic">Nenhum serviço selecionado</p>
                        )}
                        <div className="pt-2 border-t border-blue-200">
                            <p><span className="font-bold">Profissional:</span> {profissional}</p>
                            <p><span className="font-bold">Data:</span> {format(new Date(date), 'dd/MM/yyyy')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Avaliação da Pele e Condições */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-lg mb-3 text-blue-600">AVALIAÇÃO DA PELE E CONDIÇÕES</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p><span className="font-bold">Estado da Pele:</span> {estadoPele || 'Não avaliado'}</p>
                        <p><span className="font-bold">Presença de Parasitas:</span> {presencaParasitas ? 'Sim' : 'Não'}</p>
                    </div>
                    <div>
                        <p><span className="font-bold">Presença de Nós:</span> {presencaNos ? 'Sim' : 'Não'}</p>
                    </div>
                </div>
            </div>

            {/* Observações do Esteticista */}
            {observacoes && (
                <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
                    <h3 className="font-bold text-lg mb-3 text-blue-600">OBSERVAÇÕES DO ESTETICISTA</h3>
                    <div className="text-base leading-relaxed prose prose-sm max-w-none" 
                         dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(observacoes) }} />
                </div>
            )}

            {/* Assinatura */}
            <div className="mt-12 pt-8 border-t-2 border-blue-600">
                <div className="text-center">
                    <div className="border-t-2 border-blue-600 w-80 mx-auto mb-2"></div>
                    <p className="font-bold text-lg text-blue-600">{profissional}</p>
                    <p className="text-sm">Especialista em Estética Animal</p>
                    <p className="text-xs mt-2">AgendaVet Grooming Specialist</p>
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
            title="Banho & Estética"
            previewContent={previewContent}
            onSave={handleSave}
            saveLabel="Finalizar Estética"
            isSaving={loading}
            printTitle={`Certificado_Estetica_${petName}_${format(new Date(), 'dd_MM_yyyy')}`}
        >
            <div className="space-y-6">
                {/* Data do Serviço */}
                <div>
                    <Label className="text-sm font-bold">Data do Serviço *</Label>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-9"
                    />
                </div>

                {/* Serviços Disponíveis */}
                <div>
                    <Label className="text-sm font-bold">Serviços Realizados *</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        {GROOMING_SERVICES.map((service) => (
                            <div key={service} className="flex items-center space-x-2">
                                <Checkbox
                                    id={service}
                                    checked={selectedServices.includes(service)}
                                    onCheckedChange={() => toggleService(service)}
                                />
                                <Label htmlFor={service} className="text-sm cursor-pointer">
                                    {service}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Avaliação da Pele */}
                <div>
                    <Label className="text-sm font-bold">Estado da Pele</Label>
                    <Input
                        value={estadoPele}
                        onChange={(e) => setEstadoPele(e.target.value)}
                        placeholder="Ex: Saudável, Ressecada, Oleosa, Irritada..."
                        className="h-9"
                    />
                </div>

                {/* Condições Especiais */}
                <div className="space-y-3">
                    <Label className="text-sm font-bold">Condições Observadas</Label>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="parasitas"
                            checked={presencaParasitas}
                            onCheckedChange={(checked) => setPresencaParasitas(checked as boolean)}
                        />
                        <Label htmlFor="parasitas" className="text-sm cursor-pointer">
                            Presença de Ectoparasitas
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="nos"
                            checked={presencaNos}
                            onCheckedChange={(checked) => setPresencaNos(checked as boolean)}
                        />
                        <Label htmlFor="nos" className="text-sm cursor-pointer">
                            Presença de Nós/Emaranhados
                        </Label>
                    </div>
                </div>

                {/* Rich Text Editor para Observações */}
                <div>
                    <Label className="text-sm font-bold">Observações do Esteticista</Label>
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
                            placeholder="Descreva observações sobre o comportamento do pet, reações durante o banho, condições especiais da pele, recomendações..."
                        />
                    </div>
                </div>

                {/* Profissional Responsável */}
                <div>
                    <Label className="text-sm font-bold">Profissional Responsável</Label>
                    <Input
                        value={profissional}
                        onChange={(e) => setProfissional(e.target.value)}
                        placeholder="Nome do profissional"
                        className="h-9"
                    />
                </div>
            </div>
        </BaseAttendanceDialog>
    )
}
