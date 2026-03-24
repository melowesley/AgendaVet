import React, { useState, useEffect, useRef } from 'react'
import { supabase, usePet, useOwner, useMedicalRecords } from '@/lib/data-store'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css'
import { useReactToPrint } from 'react-to-print'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })

import { BaseAttendanceDialog } from '../shared/base-attendance-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ClipboardList, Save, Printer, DollarSign, Plus, Trash2, Bed, Activity, Thermometer, HeartPulse, History, PawPrint, Clock, Stethoscope, FileText, Calendar, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'

interface InternacaoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

export function InternacaoDialog({ open, onOpenChange, onBack, petId, petName }: InternacaoDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')
    const { records: allRecords } = useMedicalRecords(petId)

    const isMale = pet?.gender === 'Macho'
    const themeColor = {
        bg: isMale ? 'bg-blue-600' : 'bg-pink-600',
        bgHover: isMale ? 'hover:bg-blue-700' : 'hover:bg-pink-700',
        bgGhost: isMale ? 'bg-blue-500/10' : 'bg-pink-500/10',
        bgLight: isMale ? 'bg-blue-50' : 'bg-pink-50',
        text: isMale ? 'text-blue-600' : 'text-pink-600',
        border: isMale ? 'border-blue-500' : 'border-pink-500',
        borderLight: isMale ? 'border-blue-200' : 'border-pink-200',
    }

    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [time, setTime] = useState('08:00')
    const [motivo, setMotivo] = useState('')
    const [valorDiaria, setValorDiaria] = useState('0.00')
    const [anamnese, setAnamnese] = useState('')
    const [planoTerapeutico, setPlanoTerapeutico] = useState('')
    const [veterinarian, setVeterinarian] = useState('Dr. Cleyton Chaves')

    // ERP State - Materials and Medications
    const [materiais, setMateriais] = useState<{ id: string, codigo: string, nome: string, quantidade: string, valorUnitario: string }[]>([
        { id: '1', codigo: '', nome: '', quantidade: '', valorUnitario: '' }
    ])
    const [medicacoes, setMedicacoes] = useState<{ id: string, nome: string, dose: string, quantidade: string, valorUnitario: string }[]>([
        { id: '1', nome: '', dose: '', quantidade: '', valorUnitario: '' }
    ])

    // Expandable sections state - aberto por padrão para facilitar uso
    const [materiaisExpanded, setMateriaisExpanded] = useState(true)
    const [medicacoesExpanded, setMedicacoesExpanded] = useState(true)

    // Search states
    const [materiaisSearch, setMateriaisSearch] = useState('')
    const [medicacoesSearch, setMedicacoesSearch] = useState('')

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ]
    }

    const handleSave = async () => {
        if (!motivo.trim()) {
            toast.error('Preencha o motivo da internação')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const totalMateriais = materiais.reduce((acc, m) => acc + (parseFloat(m.quantidade) * parseFloat(m.valorUnitario) || 0), 0)
            const totalMedicacoes = medicacoes.reduce((acc, m) => acc + (parseFloat(m.quantidade) * parseFloat(m.valorUnitario) || 0), 0)
            const totalDiarias = parseFloat(valorDiaria) * Math.ceil((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
            const totalGeral = totalDiarias + totalMateriais + totalMedicacoes

            const description = {
                date,
                time,
                motivo,
                valorDiaria: parseFloat(valorDiaria),
                anamnese,
                planoTerapeutico,
                materiais,
                medicacoes,
                totals: {
                    materiais: totalMateriais,
                    medicacoes: totalMedicacoes,
                    diarias: totalDiarias,
                    geral: totalGeral
                }
            }

            const { error } = await (supabase.from('medical_records' as any).insert([{
                pet_id: petId,
                user_id: userData.user?.id,
                type: 'internacao',
                title: `Internação - ${motivo}`,
                description: JSON.stringify(description),
                date: new Date(date).toISOString(),
                veterinarian: veterinarian || 'Dr. Cleyton Chaves',
            }] as any) as any)

            if (error) throw error

            mutate('medical-records')
            toast.success('Registro de internação salvo!')
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar internação')
        } finally {
            setLoading(false)
        }
    }

    const totalMateriais = materiais.reduce((acc, m) => acc + (parseFloat(m.quantidade) * parseFloat(m.valorUnitario) || 0), 0)
    const totalMedicacoes = medicacoes.reduce((acc, m) => acc + (parseFloat(m.quantidade) * parseFloat(m.valorUnitario) || 0), 0)
    const totalDiarias = parseFloat(valorDiaria) * Math.ceil((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    const totalGeral = totalDiarias + totalMateriais + totalMedicacoes

    const previewContent = (
        <div className="space-y-8">
            {/* Cabeçalho */}
            <div className="text-center border-b-2 border-blue-600 pb-6">
                <h1 className="text-3xl font-bold mb-2 text-blue-600 flex items-center justify-center gap-3">
                    <Bed className="w-8 h-8 text-blue-600" />
                    TERMO DE INTERNAMENTO E CONTROLE DE CUSTOS
                </h1>
                <p className="text-lg text-gray-700">AgendaVet Medical Unit v2.0</p>
                <p className="text-sm text-gray-500">Centro de Internação Veterinária Especializada</p>
                <p className="text-xs mt-2">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>

            {/* Cards de Informações */}
            <div className="grid grid-cols-2 gap-6">
                {/* Card Dados do Paciente */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-4 text-blue-600 flex items-center gap-2">
                        <Stethoscope className="w-5 h-5" />
                        DADOS DO PACIENTE
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

                {/* Card Dados de Internação */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-4 text-blue-600 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        DADOS DE INTERNAÇÃO
                    </h3>
                    <div className="space-y-2">
                        <p><span className="font-bold">Data de Admissão:</span> {format(new Date(date), 'dd/MM/yyyy')}</p>
                        <p><span className="font-bold">Horário:</span> {time}</p>
                        <p><span className="font-bold">Motivo:</span> {motivo || 'A ser definido'}</p>
                        <p><span className="font-bold">Valor da Diária:</span> R$ {parseFloat(valorDiaria).toFixed(2)}</p>
                        <p><span className="font-bold">Veterinário:</span> {veterinarian}</p>
                    </div>
                </div>
            </div>

            {/* Anamnese */}
            {anamnese && (
                <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-4 text-blue-600">ANAMNESE DE INTERNAÇÃO</h3>
                    <div className="text-base leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(anamnese) }} />
                </div>
            )}

            {/* Plano Terapêutico */}
            {planoTerapeutico && (
                <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-4 text-blue-600">PLANO TERAPÊUTICO</h3>
                    <div className="text-base leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(planoTerapeutico) }} />
                </div>
            )}

            {/* Planilha de Custos */}
            <div className="bg-white border-2 border-blue-300 rounded-lg p-6">
                <h3 className="font-bold text-xl mb-6 text-blue-600 text-center">PLANILHA DETALHADA DE CUSTOS</h3>

                {/* Tabela de Diárias */}
                <div className="mb-6">
                    <h4 className="font-bold text-lg mb-3 text-gray-700">Diárias de Internação</h4>
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-blue-50">
                                <th className="border border-gray-300 p-3 text-left font-bold">Descrição</th>
                                <th className="border border-gray-300 p-3 text-center font-bold">Quantidade</th>
                                <th className="border border-gray-300 p-3 text-right font-bold">Valor Unitário</th>
                                <th className="border border-gray-300 p-3 text-right font-bold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-3">Diária de Internação</td>
                                <td className="border border-gray-300 p-3 text-center">{Math.ceil((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))} dias</td>
                                <td className="border border-gray-300 p-3 text-right">R$ {parseFloat(valorDiaria).toFixed(2)}</td>
                                <td className="border border-gray-300 p-3 text-right font-bold">R$ {totalDiarias.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Tabela de Materiais */}
                {materiais.some(m => m.nome) && (
                    <div className="mb-6">
                        <h4 className="font-bold text-lg mb-3 text-gray-700">Materiais Utilizados</h4>
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-blue-50">
                                    <th className="border border-gray-300 p-3 text-left font-bold">Código</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold">Item</th>
                                    <th className="border border-gray-300 p-3 text-center font-bold">Qtd</th>
                                    <th className="border border-gray-300 p-3 text-right font-bold">Valor Unitário</th>
                                    <th className="border border-gray-300 p-3 text-right font-bold">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materiais.filter(m => m.nome).map((material, index) => (
                                    <tr key={index}>
                                        <td className="border border-gray-300 p-3">{material.codigo}</td>
                                        <td className="border border-gray-300 p-3">{material.nome}</td>
                                        <td className="border border-gray-300 p-3 text-center">{material.quantidade}</td>
                                        <td className="border border-gray-300 p-3 text-right">R$ {parseFloat(material.valorUnitario || '0').toFixed(2)}</td>
                                        <td className="border border-gray-300 p-3 text-right font-bold">R$ {(parseFloat(material.quantidade) * parseFloat(material.valorUnitario || '0')).toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50">
                                    <td colSpan={4} className="border border-gray-300 p-3 text-right font-bold">Total Materiais:</td>
                                    <td className="border border-gray-300 p-3 text-right font-bold text-blue-600">R$ {totalMateriais.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tabela de Medicações */}
                {medicacoes.some(m => m.nome) && (
                    <div className="mb-6">
                        <h4 className="font-bold text-lg mb-3 text-gray-700">Medicações Aplicadas</h4>
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-blue-50">
                                    <th className="border border-gray-300 p-3 text-left font-bold">Medicação</th>
                                    <th className="border border-gray-300 p-3 text-center font-bold">Dose</th>
                                    <th className="border border-gray-300 p-3 text-center font-bold">Qtd</th>
                                    <th className="border border-gray-300 p-3 text-right font-bold">Valor Unitário</th>
                                    <th className="border border-gray-300 p-3 text-right font-bold">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicacoes.filter(m => m.nome).map((medicacao, index) => (
                                    <tr key={index}>
                                        <td className="border border-gray-300 p-3">{medicacao.nome}</td>
                                        <td className="border border-gray-300 p-3 text-center">{medicacao.dose}</td>
                                        <td className="border border-gray-300 p-3 text-center">{medicacao.quantidade}</td>
                                        <td className="border border-gray-300 p-3 text-right">R$ {parseFloat(medicacao.valorUnitario || '0').toFixed(2)}</td>
                                        <td className="border border-gray-300 p-3 text-right font-bold">R$ {(parseFloat(medicacao.quantidade) * parseFloat(medicacao.valorUnitario || '0')).toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50">
                                    <td colSpan={4} className="border border-gray-300 p-3 text-right font-bold">Total Medicações:</td>
                                    <td className="border border-gray-300 p-3 text-right font-bold text-blue-600">R$ {totalMedicacoes.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Total Geral */}
                <div className="border-t-4 border-blue-600 pt-4">
                    <div className="text-center">
                        <h4 className="text-2xl font-bold text-blue-600 mb-2">VALOR TOTAL ATUALIZADO</h4>
                        <p className="text-4xl font-black text-blue-700">R$ {totalGeral.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 mt-2">Valor sujeito a alterações conforme evolução do tratamento</p>
                    </div>
                </div>
            </div>

            {/* Assinaturas */}
            <div className="mt-12 pt-8 border-t-2 border-blue-600">
                <div className="grid grid-cols-2 gap-8">
                    <div className="text-center">
                        <div className="border-t-2 border-blue-600 w-80 mx-auto mb-2"></div>
                        <p className="font-bold text-blue-600">{veterinarian}</p>
                        <p className="text-sm">Médico Veterinário Responsável</p>
                        <p className="text-xs mt-2">CRMV: 12345-SP</p>
                        <p className="text-xs mt-1">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="text-center">
                        <div className="border-t-2 border-blue-600 w-80 mx-auto mb-2"></div>
                        <p className="font-bold text-blue-600">{owner?.fullName || 'Proprietário'}</p>
                        <p className="text-sm">Proprietário Responsável</p>
                        <p className="text-xs mt-2">Assumo responsabilidade financeira</p>
                        <p className="text-xs mt-1">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
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
            title="Internação e Controle de Custos"
            previewContent={previewContent}
            onSave={handleSave}
            saveLabel="Salvar Internação"
            isSaving={loading}
            printTitle={`Termo_Internamento_${petName}_${format(new Date(), 'dd_MM_yyyy')}`}
        >
            <div className="space-y-6 bg-slate-50/50 p-6 rounded-lg">
                {/* Dados de Admissão */}
                <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <Bed className="w-5 h-5" />
                        Dados de Admissão
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-bold flex items-center gap-2 text-slate-600 font-semibold">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                Data de Admissão *
                            </Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold flex items-center gap-2 text-slate-600 font-semibold">
                                <Clock className="w-4 h-4 text-blue-600" />
                                Horário de Admissão *
                            </Label>
                            <Input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Motivo da Internação *</Label>
                        <Input
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Ex: Pós-operatório, Gastroenterite..."
                            className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Valor da Diária (R$) *</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={valorDiaria}
                            onChange={(e) => setValorDiaria(e.target.value)}
                            placeholder="0.00"
                            className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                        />
                    </div>
                </div>

                {/* Rich Text Editors */}
                <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <FileText className="w-5 h-5" />
                        Relatório Clínico
                    </h3>
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Anamnese de Internação</Label>
                        <div className="border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
                            <ReactQuill
                                value={anamnese}
                                onChange={setAnamnese}
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
                                placeholder="Descreva a história clínica, sintomas, diagnóstico inicial..."
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Plano Terapêutico</Label>
                        <div className="border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
                            <ReactQuill
                                value={planoTerapeutico}
                                onChange={setPlanoTerapeutico}
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
                                placeholder="Descreva o plano de tratamento, medicações, exames..."
                            />
                        </div>
                    </div>
                </div>

                {/* ERP System - Materials */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                            <DollarSign className="w-5 h-5" />
                            Consumo de Materiais
                        </h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMateriaisExpanded(!materiaisExpanded)}
                            className="h-8"
                        >
                            {materiaisExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </div>

                    {materiaisExpanded && (
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar material por código ou nome..."
                                    value={materiaisSearch}
                                    onChange={(e) => setMateriaisSearch(e.target.value)}
                                    className="pl-9 h-9"
                                />
                            </div>

                            <div className="space-y-2">
                                {materiais.map((material, index) => (
                                    <div key={material.id} className="grid grid-cols-5 gap-2">
                                        <Input
                                            value={material.codigo}
                                            onChange={(e) => {
                                                const updated = [...materiais]
                                                updated[index].codigo = e.target.value
                                                setMateriais(updated)
                                            }}
                                            placeholder="Código"
                                            className="h-9 text-xs"
                                        />
                                        <Input
                                            value={material.nome}
                                            onChange={(e) => {
                                                const updated = [...materiais]
                                                updated[index].nome = e.target.value
                                                setMateriais(updated)
                                            }}
                                            placeholder="Nome do Material"
                                            className="h-9 text-xs"
                                        />
                                        <Input
                                            value={material.quantidade}
                                            onChange={(e) => {
                                                const updated = [...materiais]
                                                updated[index].quantidade = e.target.value
                                                setMateriais(updated)
                                            }}
                                            placeholder="Qtd"
                                            className="h-9 text-xs"
                                        />
                                        <Input
                                            value={material.valorUnitario}
                                            onChange={(e) => {
                                                const updated = [...materiais]
                                                updated[index].valorUnitario = e.target.value
                                                setMateriais(updated)
                                            }}
                                            placeholder="Valor Unit."
                                            className="h-9 text-xs"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setMateriais(materiais.filter((_, i) => i !== index))}
                                            className="h-9"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setMateriais([...materiais, { id: Math.random().toString(), codigo: '', nome: '', quantidade: '', valorUnitario: '' }])}
                                className="w-full h-9"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Material
                            </Button>

                            {/* Totais */}
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex justify-between">
                                    <span>Materiais:</span>
                                    <span>R$ {materiais.reduce((acc, m) => acc + (parseFloat(m.quantidade) * parseFloat(m.valorUnitario) || 0), 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Medicações:</span>
                                    <span>R$ {medicacoes.reduce((acc, m) => acc + (parseFloat(m.quantidade) * parseFloat(m.valorUnitario) || 0), 0).toFixed(2)}</span>
                                </div>
                                <div className="border-t-2 border-blue-300 pt-2 mt-2">
                                    <div className="flex justify-between font-bold text-lg text-blue-600">
                                        <span>TOTAL PARCIAL:</span>
                                        <span>R$ {(
                                            (parseFloat(valorDiaria) * Math.ceil((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))) +
                                            materiais.reduce((acc, m) => acc + (parseFloat(m.quantidade) * parseFloat(m.valorUnitario) || 0), 0) +
                                            medicacoes.reduce((acc, m) => acc + (parseFloat(m.quantidade) * parseFloat(m.valorUnitario) || 0), 0)
                                        ).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ERP System - Medications */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                            <DollarSign className="w-5 h-5" />
                            Medicações Aplicadas
                        </h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMedicacoesExpanded(!medicacoesExpanded)}
                            className="h-8"
                        >
                            {medicacoesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </div>

                    {medicacoesExpanded && (
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar medicação por nome..."
                                    value={medicacoesSearch}
                                    onChange={(e) => setMedicacoesSearch(e.target.value)}
                                    className="pl-9 h-9"
                                />
                            </div>

                            <div className="space-y-2">
                                {medicacoes.map((medicacao, index) => (
                                    <div key={medicacao.id} className="grid grid-cols-6 gap-2">
                                        <Input
                                            value={medicacao.nome}
                                            onChange={(e) => {
                                                const updated = [...medicacoes]
                                                updated[index].nome = e.target.value
                                                setMedicacoes(updated)
                                            }}
                                            placeholder="Medicação"
                                            className="h-9 text-xs col-span-2"
                                        />
                                        <Input
                                            value={medicacao.dose}
                                            onChange={(e) => {
                                                const updated = [...medicacoes]
                                                updated[index].dose = e.target.value
                                                setMedicacoes(updated)
                                            }}
                                            placeholder="Dose"
                                            className="h-9 text-xs"
                                        />
                                        <Input
                                            value={medicacao.quantidade}
                                            onChange={(e) => {
                                                const updated = [...medicacoes]
                                                updated[index].quantidade = e.target.value
                                                setMedicacoes(updated)
                                            }}
                                            placeholder="Qtd"
                                            className="h-9 text-xs"
                                        />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={medicacao.valorUnitario}
                                            onChange={(e) => {
                                                const updated = [...medicacoes]
                                                updated[index].valorUnitario = e.target.value
                                                setMedicacoes(updated)
                                            }}
                                            placeholder="R$ Unit."
                                            className="h-9 text-xs"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setMedicacoes(medicacoes.filter((_, i) => i !== index))}
                                            className="h-9"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setMedicacoes([...medicacoes, { id: Math.random().toString(), nome: '', dose: '', quantidade: '', valorUnitario: '' }])}
                                className="w-full h-9"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Medicação
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </BaseAttendanceDialog>
    )
}
