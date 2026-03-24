'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/data-store'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })

import { usePet, useOwner, useMedicalRecords } from '@/lib/data-store'
import { BaseAttendanceDialog } from '@/components/admin/shared/base-attendance-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FileText, Save, Printer, ArrowLeft, X, Calendar, User, Phone, Mail } from 'lucide-react'
import { format } from 'date-fns'

interface DocumentoJuridicoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

export function DocumentoJuridicoDialog({ open, onOpenChange, onBack, petId, petName }: DocumentoJuridicoDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')

    const isFemale = pet?.gender === 'Fêmea'
    const themeColor = {
        bg: isFemale ? 'bg-pink-600' : 'bg-blue-600',
        bgHover: isFemale ? 'hover:bg-pink-700' : 'hover:bg-blue-700',
        bgGhost: isFemale ? 'bg-pink-500/10' : 'bg-pink-500/10',
        bgLight: isFemale ? 'bg-pink-50' : 'bg-blue-50',
        text: isFemale ? 'text-pink-600' : 'text-blue-600',
        border: isFemale ? 'border-pink-500' : 'border-blue-500',
        borderLight: isFemale ? 'border-pink-200' : 'border-blue-200',
    }

    const [loading, setLoading] = useState(false)
    const [documentType, setDocumentType] = useState('')
    const [documentContent, setDocumentContent] = useState('')
    const [veterinarian, setVeterinarian] = useState('Dr. Cleyton Chaves')
    const [clinicName, setClinicName] = useState('AgendaVet Medical Unit')

    // Mock data dictionary for auto-fill
    const mockData = {
        nome_tutor: owner?.fullName || 'TUTOR NÃO INFORMADO',
        cpf_tutor: owner?.cpf || 'CPF NÃO INFORMADO',
        rg_tutor: owner?.rg || 'RG NÃO INFORMADO',
        endereco_tutor: owner?.address || 'ENDEREÇO NÃO INFORMADO',
        telefone_tutor: owner?.phone || 'TELEFONE NÃO INFORMADO',
        email_tutor: owner?.email || 'EMAIL NÃO INFORMADO',
        nome_pet: petName,
        especie_pet: pet?.species === 'dog' ? 'canina' : pet?.species === 'cat' ? 'felina' : 'animal',
        raca_pet: pet?.breed || 'RAÇA NÃO INFORMADA',
        idade_pet: pet ? Math.floor((new Date().getTime() - new Date(pet.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) + ' anos' : 'IDADE NÃO INFORMADA',
        sexo_pet: pet?.gender === 'Macho' ? 'macho' : pet?.gender === 'Fêmea' ? 'fêmea' : 'sexo não informado',
        cor_pet: pet?.color || 'COR NÃO INFORMADA',
        peso_pet: pet?.weight || 'PESO NÃO INFORMADO',
        nome_veterinario: veterinarian,
        crmv_veterinario: 'CRMV-SP 12345',
        nome_clinica: clinicName,
        endereco_clinica: 'Rua das Clínicas, 123 - São Paulo/SP',
        telefone_clinica: '(11) 99999-9999',
        data_atual: format(new Date(), 'dd/MM/yyyy'),
        cidade_atual: 'São Paulo',
        estado_atual: 'SP'
    }

    // Document templates
    const documentTemplates = {
        'termo_anestesia': {
            title: 'TERMO DE RESPONSABILIDADE POR ANESTESIA',
            content: `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 10px;">TERMO DE RESPONSABILIDADE POR ANESTESIA</h1>
                    <p style="font-size: 12pt;">{{nome_clinica}}</p>
                </div>

                <p style="text-indent: 2em;">Eu, {{nome_tutor}}, portador(a) do CPF {{cpf_tutor}}, residente em {{endereco_tutor}}, telefone {{telefone_tutor}}, declaro que autorizo a realização de anestesia no meu animal de estimação {{nome_pet}}, {{especie_pet}} da raça {{raca_pet}}, {{idade_pet}}, {{sexo_pet}}, cor {{cor_pet}}.</p>

                <p style="text-indent: 2em;">Estou ciente dos riscos inerentes ao procedimento anestésico, incluindo, mas não se limitando a: reações alérgicas, problemas cardíacos, respiratórios, renais ou hepáticos, que podem levar ao óbito do animal.</p>

                <p style="text-indent: 2em;">Declaro ter sido informado(a) sobre a necessidade de exames pré-anestésicos (hemograma, bioquímica, radiografia, etc.) e autorizo sua realização quando necessários.</p>

                <p style="text-indent: 2em;">Assumo toda a responsabilidade financeira pelos custos decorrentes do tratamento anestésico, incluindo medicações, exames complementares e eventual internação.</p>

                <p style="text-indent: 2em;">Em caso de complicações, autorizo os procedimentos necessários para salvar a vida do meu animal, mesmo que não previstos inicialmente.</p>

                <p style="text-indent: 2em;">Declaro que todas as informações fornecidas são verdadeiras e estou ciente de que a falsidade nas informações pode comprometer o tratamento.</p>

                <div style="margin-top: 50px; text-align: right;">
                    <p>{{cidade_atual}}, {{data_atual}}</p>
                </div>
            `
        },
        'termo_eutanasia': {
            title: 'TERMO DE CONSENTIMENTO PARA EUTANÁSIA',
            content: `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 10px;">TERMO DE CONSENTIMENTO PARA EUTANÁSIA</h1>
                    <p style="font-size: 12pt;">{{nome_clinica}}</p>
                </div>

                <p style="text-indent: 2em;">Eu, {{nome_tutor}}, portador(a) do CPF {{cpf_tutor}}, residente em {{endereco_tutor}}, telefone {{telefone_tutor}}, proprietário(a) do animal {{nome_pet}}, {{especie_pet}} da raça {{raca_pet}}, {{idade_pet}}, {{sexo_pet}}.</p>

                <p style="text-indent: 2em;">Declaro estar ciente de que meu animal apresenta doença grave/incurável, com prognóstico reservado ou ruim, causando sofrimento intenso e contínuo ao mesmo.</p>

                <p style="text-indent: 2em;">Após consulta e avaliação médica realizada pelo(a) médico(a) veterinário(a) {{nome_veterinario}}, {{crmv_veterinario}}, optei pela eutanásia como forma de cessar o sofrimento do meu animal.</p>

                <p style="text-indent: 2em;">Declaro ter sido informado(a) sobre o procedimento de eutanásia, seus métodos e consequências, e autorizo sua realização.</p>

                <p style="text-indent: 2em;">Estou ciente de que a eutanásia é irreversível e definitiva, e assumo toda a responsabilidade pela decisão tomada.</p>

                <p style="text-indent: 2em;">Autorizo a incineração ou cremação do corpo do animal, assumindo os custos respectivos.</p>

                <p style="text-indent: 2em;">Declaro que todas as informações fornecidas são verdadeiras e que não existem questões judiciais pendentes relacionadas ao animal.</p>

                <div style="margin-top: 50px; text-align: right;">
                    <p>{{cidade_atual}}, {{data_atual}}</p>
                </div>
            `
        },
        'termo_internacao': {
            title: 'TERMO DE INTERNAÇÃO E RESPONSABILIDADE',
            content: `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 10px;">TERMO DE INTERNAÇÃO E RESPONSABILIDADE</h1>
                    <p style="font-size: 12pt;">{{nome_clinica}}</p>
                </div>

                <p style="text-indent: 2em;">Eu, {{nome_tutor}}, portador(a) do CPF {{cpf_tutor}}, residente em {{endereco_tutor}}, telefone {{telefone_tutor}}, proprietário(a) do animal {{nome_pet}}, {{especie_pet}} da raça {{raca_pet}}, {{idade_pet}}, {{sexo_pet}}.</p>

                <p style="text-indent: 2em;">Autorizo a internação do meu animal na {{nome_clinica}}, localizada em {{endereco_clinica}}, telefone {{telefone_clinica}}.</p>

                <p style="text-indent: 2em;">Declaro estar ciente dos custos diários de internação e assumo responsabilidade por todos os valores decorrentes, incluindo medicações, exames, procedimentos e tratamentos necessários.</p>

                <p style="text-indent: 2em;">Em caso de necessidade de procedimentos de emergência, autorizo sua realização, assumindo os custos respectivos.</p>

                <p style="text-indent: 2em;">Declaro que todas as informações fornecidas sobre o animal e minha pessoa são verdadeiras.</p>

                <p style="text-indent: 2em;">Estou ciente de que devo manter meus dados de contato atualizados para eventuais emergências.</p>

                <p style="text-indent: 2em;">Autorizo visitas ao animal durante o horário de funcionamento da clínica.</p>

                <div style="margin-top: 50px; text-align: right;">
                    <p>{{cidade_atual}}, {{data_atual}}</p>
                </div>
            `
        },
        'termo_cirurgia': {
            title: 'TERMO DE CONSENTIMENTO PARA CIRURGIA',
            content: `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 10px;">TERMO DE CONSENTIMENTO PARA CIRURGIA</h1>
                    <p style="font-size: 12pt;">{{nome_clinica}}</p>
                </div>

                <p style="text-indent: 2em;">Eu, {{nome_tutor}}, portador(a) do CPF {{cpf_tutor}}, residente em {{endereco_tutor}}, telefone {{telefone_tutor}}, declaro que autorizo a realização de cirurgia no meu animal de estimação {{nome_pet}}, {{especie_pet}} da raça {{raca_pet}}, {{idade_pet}}, {{sexo_pet}}.</p>

                <p style="text-indent: 2em;">Após consulta médica realizada pelo(a) médico(a) veterinário(a) {{nome_veterinario}}, {{crmv_veterinario}}, estou ciente dos riscos cirúrgicos, incluindo, mas não se limitando a: infecção, hemorragia, complicações anestésicas, etc.</p>

                <p style="text-indent: 2em;">Declaro ter sido informado(a) sobre os cuidados pré e pós-operatórios necessários e me comprometo a segui-los rigorosamente.</p>

                <p style="text-indent: 2em;">Assumo toda a responsabilidade financeira pelos custos da cirurgia, incluindo anestesia, medicações, exames pré-operatórios, internação e cuidados pós-operatórios.</p>

                <p style="text-indent: 2em;">Em caso de complicações, autorizo procedimentos adicionais necessários para salvar a vida do animal.</p>

                <p style="text-indent: 2em;">Declaro que todas as informações fornecidas são verdadeiras.</p>

                <div style="margin-top: 50px; text-align: right;">
                    <p>{{cidade_atual}}, {{data_atual}}</p>
                </div>
            `
        },
        'termo_vacina': {
            title: 'TERMO DE CONSENTIMENTO PARA VACINAÇÃO',
            content: `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 10px;">TERMO DE CONSENTIMENTO PARA VACINAÇÃO</h1>
                    <p style="font-size: 12pt;">{{nome_clinica}}</p>
                </div>

                <p style="text-indent: 2em;">Eu, {{nome_tutor}}, portador(a) do CPF {{cpf_tutor}}, residente em {{endereco_tutor}}, telefone {{telefone_tutor}}, proprietário(a) do animal {{nome_pet}}, {{especie_pet}} da raça {{raca_pet}}, {{idade_pet}}, {{sexo_pet}}.</p>

                <p style="text-indent: 2em;">Declaro que autorizo a vacinação do meu animal conforme protocolo vacinal recomendado pelo(a) médico(a) veterinário(a) {{nome_veterinario}}, {{crmv_veterinario}}.</p>

                <p style="text-indent: 2em;">Estou ciente dos possíveis efeitos colaterais das vacinas, incluindo reações alérgicas, e autorizo o tratamento necessário em caso de complicações.</p>

                <p style="text-indent: 2em;">Declaro ter sido informado(a) sobre a importância da vacinação para a saúde do animal e da comunidade.</p>

                <p style="text-indent: 2em;">Assumo responsabilidade pelos custos da vacinação e eventual tratamento de reações adversas.</p>

                <p style="text-indent: 2em;">Declaro que todas as informações fornecidas são verdadeiras.</p>

                <div style="margin-top: 50px; text-align: right;">
                    <p>{{cidade_atual}}, {{data_atual}}</p>
                </div>
            `
        }
    }

    // Auto-fill function
    const applyTemplate = (type: string) => {
        const template = documentTemplates[type as keyof typeof documentTemplates]
        if (template) {
            let content = template.content

            // Replace all variables
            Object.entries(mockData).forEach(([key, value]) => {
                content = content.replace(new RegExp(`{{${key}}}`, 'g'), value)
            })

            setDocumentContent(content)
        }
    }

    useEffect(() => {
        if (documentType) {
            applyTemplate(documentType)
        }
    }, [documentType, pet, owner])

    const handleSave = async () => {
        if (!documentType || !documentContent.trim()) {
            toast.error('Selecione um tipo de documento e preencha o conteúdo')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const recordData = {
                pet_id: petId,
                user_id: userData.user?.id,
                type: 'documento_juridico',
                title: documentTemplates[documentType as keyof typeof documentTemplates]?.title || 'Documento Jurídico',
                description: JSON.stringify({
                    documentType,
                    content: documentContent,
                    veterinarian,
                    clinicName
                }),
                date: new Date().toISOString(),
                veterinarian: veterinarian || 'Dr. Cleyton Chaves',
            }

            const { error } = await supabase.from('medical_records').insert([recordData])

            if (error) throw error

            mutate('medical-records')
            toast.success('Documento jurídico salvo com sucesso!')
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar documento')
        } finally {
            setLoading(false)
        }
    }

    const previewContent = (
        <div className="w-full max-w-[650px] min-h-[920px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm border p-12 flex flex-col text-slate-900">
            {/* Header */}
            <div className="border-b-2 pb-6 mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold uppercase tracking-widest text-blue-600">Documento Jurídico</h2>
                    <p className="text-[10px] opacity-70 mt-1 uppercase">{documentTemplates[documentType as keyof typeof documentTemplates]?.title || 'DOCUMENTO JURÍDICO'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-bold text-slate-400">AgendaVet Legal Unit v2.0</p>
                </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 text-justify leading-relaxed text-sm indent-8" style={{ lineHeight: '1.5' }}>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(documentContent) }} />
            </div>

            {/* Signature Block */}
            <div className="flex justify-between mt-16">
                <div className="text-center w-64">
                    <div className="border-t border-slate-800 w-full pt-2"></div>
                    <p className="font-bold text-center mt-2">{mockData.nome_tutor}</p>
                    <p className="text-xs text-slate-500 text-center">CPF: {mockData.cpf_tutor}</p>
                    <p className="text-xs text-slate-500 text-center">Tutor Responsável</p>
                </div>
                <div className="text-center w-64">
                    <div className="border-t border-slate-800 w-full pt-2"></div>
                    <p className="font-bold text-center mt-2">{mockData.nome_veterinario}</p>
                    <p className="text-xs text-slate-500 text-center">{mockData.crmv_veterinario}</p>
                    <p className="text-xs text-slate-500 text-center">Médico Veterinário</p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-12 border-t border-slate-100 text-center italic">
                <div className="text-[8px] opacity-40 leading-tight">
                    Documento gerado via AgendaVet Legal System. Este documento tem valor jurídico e pode ser utilizado em processos legais.
                </div>
            </div>
        </div>
    )

    return (
        <BaseAttendanceDialog
            open={open}
            onOpenChange={onOpenChange}
            onBack={onBack}
            title="Documentos Jurídicos"
            previewContent={previewContent}
            onSave={handleSave}
            saveLabel="Salvar Documento"
            isSaving={loading}
            printTitle={`Documento_Juridico_${petName}_${format(new Date(), 'dd_MM_yyyy')}`}
        >
            <div className="space-y-6 bg-slate-50/50 p-6 rounded-lg">
                {/* Document Type Selection */}
                <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <FileText className="w-5 h-5" />
                        Tipo de Documento
                    </h3>
                    <div className="space-y-2">
                        <Label htmlFor="documentType" className="text-sm font-bold text-slate-600">Selecione o tipo de documento *</Label>
                        <Select value={documentType} onValueChange={setDocumentType}>
                            <SelectTrigger className="bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20">
                                <SelectValue placeholder="Escolha um documento..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="termo_anestesia">Termo de Responsabilidade por Anestesia</SelectItem>
                                <SelectItem value="termo_eutanasia">Termo de Consentimento para Eutanásia</SelectItem>
                                <SelectItem value="termo_internacao">Termo de Internação e Responsabilidade</SelectItem>
                                <SelectItem value="termo_cirurgia">Termo de Consentimento para Cirurgia</SelectItem>
                                <SelectItem value="termo_vacina">Termo de Consentimento para Vacinação</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Document Settings */}
                <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <User className="w-5 h-5" />
                        Configurações do Documento
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-bold text-slate-600">Nome da Clínica</Label>
                            <Input
                                value={clinicName}
                                onChange={(e) => setClinicName(e.target.value)}
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-slate-600">Veterinário Responsável</Label>
                            <Input
                                value={veterinarian}
                                onChange={(e) => setVeterinarian(e.target.value)}
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Auto-fill Preview */}
                {documentType && (
                    <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                            <FileText className="w-5 h-5" />
                            Prévia do Documento
                        </h3>
                        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border">
                            <p><strong>Template Selecionado:</strong> {documentTemplates[documentType as keyof typeof documentTemplates]?.title}</p>
                            <p><strong>Auto-fill aplicado:</strong> Todas as variáveis foram substituídas pelos dados do tutor e pet.</p>
                            <p><strong>Edição:</strong> Clique diretamente no documento A4 para editar o conteúdo antes de imprimir.</p>
                        </div>
                    </div>
                )}
            </div>
        </BaseAttendanceDialog>
    )
}
