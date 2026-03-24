'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePet, useOwner } from '@/lib/data-store'
import { createClient } from '@/lib/supabase/client'
import { BaseAttendanceDialog } from '@/components/admin/shared/base-attendance-dialog'
import { useReactToPrint } from 'react-to-print'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { FileText, User, Activity, Shield } from 'lucide-react'
import { toast } from 'sonner'

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" />,
})

interface MedicalRecordFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  petId?: string
  defaultType?: 'note' | 'diagnosis' | 'observation'
}

const typeOptions = [
  { value: 'note', label: 'Observação' },
  { value: 'diagnosis', label: 'Diagnóstico' },
  { value: 'observation', label: 'Evolução Clínica' },
]

const veterinarians = [
  'Dr. Cleyton Chaves',
  'Dr. Amanda Foster',
  'Dr. James Wilson',
  'Dr. Sarah Chen',
]

export function MedicalRecordFormDialog({
  open,
  onOpenChange,
  petId,
  defaultType = 'note',
}: MedicalRecordFormDialogProps) {
  const { pet } = usePet(petId || '')
  const { owner } = useOwner(pet?.profileId || '')

  const [recordType, setRecordType] = useState<'note' | 'diagnosis' | 'observation'>(defaultType)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [veterinarian, setVeterinarian] = useState('Dr. Cleyton Chaves')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Registro_Medico_${pet?.name}_${format(new Date(), 'dd_MM_yyyy')}`,
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
        html { margin: 0; padding: 0; }
        .no-print { display: none !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
    `,
  })

  useEffect(() => {
    if (defaultType) {
      setRecordType(defaultType)
    }
  }, [defaultType])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Título é obrigatório'
    }

    if (!content.trim() || content === '<p><br></p>') {
      newErrors.content = 'Descrição é obrigatória'
    }

    if (!veterinarian) {
      newErrors.veterinarian = 'Veterinário é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    if (!petId) {
      toast.error('Pet não selecionado')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Sanitizar conteúdo HTML
      const sanitizedContent = DOMPurify.sanitize(content)

      // Salvar no Supabase
      const { error } = await supabase
        .from('medical_records')
        .insert([
          {
            pet_id: petId,
            type: recordType,
            title: title.trim(),
            description: sanitizedContent,
            veterinarian: veterinarian,
            date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            created_at: new Date().toISOString(),
          },
        ])

      if (error) {
        console.error('Erro ao salvar registro:', error)
        toast.error(`Erro ao salvar: ${error.message}`)
        return
      }

      toast.success('Registro médico salvo com sucesso!')

      // Limpar formulário
      setTitle('')
      setContent('')
      setRecordType(defaultType)
      setVeterinarian('Dr. Cleyton Chaves')
      setErrors({})

      // Fechar diálogo
      onOpenChange(false)
    } catch (err) {
      console.error('Erro ao salvar registro:', err)
      toast.error('Erro ao salvar registro médico')
    } finally {
      setLoading(false)
    }
  }

  const getRecordTitle = () => {
    switch (recordType) {
      case 'diagnosis':
        return 'RELATÓRIO DE DIAGNÓSTICO'
      case 'observation':
        return 'EVOLUÇÃO CLÍNICA'
      default:
        return 'REGISTRO MÉDICO'
    }
  }

  const previewContent = (
    <div className="space-y-8">
      {/* Cabeçalho com Selo de Código */}
      <div className="flex justify-between items-start border-b-2 border-blue-600 pb-6">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold mb-2 text-blue-600 flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            REGISTRO CLÍNICO
          </h1>
          <p className="text-lg text-gray-700">AgendaVet Medical Unit v2.0</p>
          <p className="text-sm text-gray-500">Clínica Veterinária Especializada</p>
          <p className="text-xs mt-2">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
        </div>

        {/* Selo de Código */}
        <div className="bg-blue-600 border-2 border-blue-700 rounded-lg p-4 text-center shadow-lg">
          <Shield className="w-8 h-8 text-white mx-auto mb-2" />
          <div className="text-white font-bold text-xs">CÓDIGO</div>
          <div className="text-white text-lg font-black">
            RC-{format(new Date(), 'yyyyMMdd')}-{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}
          </div>
        </div>
      </div>

      {/* Cards de Dados (Lado a Lado) */}
      <div className="grid grid-cols-2 gap-6">
        {/* Card 1: DADOS DO PACIENTE */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-md">
          <h3 className="font-bold text-lg mb-4 text-blue-600 flex items-center gap-2">
            <User className="w-5 h-5" />
            DADOS DO PACIENTE
          </h3>
          <div className="space-y-2">
            <p><span className="font-bold">Nome:</span> {pet?.name || 'Paciente'}</p>
            <p>
              <span className="font-bold">Espécie:</span>{' '}
              {pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'}
            </p>
            <p><span className="font-bold">Raça:</span> {pet?.breed || 'Não informada'}</p>
            <p>
              <span className="font-bold">Idade:</span>{' '}
              {pet
                ? Math.floor((new Date().getTime() - new Date(pet.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) + ' anos'
                : 'Não informada'}
            </p>
            <p>
              <span className="font-bold">Sexo:</span>{' '}
              {pet?.gender === 'Macho' ? 'Macho' : pet?.gender === 'Fêmea' ? 'Fêmea' : 'Não informado'}
            </p>
          </div>
        </div>

        {/* Card 2: DETALHES DO ATENDIMENTO */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-md">
          <h3 className="font-bold text-lg mb-4 text-blue-600 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            DETALHES DO ATENDIMENTO
          </h3>
          <div className="space-y-2">
            <p><span className="font-bold">Veterinário:</span> {veterinarian}</p>
            <p><span className="font-bold">Data:</span> {format(new Date(), 'dd/MM/yyyy')}</p>
            <p>
              <span className="font-bold">Tipo de Registro:</span>{' '}
              {typeOptions.find((t) => t.value === recordType)?.label}
            </p>
            <p>
              <span className="font-bold">Proprietário:</span>{' '}
              {owner?.fullName || 'Proprietário S/R'}
            </p>
          </div>
        </div>
      </div>

      {/* Título do Registro */}
      {title && (
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-lg mb-3 text-blue-600">TÍTULO</h3>
          <div className="bg-gray-50 border border-gray-200 p-3 rounded">
            <p className="text-lg font-semibold">{title}</p>
          </div>
        </div>
      )}

      {/* Conteúdo do Registro */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
        <h3 className="font-bold text-lg mb-3 text-blue-600">
          {recordType === 'diagnosis'
            ? 'DIAGNÓSTICO E CONDUTA'
            : recordType === 'observation'
            ? 'EVOLUÇÃO E OBSERVAÇÕES'
            : 'DESCRIÇÃO CLÍNICA'}
        </h3>
        <div className="bg-gray-50 border border-gray-200 p-4 rounded min-h-[300px]">
          <div
            className="text-base leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html:
                DOMPurify.sanitize(content) ||
                '<p class="text-gray-500">Conteúdo do registro a ser adicionado...</p>',
            }}
          />
        </div>
      </div>

      {/* Seções Específicas por Tipo */}
      {recordType === 'diagnosis' && (
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-lg mb-3 text-blue-600">PLANO TERAPÊUTICO</h3>
          <div className="bg-gray-50 border border-gray-200 p-4 rounded min-h-[150px]">
            <p className="text-base leading-relaxed text-gray-600">
              Plano terapêutico a ser definido pelo veterinário...
            </p>
          </div>
        </div>
      )}

      {recordType === 'observation' && (
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-lg mb-3 text-blue-600">PRÓXIMOS PASSOS</h3>
          <div className="bg-gray-50 border border-gray-200 p-4 rounded min-h-[100px]">
            <p className="text-base leading-relaxed text-gray-600">
              Próximos passos e acompanhamento a serem definidos...
            </p>
          </div>
        </div>
      )}

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
      title={getRecordTitle()}
      previewContent={previewContent}
      onSave={handleSave}
      saveLabel="Salvar Registro"
      isSaving={loading}
      printTitle={`Registro_${pet?.name}_${format(new Date(), 'dd_MM_yyyy')}`}
    >
      <div className="space-y-6">
        {/* Tipo de Registro */}
        <div>
          <Label className="text-sm font-bold">Tipo de Registro</Label>
          <Select value={recordType} onValueChange={(value: any) => setRecordType(value)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Título */}
        <div>
          <Label className="text-sm font-bold">
            Título do Registro{' '}
            {errors.title && <span className="text-red-500">*</span>}
          </Label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (errors.title) setErrors({ ...errors, title: '' })
            }}
            placeholder="Ex: Consulta de rotina - Avaliação geral"
            className={`h-9 ${errors.title ? 'border-red-500' : ''}`}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Veterinário */}
        <div>
          <Label className="text-sm font-bold">
            Veterinário Responsável{' '}
            {errors.veterinarian && <span className="text-red-500">*</span>}
          </Label>
          <Select value={veterinarian} onValueChange={setVeterinarian}>
            <SelectTrigger className={`h-9 ${errors.veterinarian ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Selecione o veterinário" />
            </SelectTrigger>
            <SelectContent>
              {veterinarians.map((vet) => (
                <SelectItem key={vet} value={vet}>
                  {vet}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.veterinarian && (
            <p className="text-xs text-red-500 mt-1">{errors.veterinarian}</p>
          )}
        </div>

        {/* Rich Text Editor */}
        <div>
          <Label className="text-sm font-bold">
            {recordType === 'diagnosis'
              ? 'Diagnóstico e Conduta'
              : recordType === 'observation'
              ? 'Evolução e Observações'
              : 'Descrição Clínica'}{' '}
            {errors.content && <span className="text-red-500">*</span>}
          </Label>
          <div className={`border rounded-lg ${errors.content ? 'border-red-500' : 'border-gray-200'}`}>
            <ReactQuill
              value={content}
              onChange={(value) => {
                setContent(value)
                if (errors.content) setErrors({ ...errors, content: '' })
              }}
              theme="snow"
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['clean'],
                ],
              }}
              style={{ height: '200px' }}
              placeholder={
                recordType === 'diagnosis'
                  ? 'Descreva o diagnóstico, exames realizados, conduta terapêutica e prognóstico...'
                  : recordType === 'observation'
                  ? 'Descreva a evolução do paciente, sinais clínicos, resposta ao tratamento...'
                  : 'Descreva os detalhes clínicos, histórico, achados do exame físico...'
              }
            />
          </div>
          {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
        </div>

        {/* Informações do Paciente (Somente Leitura) */}
        {pet && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-bold text-sm mb-2">
              Dados do Paciente (preenchidos automaticamente)
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <span className="font-medium">Nome:</span> {pet.name}
                </p>
                <p>
                  <span className="font-medium">Espécie:</span>{' '}
                  {pet.species === 'dog' ? 'Canina' : pet.species === 'cat' ? 'Felina' : 'Animal'}
                </p>
                <p>
                  <span className="font-medium">Raça:</span> {pet.breed}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Idade:</span>{' '}
                  {Math.floor(
                    (new Date().getTime() - new Date(pet.dateOfBirth).getTime()) /
                      (1000 * 60 * 60 * 24 * 365),
                  )}{' '}
                  anos
                </p>
                <p>
                  <span className="font-medium">Sexo:</span>{' '}
                  {pet.gender === 'Macho' ? 'Macho' : pet.gender === 'Fêmea' ? 'Fêmea' : 'Não informado'}
                </p>
                <p>
                  <span className="font-medium">Proprietário:</span>{' '}
                  {owner?.fullName || 'Proprietário S/R'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseAttendanceDialog>
  )
}
