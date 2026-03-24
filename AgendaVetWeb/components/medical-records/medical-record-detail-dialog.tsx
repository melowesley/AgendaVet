'use client'

import React, { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import DOMPurify from 'dompurify'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { FileText, Printer, X } from 'lucide-react'
import type { MedicalRecord, Pet, Owner } from '@/lib/types'

interface MedicalRecordDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: MedicalRecord | null
  pet: Pet | null
  owner: Owner | null
}

const recordTypeLabels: Record<string, string> = {
  vaccination: 'Vacina',
  vacina: 'Vacina',
  diagnosis: 'Consulta',
  consulta: 'Consulta',
  prescription: 'Receita',
  receita: 'Receita',
  procedure: 'Procedimento',
  procedimento: 'Procedimento',
  'lab-result': 'Exame',
  exame: 'Exame',
  note: 'Observação',
  observacao: 'Observação',
  cirurgia: 'Cirurgia',
  internacao: 'Internação',
  peso: 'Peso',
  'banho-tosa': 'Banho e Tosa',
  obito: 'Óbito',
  documento: 'Documento',
  fotos: 'Fotos',
  video: 'Vídeo',
  retorno: 'Retorno',
  outros: 'Outros',
}

export function MedicalRecordDetailDialog({
  open,
  onOpenChange,
  record,
  pet,
  owner,
}: MedicalRecordDetailDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Registro_${pet?.name}_${format(new Date(), 'dd_MM_yyyy')}`,
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

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 no-print">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Registro
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="no-print"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Separator className="no-print" />

        {/* Conteúdo Imprimível */}
        <div ref={printRef} className="space-y-6 p-6">
          {/* Cabeçalho */}
          <div className="text-center border-b-2 border-blue-600 pb-6">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">
              REGISTRO CLÍNICO
            </h1>
            <p className="text-gray-600">AgendaVet Medical Unit v2.0</p>
            <p className="text-sm text-gray-500">
              {format(new Date(record.date), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>

          {/* Dados do Paciente e Proprietário */}
          <div className="grid grid-cols-2 gap-6">
            {/* Paciente */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-blue-600">
                DADOS DO PACIENTE
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-bold">Nome:</span> {pet?.name || 'N/A'}
                </p>
                <p>
                  <span className="font-bold">Espécie:</span>{' '}
                  {pet?.species === 'dog'
                    ? 'Canina'
                    : pet?.species === 'cat'
                      ? 'Felina'
                      : 'Animal'}
                </p>
                <p>
                  <span className="font-bold">Raça:</span> {pet?.breed || 'N/A'}
                </p>
                <p>
                  <span className="font-bold">Gênero:</span>{' '}
                  {pet?.gender || 'N/A'}
                </p>
              </div>
            </div>

            {/* Proprietário */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-blue-600">
                PROPRIETÁRIO
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-bold">Nome:</span>{' '}
                  {owner?.fullName || `${owner?.firstName ?? ''} ${owner?.lastName ?? ''}`.trim() || 'N/A'}
                </p>
                <p>
                  <span className="font-bold">Telefone:</span>{' '}
                  {owner?.whatsapp || owner?.phone || 'N/A'}
                </p>
                <p>
                  <span className="font-bold">Email:</span> {owner?.email || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Detalhes do Registro */}
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-3 text-blue-600">
              INFORMAÇÕES DO REGISTRO
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p>
                <span className="font-bold">Tipo:</span>{' '}
                {recordTypeLabels[record.type] || record.type}
              </p>
              <p>
                <span className="font-bold">Veterinário:</span>{' '}
                {record.veterinarian || 'N/A'}
              </p>
              <p>
                <span className="font-bold">Data:</span>{' '}
                {format(new Date(record.date), 'dd/MM/yyyy HH:mm')}
              </p>
              <p>
                <span className="font-bold">Título:</span> {record.title}
              </p>
            </div>
          </div>

          {/* Conteúdo do Registro */}
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-3 text-blue-600">
              DESCRIÇÃO
            </h3>
            <div
              className="prose prose-sm max-w-none bg-gray-50 p-4 rounded border border-gray-200"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(record.description || ''),
              }}
            />
          </div>

          {/* Assinatura */}
          <div className="mt-12 pt-8 border-t-2 border-blue-600 text-center">
            <div className="border-t-2 border-blue-600 w-80 mx-auto mb-2"></div>
            <p className="font-bold text-lg text-blue-600">
              {record.veterinarian || 'Veterinário'}
            </p>
            <p className="text-sm">Médico Veterinário Responsável</p>
            <p className="text-xs mt-2">
              {format(new Date(record.date), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        {/* Separador */}
        <Separator className="no-print" />

        {/* Rodapé com Botões */}
        <DialogFooter className="flex gap-2 no-print">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            onClick={() => handlePrint()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
