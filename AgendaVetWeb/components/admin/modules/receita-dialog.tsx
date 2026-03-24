'use client'

import { useState, useEffect } from 'react'
import { usePet, useOwner } from '@/lib/data-store'
import { BaseAttendanceDialog } from '../shared/base-attendance-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })

interface ReceitaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    petId: string
    petName: string
}

export function ReceitaDialog({ open, onOpenChange, petId, petName }: ReceitaDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')

    const [prescricao, setPrescricao] = useState('')
    const [veterinarian, setVeterinarian] = useState('Dr. Cleyton Chaves')
    const [crmv, setCrmv] = useState('12345-SP')
    const [loading, setLoading] = useState(false)
    const [isControlled, setIsControlled] = useState(true)

    const handleSave = async () => {
        setLoading(true)
        // TODO: Implementar salvamento na tabela medical_records
        setTimeout(() => {
            setLoading(false)
            onOpenChange(false)
        }, 1000)
    }

    const previewContent = (
        <div className="space-y-0">
            {/* TOPO - Estrutura de Grade com Bordas Nítidas */}
            <div className="grid grid-cols-2 gap-0 border border-slate-300">
                {/* Lado Esquerdo - Identificação do Emitente */}
                <div className="border-r border-slate-300 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">AV</span>
                        </div>
                        <div>
                            <p className="font-bold text-sm">{veterinarian}</p>
                            <p className="text-xs">CRMV {crmv}</p>
                        </div>
                    </div>
                    <div className="text-xs space-y-1">
                        <p><span className="font-semibold">Endereço:</span> AgendaVet Medical Unit v2.0</p>
                        <p><span className="font-semibold">Telefone:</span> (11) 99999-9999</p>
                        <p><span className="font-semibold">Cidade:</span> São Paulo - SP</p>
                    </div>
                </div>
                
                {/* Lado Direito - Título Centralizado Verticalmente */}
                <div className="p-4 flex items-center justify-center">
                    <h2 className="text-xl font-bold text-center">
                        {isControlled ? 'RECEITUÁRIO DE CONTROLE ESPECIAL' : 'RECEITUÁRIO AGRONÔMICO/VETERINÁRIO'}
                    </h2>
                </div>
            </div>

            {/* DADOS DO PACIENTE E TUTOR - Tabela Única */}
            <div className="border border-t-0 border-slate-300 p-4">
                <table className="w-full text-xs">
                    <tbody>
                        <tr className="border-b border-slate-200">
                            <td className="py-2 font-semibold text-slate-600 w-1/4">Nome do Paciente:</td>
                            <td className="py-2">{petName}</td>
                            <td className="py-2 font-semibold text-slate-600 w-1/4">Nome do Tutor:</td>
                            <td className="py-2">{owner?.fullName || 'Proprietário S/R'}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                            <td className="py-2 font-semibold text-slate-600">Espécie:</td>
                            <td className="py-2">{pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'}</td>
                            <td className="py-2 font-semibold text-slate-600">Raça:</td>
                            <td className="py-2">{pet?.breed || 'Não informada'}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                            <td className="py-2 font-semibold text-slate-600">Idade:</td>
                            <td className="py-2">{pet ? Math.floor((new Date().getTime() - new Date(pet.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) + ' anos' : ''}</td>
                            <td className="py-2 font-semibold text-slate-600">Sexo:</td>
                            <td className="py-2">{pet?.gender === 'Macho' ? 'Macho' : pet?.gender === 'Fêmea' ? 'Fêmea' : 'Não informado'}</td>
                        </tr>
                        <tr>
                            <td className="py-2 font-semibold text-slate-600">Data da Prescrição:</td>
                            <td className="py-2">{format(new Date(), 'dd/MM/yyyy')}</td>
                            <td className="py-2 font-semibold text-slate-600">Endereço do Tutor:</td>
                            <td className="py-2">{owner?.address || 'Não informado'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* CAMPO DE PRESCRIÇÃO - Grande e Limpo */}
            <div className="border border-t-0 border-slate-300 p-4 min-h-[250px]">
                <h3 className="font-bold text-sm mb-4 text-slate-600">PRESCRIÇÃO</h3>
                <div className="text-xs leading-relaxed">
                    {prescricao ? (
                        <div className="prose prose-sm max-w-none" 
                             dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(prescricao) }} />
                    ) : (
                        <div className="space-y-2 text-gray-500 italic">
                            <p>• Medicamento a ser prescrito...</p>
                            <p>• Dosagem recomendada...</p>
                            <p>• Frequência de administração...</p>
                            <p>• Duração do tratamento...</p>
                            <p>• Instruções adicionais...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RODAPÉ TÉCNICO - Apenas se for Receita Controlada */}
            {isControlled && (
                <div className="grid grid-cols-2 gap-0">
                    {/* IDENTIFICAÇÃO DO COMPRADOR */}
                    <div className="border border-t-0 border-r-0 border-slate-300 p-3">
                        <h4 className="font-bold text-xs mb-3 text-slate-600">IDENTIFICAÇÃO DO COMPRADOR</h4>
                        <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <p><span className="font-semibold">Nome:</span> ___________________</p>
                                <p><span className="font-semibold">RG:</span> ___________________</p>
                            </div>
                            <p><span className="font-semibold">Endereço:</span> ______________________________________________</p>
                            <div className="grid grid-cols-2 gap-2">
                                <p><span className="font-semibold">Telefone:</span> ___________________</p>
                                <p><span className="font-semibold">Data:</span> ___/___/_____</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* IDENTIFICAÇÃO DO FORNECEDOR */}
                    <div className="border border-t-0 border-slate-300 p-3">
                        <h4 className="font-bold text-xs mb-3 text-slate-600">IDENTIFICAÇÃO DO FORNECEDOR</h4>
                        <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <p><span className="font-semibold">Nome:</span> ___________________</p>
                                <p><span className="font-semibold">Licença:</span> ___________________</p>
                            </div>
                            <p><span className="font-semibold">Endereço:</span> ______________________________________________</p>
                            <div className="grid grid-cols-2 gap-2">
                                <p><span className="font-semibold">Telefone:</span> ___________________</p>
                                <p><span className="font-semibold">Data:</span> ___/___/_____</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assinatura do Veterinário */}
            <div className="border border-t-0 border-slate-300 p-4 text-center">
                <div className="border-t border-slate-300 w-64 mx-auto mb-2"></div>
                <p className="font-bold text-sm">{veterinarian}</p>
                <p className="text-xs">CRMV {crmv}</p>
                <p className="text-xs mt-1">Assinatura do Médico Veterinário</p>
            </div>
        </div>
    )

    return (
        <BaseAttendanceDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Receita Controlada"
            previewContent={previewContent}
            onSave={handleSave}
            saveLabel="Salvar Receita"
            isSaving={loading}
            printTitle={`Receita_${petName}_${format(new Date(), 'dd_MM_yyyy')}`}
        >
            <div className="space-y-6 bg-slate-50/50 p-6 rounded-lg">
                {/* Toggle de Tipo de Receita */}
                <div className="flex items-center justify-between bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <div>
                        <Label className="text-sm font-bold text-slate-600 font-semibold">Tipo de Receita</Label>
                        <p className="text-xs text-slate-500 mt-1">
                            {isControlled ? 'Receituário de Controle Especial' : 'Receituário Agronômico/Veterinário'}
                        </p>
                    </div>
                    <Switch
                        checked={isControlled}
                        onCheckedChange={setIsControlled}
                    />
                </div>

                {/* Rich Text Editor para Prescrição */}
                <div className="bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <Label className="text-sm font-bold text-slate-600 font-semibold">Prescrição Médica</Label>
                    <div className="mt-2 border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
                        <ReactQuill
                            value={prescricao}
                            onChange={setPrescricao}
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
                            placeholder="Descreva a prescrição completa: medicamentos, dosagens, frequência, duração..."
                        />
                    </div>
                </div>

                {/* Dados do Veterinário */}
                <div className="bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600 mb-4">
                        <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">M</span>
                        </span>
                        Dados do Emitente
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-bold text-slate-600 font-semibold">Veterinário</Label>
                            <Input
                                value={veterinarian}
                                onChange={(e) => setVeterinarian(e.target.value)}
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-slate-600 font-semibold">CRMV</Label>
                            <Input
                                value={crmv}
                                onChange={(e) => setCrmv(e.target.value)}
                                className="h-9 bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </BaseAttendanceDialog>
    )
}
