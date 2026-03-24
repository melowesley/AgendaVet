'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePet, useOwner } from '@/lib/data-store'
import { BaseAttendanceDialog } from '../shared/base-attendance-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, FlaskConical, DollarSign, Upload, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface ExameDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

const TIPOS_EXAME = [
    'Hemograma Completo',
    'Bioquímica Sérica',
    'Análise de Urina',
    'Exame Parasitológico',
    'Radiografia',
    'Ultrassom',
    'Eletrocardiograma',
    'Citologia',
    'Histopatologia',
    'Teste Rápido',
]

export function ExameDialog({ open, onOpenChange, onBack, petId, petName }: ExameDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')

    // Estado do formulário
    const [tipoExame, setTipoExame] = useState('')
    const [dataExame, setDataExame] = useState(format(new Date(), 'dd/MM/yyyy'))
    const [horario, setHorario] = useState('08:00')
    const [solicitante, setSolicitante] = useState('Dr. Cleyton Chaves')
    const [executor, setExecutor] = useState('')
    const [descricao, setDescricao] = useState('')
    const [resultados, setResultados] = useState('')
    const [conclusao, setConclusao] = useState('')
    const [recomendacoes, setRecomendacoes] = useState('')

    // Estado de upload de PDF
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [pdfUrl, setPdfUrl] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Estado de materiais e custos (ERP)
    const [materiais, setMateriais] = useState([
        { nome: '', quantidade: '', valor: '' }
    ])

    const [loading, setLoading] = useState(false)

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file)
            const url = URL.createObjectURL(file)
            setPdfUrl(url)
        } else {
            alert('Por favor, selecione um arquivo PDF válido.')
        }
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // TODO: Implementar upload do PDF para o Supabase Storage
            // TODO: Obter URL do arquivo após upload
            // TODO: Salvar registro com URL do PDF no banco de dados
            
            // Estrutura preparada para futuro implementação:
            const description = {
                tipoExame,
                dataExame,
                horario,
                solicitante,
                executor,
                descricao,
                resultados,
                conclusao,
                recomendacoes,
                // PDF info (para implementação futura)
                pdfFileName: selectedFile?.name || null,
                pdfUrl: null, // Será preenchido após upload para Supabase Storage
                materiais,
            }

            // Simulação de salvamento
            setTimeout(() => {
                setLoading(false)
                onOpenChange(false)
                toast.success('Exame salvo com sucesso!')
            }, 1000)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar exame')
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

    const previewContent = (
        <div className="space-y-8">
            {pdfUrl ? (
                // PDF Viewer - Full A4 iframe
                <div className="w-full h-full min-h-[800px] bg-white border border-gray-300 rounded-lg shadow-lg">
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full min-h-[800px] border-0"
                        title="Visualização do Laudo PDF"
                    />
                </div>
            ) : (
                // Empty State - Standard A4 layout
                <>
                    {/* Cabeçalho do Laudo */}
                    <div className="text-center border-b-2 border-blue-600 pb-6">
                        <h1 className="text-3xl font-bold mb-2 text-blue-600 flex items-center justify-center gap-3">
                            <FlaskConical className="w-8 h-8 text-blue-600" />
                            LAUDO DE EXAME LABORATORIAL
                        </h1>
                        <p className="text-lg text-gray-700">AgendaVet Medical Unit v2.0</p>
                        <p className="text-sm text-gray-500">Centro de Diagnóstico Veterinário</p>
                    </div>

                    {/* Empty State Message */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-12 text-center">
                        <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-blue-600 mb-2">Nenhum exame carregado</h3>
                        <p className="text-gray-600 mb-4">Faça o upload do PDF para visualização e anexo.</p>
                        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 max-w-md mx-auto">
                            <p className="text-sm text-blue-700">
                                <span className="font-bold">Instruções:</span> Clique no botão "Fazer Upload do Laudo PDF" para carregar um arquivo de exame laboratorial em formato PDF.
                            </p>
                        </div>
                    </div>

                    {/* Dados do Paciente (mesmo sem PDF) */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-bold text-lg mb-4 text-blue-600">DADOS DO PACIENTE</h3>
                            <div className="space-y-2">
                                <p><span className="font-bold">Nome:</span> {petName}</p>
                                <p><span className="font-bold">Espécie:</span> {pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'}</p>
                                <p><span className="font-bold">Raça:</span> {pet?.breed}</p>
                                <p><span className="font-bold">Idade:</span> {pet ? Math.floor((new Date().getTime() - new Date(pet.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) + ' anos' : ''}</p>
                                <p><span className="font-bold">Sexo:</span> {pet?.gender === 'Macho' ? 'Macho' : pet?.gender === 'Fêmea' ? 'Fêmea' : 'Não informado'}</p>
                                <p><span className="font-bold">Proprietário:</span> {owner?.fullName || 'Proprietário S/R'}</p>
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-bold text-lg mb-4 text-blue-600">DADOS DO EXAME</h3>
                            <div className="space-y-2">
                                <p><span className="font-bold">Tipo de Exame:</span> {tipoExame || 'A ser definido'}</p>
                                <p><span className="font-bold">Data:</span> {dataExame}</p>
                                <p><span className="font-bold">Horário:</span> {horario}</p>
                                <p><span className="font-bold">Médico Solicitante:</span> {solicitante}</p>
                                <p><span className="font-bold">Executor:</span> {executor || 'A ser definido'}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )

    return (
        <BaseAttendanceDialog
            open={open}
            onOpenChange={onOpenChange}
            onBack={onBack}
            title="Laudo de Exame"
            previewContent={previewContent}
            onSave={handleSave}
            saveLabel="Salvar Exame"
            isSaving={loading}
            printTitle={`Laudo_Exame_${petName}_${format(new Date(), 'dd_MM_yyyy')}`}
        >
            <div className="space-y-6 bg-slate-50/50 p-6 rounded-lg">
                {/* Upload de PDF */}
                <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <Upload className="w-5 h-5" />
                        Upload do Laudo PDF
                    </h3>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            onClick={handleUploadClick}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-3"
                        >
                            <Upload className="w-5 h-5" />
                            {selectedFile ? `Arquivo: ${selectedFile.name}` : 'Fazer Upload do Laudo PDF'}
                        </Button>
                        {selectedFile && (
                            <div className="mt-2 text-sm text-green-600 font-medium">
                                ✓ PDF carregado com sucesso. Visualize no painel ao lado.
                            </div>
                        )}
                    </div>
                </div>

                {/* Dados Básicos */}
                <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <FlaskConical className="w-5 h-5" />
                        Dados do Exame
                    </h3>
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Tipo de Exame *</Label>
                        <Select value={tipoExame} onValueChange={setTipoExame}>
                            <SelectTrigger className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20">
                                <SelectValue placeholder="Selecione o tipo de exame" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIPOS_EXAME.map((tipo) => (
                                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-bold text-slate-600 font-semibold">Data *</Label>
                            <Input
                                value={dataExame}
                                onChange={(e) => setDataExame(e.target.value)}
                                placeholder="dd/mm/yyyy"
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-slate-600 font-semibold">Horário *</Label>
                            <Input
                                value={horario}
                                onChange={(e) => setHorario(e.target.value)}
                                placeholder="HH:mm"
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Detalhes do Exame */}
                <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <FileText className="w-5 h-5" />
                        Detalhes do Exame
                    </h3>
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Descrição do Exame</Label>
                        <Textarea
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descreva o procedimento, metodologia e condições da coleta"
                            className="min-h-[100px] bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Resultados</Label>
                        <Textarea
                            value={resultados}
                            onChange={(e) => setResultados(e.target.value)}
                            placeholder="Resultados detalhados do exame com valores e referências"
                            className="min-h-[150px] bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Conclusão Diagnóstica</Label>
                        <Textarea
                            value={conclusao}
                            onChange={(e) => setConclusao(e.target.value)}
                            placeholder="Conclusão baseada nos resultados obtidos"
                            className="min-h-[100px] bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Recomendações</Label>
                        <Textarea
                            value={recomendacoes}
                            onChange={(e) => setRecomendacoes(e.target.value)}
                            placeholder="Recomendações clínicas e próximos passos"
                            className="min-h-[80px] bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                        />
                    </div>
                </div>

                {/* Materiais (ERP) */}
                <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
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
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                            <Input
                                value={material.quantidade}
                                onChange={(e) => updateMaterial(index, 'quantidade', e.target.value)}
                                placeholder="Qtd"
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                            <Input
                                value={material.valor}
                                onChange={(e) => updateMaterial(index, 'valor', e.target.value)}
                                placeholder="Valor"
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeMaterial(index)}
                                className="h-9 border-slate-200 hover:bg-slate-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addMaterial}
                        className="w-full h-9 border-slate-200 hover:bg-slate-50"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Material
                    </Button>
                </div>
            </div>
        </BaseAttendanceDialog>
    )
}
