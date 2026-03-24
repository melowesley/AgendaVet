'use client'

import { useState, useEffect } from 'react'
import { usePet, useOwner, supabase } from '@/lib/data-store'
import { mutate } from 'swr'
import { BaseAttendanceDialog } from '../shared/base-attendance-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, DollarSign, Activity, Users, Clock, Calendar, FileText, Shield, Stethoscope, Scissors, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })

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
    'Ácido poliglicólico', 'Catgut cromado', 'Fio de aço'
]

export function CirurgiaDialog({ open, onOpenChange, onBack, petId, petName }: CirurgiaDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')

    // Estado do formulário
    const [procedimento, setProcedimento] = useState('')
    const [dataCirurgia, setDataCirurgia] = useState(format(new Date(), 'dd/MM/yyyy'))
    const [horario, setHorario] = useState('08:00')
    const [tipoAnestesia, setTipoAnestesia] = useState('')
    const [anestesista, setAnestesista] = useState('Dr. Cleyton Chaves')
    const [cirurgiao, setCirurgiao] = useState('Dr. Cleyton Chaves')
    const [auxiliares, setAuxiliares] = useState('')
    const [tecnicaCirurgica, setTecnicaCirurgica] = useState('')
    const [descricao, setDescricao] = useState('')
    const [posOperatorio, setPosOperatorio] = useState('')
    const [termoConsentimento, setTermoConsentimento] = useState(false)

    // Estado de materiais e fármacos (ERP)
    const [materiais, setMateriais] = useState([
        { nome: '', quantidade: '', valor: '' }
    ])
    const [farmacos, setFarmacos] = useState([
        { nome: '', dosagem: '', quantidade: '', valor: '' }
    ])

    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        if (!procedimento.trim()) return
        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            const recordData = {
                pet_id: petId,
                type: 'surgery',
                date: format(new Date(), 'yyyy-MM-dd'),
                description: `Cirurgia: ${procedimento}`,
                notes: JSON.stringify({
                    procedimento,
                    dataCirurgia,
                    horario,
                    tipoAnestesia,
                    anestesista,
                    cirurgiao,
                    auxiliares,
                    tecnicaCirurgica,
                    descricao,
                    posOperatorio,
                    termoConsentimento,
                    materiais: materiais.filter(m => m.nome),
                    farmacos: farmacos.filter(f => f.nome),
                }),
                veterinarian: cirurgiao,
                user_id: userData.user?.id,
                created_by: userData.user?.id,
            }
            const { error } = await (supabase.from('medical_records' as any).insert([recordData] as any) as any)
            if (error) throw error
            mutate('medical-records')
            onOpenChange(false)
        } catch (err) {
            console.error('Erro ao salvar cirurgia:', err)
        } finally {
            setLoading(false)
        }
    }

    const addMaterial = () => {
        setMateriais([...materiais, { nome: '', quantidade: '', valor: '' }])
    }

    const removeMaterial = (index: number) => {
        setMateriais(materiais.filter((_, i) => i !== index))
    }

    const updateMaterial = (index: number, field: string, value: string) => {
        const updated = [...materiais]
        updated[index] = { ...updated[index], [field]: value }
        setMateriais(updated)
    }

    const addFarmaco = () => {
        setFarmacos([...farmacos, { nome: '', dosagem: '', quantidade: '', valor: '' }])
    }

    const removeFarmaco = (index: number) => {
        setFarmacos(farmacos.filter((_, i) => i !== index))
    }

    const updateFarmaco = (index: number, field: string, value: string) => {
        const updated = [...farmacos]
        updated[index] = { ...updated[index], [field]: value }
        setFarmacos(updated)
    }

    const previewContent = (
        <div className="space-y-8">
            {/* Cabeçalho com Logo */}
            <div className="flex justify-between items-start border-b-2 border-blue-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-blue-600 mb-2 flex items-center gap-3">
                        <Scissors className="w-8 h-8 text-blue-600" />
                        RELATÓRIO CIRÚRGICO
                    </h1>
                    <p className="text-lg text-gray-700">AgendaVet Surgical Hub</p>
                    <p className="text-sm text-gray-500">Centro de Excelência Cirúrgica Veterinária</p>
                </div>
                <div className="text-right">
                    <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-xs text-gray-500">Código: {format(new Date(), 'yyyyMMddHHmm')}</p>
                </div>
            </div>

            {/* Cards de Informações */}
            <div className="grid grid-cols-2 gap-6">
                {/* Card Dados do Paciente */}
                <Card className="shadow-sm border-blue-100">
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                        <CardTitle className="text-lg font-bold text-blue-600 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            DADOS DO PACIENTE
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Nome:</p>
                                <p className="text-base font-medium">{petName}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Espécie:</p>
                                <p className="text-base">{pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Raça:</p>
                                <p className="text-base">{pet?.breed}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Idade:</p>
                                <p className="text-base">{pet ? Math.floor((new Date().getTime() - new Date(pet.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) + ' anos' : ''}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-600">Proprietário:</p>
                            <p className="text-base font-medium">{owner?.fullName || 'Proprietário S/R'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Card Logística da Cirurgia */}
                <Card className="shadow-sm border-blue-100">
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                        <CardTitle className="text-lg font-bold text-blue-600 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            LOGÍSTICA DA CIRURGIA
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Procedimento:</p>
                                <p className="text-base font-medium">{procedimento || 'A ser definido'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Data:</p>
                                <p className="text-base">{dataCirurgia}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Horário:</p>
                                <p className="text-base">{horario}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Tipo de Anestesia:</p>
                                <p className="text-base">{tipoAnestesia || 'A ser definido'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Card Equipe Cirúrgica */}
            <Card className="shadow-sm border-blue-100">
                <CardHeader className="bg-blue-50 border-b border-blue-100">
                    <CardTitle className="text-lg font-bold text-blue-600 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        EQUIPE CIRÚRGICA
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Stethoscope className="w-6 h-6 text-blue-600" />
                            </div>
                            <p className="text-sm font-semibold text-gray-600">Cirurgião:</p>
                            <p className="text-base font-medium">{cirurgiao}</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Activity className="w-6 h-6 text-blue-600" />
                            </div>
                            <p className="text-sm font-semibold text-gray-600">Anestesista:</p>
                            <p className="text-base font-medium">{anestesista}</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <p className="text-sm font-semibold text-gray-600">Auxiliares:</p>
                            <p className="text-base font-medium">{auxiliares || 'A ser definido'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Técnica Operatória com Rich Text */}
            <Card className="shadow-sm border-blue-100">
                <CardHeader className="bg-blue-50 border-b border-blue-100">
                    <CardTitle className="text-lg font-bold text-blue-600">TÉCNICA OPERATÓRIA</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div 
                        className="text-base leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: tecnicaCirurgica || '<p>Descrição detalhada da técnica cirúrgica utilizada...</p>' }}
                    />
                </CardContent>
            </Card>

            {/* Descrição do Procedimento */}
            <Card className="shadow-sm border-blue-100">
                <CardHeader className="bg-blue-50 border-b border-blue-100">
                    <CardTitle className="text-lg font-bold text-blue-600">DESCRIÇÃO DO PROCEDIMENTO</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div 
                        className="text-base leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(descricao || '<p>Descrição detalhada do procedimento cirúrgico realizado...</p>') }}
                    />
                </CardContent>
            </Card>

            {/* Pós-Operatório */}
            <Card className="shadow-sm border-blue-100">
                <CardHeader className="bg-blue-50 border-b border-blue-100">
                    <CardTitle className="text-lg font-bold text-blue-600">CUIDADOS PÓS-OPERATÓRIOS</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <p className="text-base leading-relaxed">
                        {posOperatorio || 'Instruções detalhadas para o período pós-operatório...'}
                    </p>
                </CardContent>
            </Card>

            {/* Materiais Utilizados */}
            {materiais.some(m => m.nome) && (
                <Card className="shadow-sm border-blue-100">
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                        <CardTitle className="text-lg font-bold text-blue-600">MATERIAIS UTILIZADOS</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-blue-200">
                                    <th className="text-left py-2 font-semibold text-gray-700">Material</th>
                                    <th className="text-center py-2 font-semibold text-gray-700">Quantidade</th>
                                    <th className="text-right py-2 font-semibold text-gray-700">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materiais.filter(m => m.nome).map((material, index) => (
                                    <tr key={index} className="border-b border-blue-100">
                                        <td className="py-2">{material.nome}</td>
                                        <td className="text-center py-2">{material.quantidade}</td>
                                        <td className="text-right py-2">{material.valor}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* Fármacos Utilizados */}
            {farmacos.some(f => f.nome) && (
                <Card className="shadow-sm border-blue-100">
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                        <CardTitle className="text-lg font-bold text-blue-600">FÁRMACOS UTILIZADOS</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-blue-200">
                                    <th className="text-left py-2 font-semibold text-gray-700">Fármaco</th>
                                    <th className="text-center py-2 font-semibold text-gray-700">Dosagem</th>
                                    <th className="text-center py-2 font-semibold text-gray-700">Quantidade</th>
                                    <th className="text-right py-2 font-semibold text-gray-700">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {farmacos.filter(f => f.nome).map((farmaco, index) => (
                                    <tr key={index} className="border-b border-blue-100">
                                        <td className="py-2">{farmaco.nome}</td>
                                        <td className="text-center py-2">{farmaco.dosagem}</td>
                                        <td className="text-center py-2">{farmaco.quantidade}</td>
                                        <td className="text-right py-2">{farmaco.valor}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* Assinaturas */}
            <div className="mt-12 pt-8 border-t-2 border-blue-200">
                <div className="grid grid-cols-2 gap-8">
                    <div className="text-center">
                        <div className="border-t-2 border-blue-600 w-64 mx-auto mb-2"></div>
                        <p className="font-bold text-blue-600">{cirurgiao}</p>
                        <p className="text-sm">Cirurgião Responsável</p>
                        <p className="text-xs mt-2 text-gray-500">CRMV: 12345-SP</p>
                    </div>
                    <div className="text-center">
                        <div className="border-t-2 border-blue-600 w-64 mx-auto mb-2"></div>
                        <p className="font-bold text-blue-600">{owner?.fullName || 'Proprietário'}</p>
                        <p className="text-sm">Proprietário Responsável</p>
                        <p className="text-xs mt-2 text-gray-500">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
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
            title="Relatório Cirúrgico"
            previewContent={previewContent}
            onSave={handleSave}
            saveLabel="Salvar Cirurgia"
            isSaving={loading}
            printTitle={`Relatorio_Cirurgico_${petName}_${format(new Date(), 'dd_MM_yyyy')}`}
        >
            <div className="space-y-6 bg-slate-50/50 p-6 rounded-lg">
                {/* Dados Básicos */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-bold flex items-center gap-2 text-slate-600 font-semibold">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            Procedimento Cirúrgico *
                        </Label>
                        <Input
                            value={procedimento}
                            onChange={(e) => setProcedimento(e.target.value)}
                            placeholder="Ex: Ovariohisterectomia"
                            className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-bold flex items-center gap-2 text-slate-600 font-semibold">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                Data *
                            </Label>
                            <Input
                                value={dataCirurgia}
                                onChange={(e) => setDataCirurgia(e.target.value)}
                                placeholder="dd/mm/yyyy"
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold flex items-center gap-2 text-slate-600 font-semibold">
                                <Clock className="w-4 h-4 text-blue-600" />
                                Horário *
                            </Label>
                            <Input
                                value={horario}
                                onChange={(e) => setHorario(e.target.value)}
                                placeholder="HH:mm"
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Anestesia */}
                <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <Activity className="w-5 h-5" />
                        Anestesia
                    </h3>
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Tipo de Anestesia</Label>
                        <Select value={tipoAnestesia} onValueChange={setTipoAnestesia}>
                            <SelectTrigger className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIPOS_ANESTESIA.map((tipo) => (
                                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-bold flex items-center gap-2 text-slate-600 font-semibold">
                                <Stethoscope className="w-4 h-4 text-blue-600" />
                                Anestesista
                            </Label>
                            <Input
                                value={anestesista}
                                onChange={(e) => setAnestesista(e.target.value)}
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold flex items-center gap-2 text-slate-600 font-semibold">
                                <Stethoscope className="w-4 h-4 text-blue-600" />
                                Cirurgião
                            </Label>
                            <Input
                                value={cirurgiao}
                                onChange={(e) => setCirurgiao(e.target.value)}
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-sm font-bold flex items-center gap-2 text-slate-600 font-semibold">
                            <Users className="w-4 h-4 text-blue-600" />
                            Auxiliares
                        </Label>
                        <Input
                            value={auxiliares}
                            onChange={(e) => setAuxiliares(e.target.value)}
                            placeholder="Nome dos auxiliares cirúrgicos"
                            className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                        />
                    </div>
                </div>

                {/* Técnica Cirúrgica com Rich Text Editor */}
                <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <FileText className="w-5 h-5" />
                        Técnica Cirúrgica
                    </h3>
                    <div className="border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
                        <ReactQuill
                            value={tecnicaCirurgica}
                            onChange={setTecnicaCirurgica}
                            theme="snow"
                            modules={{
                                toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline'],
                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                    ['clean']
                                ],
                            }}
                            style={{ height: '200px' }}
                        />
                    </div>
                </div>

                {/* Descrição e Pós-Operatório */}
                <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <FileText className="w-5 h-5" />
                        Detalhes do Procedimento
                    </h3>
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Descrição do Procedimento</Label>
                        <div className="border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
                            <ReactQuill
                                value={descricao}
                                onChange={setDescricao}
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
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-sm font-bold">Cuidados Pós-Operatórios</Label>
                        <Textarea
                            value={posOperatorio}
                            onChange={(e) => setPosOperatorio(e.target.value)}
                            placeholder="Instruções para o período pós-operatório"
                            className="min-h-[80px]"
                        />
                    </div>
                </div>

                {/* Materiais (ERP) */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <DollarSign className="w-5 h-5" />
                        Lançamento de Materiais
                    </h3>
                    {materiais.map((material, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2">
                            <Input
                                value={material.nome}
                                onChange={(e) => updateMaterial(index, 'nome', e.target.value)}
                                placeholder="Material"
                                className="h-9"
                            />
                            <Input
                                value={material.quantidade}
                                onChange={(e) => updateMaterial(index, 'quantidade', e.target.value)}
                                placeholder="Qtd"
                                className="h-9"
                            />
                            <Input
                                value={material.valor}
                                onChange={(e) => updateMaterial(index, 'valor', e.target.value)}
                                placeholder="Valor"
                                className="h-9"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeMaterial(index)}
                                className="h-9"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addMaterial}
                        className="w-full h-9"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Material
                    </Button>
                </div>

                {/* Fármacos (ERP) */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <DollarSign className="w-5 h-5" />
                        Lançamento de Fármacos
                    </h3>
                    {farmacos.map((farmaco, index) => (
                        <div key={index} className="grid grid-cols-5 gap-2">
                            <Input
                                value={farmaco.nome}
                                onChange={(e) => updateFarmaco(index, 'nome', e.target.value)}
                                placeholder="Fármaco"
                                className="h-9"
                            />
                            <Input
                                value={farmaco.dosagem}
                                onChange={(e) => updateFarmaco(index, 'dosagem', e.target.value)}
                                placeholder="Dosagem"
                                className="h-9"
                            />
                            <Input
                                value={farmaco.quantidade}
                                onChange={(e) => updateFarmaco(index, 'quantidade', e.target.value)}
                                placeholder="Qtd"
                                className="h-9"
                            />
                            <Input
                                value={farmaco.valor}
                                onChange={(e) => updateFarmaco(index, 'valor', e.target.value)}
                                placeholder="Valor"
                                className="h-9"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeFarmaco(index)}
                                className="h-9"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addFarmaco}
                        className="w-full h-9"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Fármaco
                    </Button>
                </div>

                {/* Termo de Consentimento */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="consentimento"
                            checked={termoConsentimento}
                            onCheckedChange={(checked) => setTermoConsentimento(checked as boolean)}
                        />
                        <Label htmlFor="consentimento" className="text-sm">
                            Termo de consentimento assinado pelo proprietário
                        </Label>
                    </div>
                </div>
            </div>
        </BaseAttendanceDialog>
    )
}
