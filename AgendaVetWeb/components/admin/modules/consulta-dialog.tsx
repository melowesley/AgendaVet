'use client'

import { useState } from 'react'
import { supabase } from '@/lib/data-store'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })

import { usePet, useOwner, useMedicalRecords } from '@/lib/data-store'
import { useAISecretary } from '@/hooks/useAISecretary'
import { BaseAttendanceDialog } from '@/components/admin/shared/base-attendance-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'

interface ConsultaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

export function ConsultaDialog({ open, onOpenChange, onBack, petId, petName }: ConsultaDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')
    const { records: allRecords } = useMedicalRecords(petId)
    const { askSecretary, memorizeCase, isLoading: isAILoading } = useAISecretary()

    const isFemale = pet?.gender === 'Fêmea'
    const themeColor = {
        bg: isFemale ? 'bg-pink-600' : 'bg-blue-600',
        bgHover: isFemale ? 'hover:bg-pink-700' : 'hover:bg-blue-700',
        bgGhost: isFemale ? 'bg-pink-500/10' : 'bg-blue-500/10',
        bgLight: isFemale ? 'bg-pink-50' : 'bg-blue-50',
        text: isFemale ? 'text-pink-600' : 'text-blue-600',
        border: isFemale ? 'border-pink-500' : 'border-blue-500',
        borderLight: isFemale ? 'border-pink-200' : 'border-blue-200',
    }

    const [loading, setLoading] = useState(false)
    const [queixa, setQueixa] = useState('')
    const [anamnese, setAnamnese] = useState('')
    const [exameFisico, setExameFisico] = useState('')
    const [suspeita, setSuspeita] = useState('')
    const [tratamento, setTratamento] = useState('')
    const [veterinarian, setVeterinarian] = useState('Dr. Cleyton Chaves')
    const [prescriptionDate, setPrescriptionDate] = useState(format(new Date(), 'yyyy-MM-dd'))

    // Billing state
    const [baseValue, setBaseValue] = useState('0.00')
    const [services, setServices] = useState<{ id: string, name: string, value: number }[]>([])

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ]
    }

    const handleAISuggestion = async () => {
        if (!queixa) {
            return
        }

        try {
            const sintomas = `${queixa}. ${anamnese.replace(/<[^>]*>?/gm, '')}`
            
            const suggestion = await askSecretary('gemini', {
                sintomas: sintomas
            })

            const suggestionText = suggestion?.candidates?.[0]?.content?.parts?.[0]?.text || "Não foi possível obter uma sugestão clara."
            
            setTratamento(prev => prev + `<p><strong>✨ Sugestão da IA:</strong> ${suggestionText}</p>`)
            
        } catch (error) {
        }
    }

    const handleSave = async () => {
        if (!queixa) {
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const recordData = {
                pet_id: petId,
                user_id: userData.user?.id,
                type: 'diagnosis',
                title: 'Consulta Clínica',
                description: JSON.stringify({
                    queixa,
                    anamnese,
                    exameFisico,
                    suspeita,
                    tratamento,
                    billing: {
                        baseValue: parseFloat(baseValue),
                        services: services,
                        total: parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)
                    }
                }),
                date: new Date().toISOString(),
                veterinarian: veterinarian || 'Dr. Cleyton Chaves',
            }

            const { error } = await (supabase.from('medical_records' as any).insert([recordData] as any) as any)

            if (error) throw error

            memorizeCase({
                ...recordData,
                pet_name: petName,
                pet_species: pet?.species,
                pet_gender: pet?.gender
            })

            mutate('medical-records')
            onOpenChange(false)
        } catch (error: any) {
        } finally {
            setLoading(false)
        }
    }

    const previewContent = (
        <div className={`w-full max-w-[650px] min-h-[920px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm border p-12 flex flex-col text-slate-900 ${themeColor.borderLight} border-t-8 ${themeColor.border}`}>
            <div className={`border-b-2 pb-6 mb-8 flex justify-between items-end ${themeColor.border}`}>
                <div>
                    <h2 className={`text-2xl font-bold uppercase tracking-widest ${themeColor.text}`}>Ficha de Consulta Clínica</h2>
                    <p className="text-[10px] opacity-70 mt-1 uppercase">Relatório de Atendimento Veterinário</p>
                </div>
                <div className={`text-right ${themeColor.text}`}>
                    <p className="text-[8px] font-bold text-slate-400">AgendaVet Medical Unit v2.0</p>
                </div>
            </div>

            <div className="border border-slate-400 p-5 mb-8 rounded-sm bg-slate-50/30">
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">DADOS DO PACIENTE</p>
                        <div className="space-y-0.5 border-t border-slate-200 pt-1 text-[10px]">
                            <p><span className="font-bold w-12 inline-block text-slate-700">Paciente:</span> {petName}</p>
                            <p><span className="font-bold w-12 inline-block text-slate-700">Espécie:</span> {pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'} | {pet?.breed}</p>
                            <p><span className="font-bold w-12 inline-block text-slate-700">Peso:</span> {pet?.weight || '-'} kg | Sexo: {pet?.gender}</p>
                        </div>
                    </div>
                    <div className="space-y-1.5 border-l border-slate-200 pl-6 text-right">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">DADOS DO TUTOR</p>
                        <div className="space-y-0.5 border-t border-slate-200 pt-1 text-[10px]">
                            <p><span className="font-bold text-slate-700">Tutor:</span> {owner?.fullName || 'Proprietário S/R'}</p>
                            <p>{owner?.phone || 'Sem contato registrado'}</p>
                            <p className="text-[11px] font-bold text-slate-800 mt-2">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-8 text-slate-800">
                <section className="border-l-4 border-slate-300 pl-4 py-1">
                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} flex items-center gap-2`}>
                        <span className="size-1.5 rounded-full bg-slate-400"></span> Anamnese e Queixa Principal
                    </h3>
                    <p className="text-[13px] font-bold mb-2 text-slate-900 leading-tight">"{queixa || "O paciente apresenta..."}"</p>
                    <div className="text-[11px] leading-relaxed prose prose-sm max-w-none text-slate-700 break-words break-all whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(anamnese || "Histórico clínico inicial...") }} />
                </section>

                <section className="border-l-4 border-slate-300 pl-4 py-1">
                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} flex items-center gap-2`}>
                        <span className="size-1.5 rounded-full bg-slate-400"></span> Exames Físicos e Clínicos
                    </h3>
                    <div className="text-[11px] leading-relaxed prose prose-sm max-w-none text-slate-700 break-words break-all whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(exameFisico || "Mucosas, TPC, FC, FR...") }} />
                </section>

                <section className={`p-5 rounded-sm bg-white border border-slate-400 relative overflow-hidden`}>
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${themeColor.bg}`}></div>
                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text}`}>Diagnóstico / Suspeita Médica</h3>
                    <p className="text-[15px] font-bold italic text-slate-900">{suspeita || "Em investigação..."}</p>
                </section>

                <section className="border-l-4 border-slate-300 pl-4 py-1">
                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} flex items-center gap-2`}>
                        <span className="size-1.5 rounded-full bg-slate-400"></span> Conduta e Recomendações
                    </h3>
                    <div className="text-[11px] leading-relaxed prose prose-sm max-w-none text-slate-700 break-words break-all whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tratamento || "Conduta médica prescrita...") }} />
                </section>

                {(parseFloat(baseValue) > 0 || services.length > 0) && (
                    <div className="mt-8 border border-slate-400 rounded-sm overflow-hidden bg-white shadow-sm">
                        <div className={`px-4 py-1.5 text-[9px] font-bold uppercase text-white tracking-widest ${themeColor.bg}`}>Resumo Financeiro do Atendimento</div>
                        <div className="p-4 space-y-2">
                            <div className="flex justify-between text-[11px] border-b border-slate-100 pb-1">
                                <span className="text-slate-600 font-medium whitespace-nowrap">Consulta Clínica Geral</span>
                                <span className="font-bold text-slate-900">R$ {parseFloat(baseValue).toFixed(2)}</span>
                            </div>
                            {services.map(s => (
                                <div key={s.id} className="flex justify-between text-[11px] border-b border-slate-100 pb-1">
                                    <span className="text-slate-600 font-medium truncate pr-4">{s.name}</span>
                                    <span className="font-bold text-slate-900">R$ {s.value.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className={`flex justify-between pt-2 mt-2 font-bold text-base ${themeColor.text}`}>
                                <span>VALOR TOTAL</span>
                                <span>R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-auto pt-12 flex justify-between items-end border-t border-slate-100 italic">
                <div className="text-[8px] opacity-40 leading-tight max-w-[200px]">
                    Relatório gerado via AgendaVet. As informações contidas neste documento são de responsabilidade do médico veterinário.
                </div>
                <div className="text-center w-64">
                    <div className={`h-[1px] w-full bg-slate-400 mb-2`}></div>
                    <p className="text-[11px] font-bold uppercase text-slate-800">{veterinarian || 'Dr. Cleyton Chaves'}</p>
                    <p className="text-[9px] text-slate-500 font-medium">Médico Veterinário • CRMV-SP</p>
                </div>
            </div>
        </div>
    )

    return (
        <BaseAttendanceDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Atendimento Clínico"
            previewContent={previewContent}
            onSave={handleSave}
            saveLabel="Finalizar Atendimento"
            isSaving={loading}
            printTitle={`Consulta_${petName}_${format(new Date(), 'dd_MM_yyyy')}`}
            onBack={onBack}
        >
            <div className="space-y-6 bg-slate-50/50 p-6 rounded-lg">
                <Tabs defaultValue="anamnese" className="w-full">
                    <TabsList className={`grid w-full grid-cols-2 mb-6 p-1 bg-white/80 border border-slate-200 rounded-lg shadow-sm`}>
                        <TabsTrigger value="anamnese" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-blue-500/20">Anamnese</TabsTrigger>
                        <TabsTrigger value="exame" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-blue-500/20">Exame & Diagnóstico</TabsTrigger>
                    </TabsList>

                    <TabsContent value="anamnese" className="space-y-4 m-0">
                        <div className="space-y-2">
                            <Label htmlFor="queixa" className="text-xs font-bold uppercase tracking-wider text-slate-600 font-semibold">Queixa Principal *</Label>
                            <Input
                                id="queixa"
                                value={queixa}
                                onChange={(e) => setQueixa(e.target.value)}
                                placeholder="O que trouxe o paciente hoje?"
                                className="bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="anamnese_det" className="text-xs font-bold uppercase tracking-wider text-slate-600 font-semibold">Anamnese Detalhada</Label>
                            <div className="bg-white text-black rounded-md overflow-hidden border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20">
                                <ReactQuill
                                    theme="snow"
                                    value={anamnese}
                                    onChange={setAnamnese}
                                    modules={modules}
                                    className="h-[150px] mb-12"
                                    placeholder="Histórico, sintomas, duração..."
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="exame" className="space-y-4 m-0">
                        <div className="space-y-2">
                            <Label htmlFor="exame_fis" className="text-xs font-bold uppercase tracking-wider text-slate-600 font-semibold">Exame Físico</Label>
                            <div className="bg-white text-black rounded-md overflow-hidden border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20">
                                <ReactQuill
                                    theme="snow"
                                    value={exameFisico}
                                    onChange={setExameFisico}
                                    modules={modules}
                                    className="h-[120px] mb-12"
                                    placeholder="Mucosas, TPC, FC, FR, Temperatura..."
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="suspeita" className="text-xs font-bold uppercase tracking-wider text-slate-600 font-semibold cursor-pointer group flex items-center gap-2">
                                    Conclusão / Diagnóstico
                                </Label>
                            </div>
                            <Input
                                id="suspeita"
                                value={suspeita}
                                onChange={(e) => setSuspeita(e.target.value)}
                                placeholder="Diagnóstico definitivo ou suspeito"
                                className="h-10 text-sm font-bold bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tratamento" className="text-xs font-bold uppercase tracking-wider text-slate-600 font-semibold">Conduta / Tratamento</Label>
                            <div className="bg-white text-black rounded-md overflow-hidden border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20">
                                <ReactQuill
                                    theme="snow"
                                    value={tratamento}
                                    onChange={setTratamento}
                                    modules={modules}
                                    className="h-[120px] mb-12"
                                    placeholder="Medicamentos, exames solicitados, recomendações..."
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className={`p-4 rounded-xl border border-white/50 shadow-sm bg-white/80 space-y-3`}>
                    <div className={`flex items-center gap-2 ${themeColor.text} font-bold text-xs uppercase tracking-wider`}>
                        Serviços e Faturamento
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-slate-600 font-semibold">Valor da Consulta (R$)</Label>
                            <Input
                                type="number"
                                value={baseValue}
                                onChange={(e) => setBaseValue(e.target.value)}
                                className="h-8 text-sm bg-white border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className={`pt-2 border-t ${themeColor.border}/20 flex justify-between items-center text-sm font-bold ${themeColor.text}`}>
                        <span>Total:</span>
                        <span>R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </BaseAttendanceDialog>
    )
}
