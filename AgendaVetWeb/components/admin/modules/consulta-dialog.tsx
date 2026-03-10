'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/data-store'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })
import { useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Stethoscope, Save, ArrowLeft, Plus, History, Printer, PawPrint, DollarSign, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactToPrint from 'react-to-print'
import { usePet, useOwner } from '@/lib/data-store'
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

    const printRef = useRef<HTMLDivElement>(null)

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ]
    }

    const handleSave = async () => {
        if (!queixa) {
            toast.error('A queixa principal é obrigatória')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            // Save to medical_records as a general record for now
            // Eventually we can use the specialized anamnesis table
            const { error } = await (supabase.from('medical_records' as any).insert([{
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
            }] as any) as any)

            if (error) throw error
            mutate('medical-records')
            toast.success('Consulta registrada com sucesso!')
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar consulta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-screen-2xl h-[90vh] p-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-6 pb-2 border-b border-border/30 bg-muted/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                                <ArrowLeft className="size-4" />
                            </Button>
                            <div>
                                <DialogTitle className="flex items-center gap-2 text-xl">
                                    <Stethoscope className={`size-5 ${themeColor.text}`} />
                                    Atendimento Clínico: <span className={themeColor.text}>{petName}</span>
                                </DialogTitle>
                                <DialogDescription>Registro completo de anamnese, exame físico e conduta médica</DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handleSave} disabled={loading} className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                                <Save className="size-4 mr-2" />
                                {loading ? 'Salvando...' : 'Salvar Registro'}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Form Side */}
                    <div className="w-full md:w-1/2 p-6 border-r border-border/30 overflow-y-auto">
                        <div className="space-y-6">
                            <Tabs defaultValue="anamnese" className="w-full">
                                <TabsList className={`grid w-full grid-cols-2 mb-6 p-1 bg-muted/50 rounded-lg`}>
                                    <TabsTrigger value="anamnese" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Anamnese</TabsTrigger>
                                    <TabsTrigger value="exame" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Exame & Diagnóstico</TabsTrigger>
                                </TabsList>

                                <TabsContent value="anamnese" className="space-y-4 m-0">
                                    <div className="space-y-2">
                                        <Label htmlFor="queixa" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Queixa Principal *</Label>
                                        <Input
                                            id="queixa"
                                            value={queixa}
                                            onChange={(e) => setQueixa(e.target.value)}
                                            placeholder="O que trouxe o paciente hoje?"
                                            className="focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="anamnese_det" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Anamnese Detalhada</Label>
                                        <div className="bg-white text-black rounded-md overflow-hidden border border-input shadow-inner">
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
                                        <Label htmlFor="exame_fis" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exame Físico</Label>
                                        <div className="bg-white text-black rounded-md overflow-hidden border border-input shadow-inner">
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
                                        <Label htmlFor="suspeita" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conclusão / Diagnóstico</Label>
                                        <Input
                                            id="suspeita"
                                            value={suspeita}
                                            onChange={(e) => setSuspeita(e.target.value)}
                                            placeholder="Diagnóstico definitivo ou suspeito"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tratamento" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conduta / Tratamento</Label>
                                        <div className="bg-white text-black rounded-md overflow-hidden border border-input shadow-inner">
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

                            {/* Billing Section */}
                            <div className={`p-4 rounded-xl border-2 border-dashed ${themeColor.border}/20 ${themeColor.bgLight}/30 space-y-3`}>
                                <div className={`flex items-center gap-2 ${themeColor.text} font-bold text-xs uppercase tracking-wider`}>
                                    <DollarSign className="size-4" />
                                    Serviços e Faturamento
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Valor da Consulta (R$)</Label>
                                        <Input
                                            type="number"
                                            value={baseValue}
                                            onChange={(e) => setBaseValue(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`w-full h-8 text-[10px] ${themeColor.border}/30 ${themeColor.text}`}
                                            onClick={() => setServices([...services, { id: Math.random().toString(), name: 'Procedimento Extra', value: 0 }])}
                                        >
                                            <Plus className="size-3 mr-1" /> Add Serviço
                                        </Button>
                                    </div>
                                </div>

                                {services.map((service, idx) => (
                                    <div key={service.id} className="flex gap-2 items-center">
                                        <Input
                                            value={service.name}
                                            onChange={(e) => {
                                                const newServices = [...services]
                                                newServices[idx].name = e.target.value
                                                setServices(newServices)
                                            }}
                                            placeholder="Nome do serviço"
                                            className="h-7 text-[10px] flex-1"
                                        />
                                        <Input
                                            type="number"
                                            value={service.value}
                                            onChange={(e) => {
                                                const newServices = [...services]
                                                newServices[idx].value = parseFloat(e.target.value) || 0
                                                setServices(newServices)
                                            }}
                                            className="h-7 text-[10px] w-16"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-destructive"
                                            onClick={() => setServices(services.filter((_, i) => i !== idx))}
                                        >
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </div>
                                ))}

                                <div className={`pt-2 border-t ${themeColor.border}/20 flex justify-between items-center text-sm font-bold ${themeColor.text}`}>
                                    <span>Total:</span>
                                    <span>R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={handleSave} disabled={loading} className={`flex-1 ${themeColor.bg} ${themeColor.bgHover} text-white shadow-lg`}>
                                    <Save className="size-4 mr-2" />
                                    {loading ? 'Salvando...' : 'Finalizar Atendimento'}
                                </Button>

                                {/* @ts-ignore */}
                                <ReactToPrint
                                    trigger={() => (
                                        <Button variant="outline" className="flex-1">
                                            <Printer className="size-4 mr-2" />
                                            Gerar PDF/A4
                                        </Button>
                                    )}
                                    content={() => printRef.current}
                                    documentTitle={`Consulta_${petName}_${format(new Date(), 'dd_MM_yyyy')}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className="hidden md:block w-1/2 bg-muted/10 p-8 overflow-y-auto">
                        <div
                            ref={printRef}
                            className={`w-full max-w-[600px] mx-auto aspect-[1/1.414] bg-white shadow-2xl rounded-sm border-2 p-8 flex flex-col text-slate-900 ${themeColor.borderLight}`}
                        >
                            <div className={`border-b-2 pb-4 mb-6 flex justify-between items-end ${themeColor.border}`}>
                                <div>
                                    <h2 className={`text-xl font-bold uppercase tracking-widest ${themeColor.text}`}>Ficha de Consulta Clínica</h2>
                                    <p className="text-[10px] opacity-70 mt-1 uppercase">Relatório de Atendimento Veterinário</p>
                                </div>
                                <div className={`text-right ${themeColor.text}`}>
                                    <Stethoscope className="size-8 ml-auto mb-1 opacity-20" />
                                    <p className="text-[8px] font-bold">AgendaVet System v2.0</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8 bg-muted/20 p-4 rounded-lg border border-border/50">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Paciente</p>
                                    <p className="text-sm font-bold">{petName}</p>
                                    <p className="text-[10px] opacity-70">Espécie: {pet?.species} | Raça: {pet?.breed}</p>
                                    <p className="text-[10px] opacity-70">Sexo: {pet?.gender} | Peso: {pet?.weight || '-'} kg</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Tutor(a)</p>
                                    <p className="text-sm font-bold">{owner?.fullName || 'S/R'}</p>
                                    <p className="text-[10px] opacity-70">Propriedade de {owner?.firstName}</p>
                                    <p className="text-[10px] opacity-70">{owner?.phone || 'Sem contato'}</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-6 text-slate-800">
                                <section>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Anamnese e Queixa Principal</h3>
                                    <p className="text-xs font-bold mb-2">"{queixa || "O paciente apresenta..."}"</p>
                                    <div className="text-[11px] leading-relaxed prose prose-sm max-w-none prose-p:my-0.5" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(anamnese || "Histórico clínico inicial...") }} />
                                </section>

                                <section>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Exames Físicos e Clínicos</h3>
                                    <div className="text-[11px] leading-relaxed prose prose-sm max-w-none prose-p:my-0.5" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(exameFisico || "Mucosas, TPC, FC, FR...") }} />
                                </section>

                                <section className={`p-4 rounded-lg bg-muted/30 border-l-4 ${themeColor.border}`}>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text}`}>Diagnóstico / Suspeita</h3>
                                    <p className="text-sm font-bold italic">{suspeita || "Em investigação..."}</p>
                                </section>

                                <section>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${themeColor.text} border-b pb-1`}>Tratamento e Recomendações</h3>
                                    <div className="text-[11px] leading-relaxed prose prose-sm max-w-none prose-p:my-0.5" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tratamento || "Conduta médica prescrita...") }} />
                                </section>

                                {(parseFloat(baseValue) > 0 || services.length > 0) && (
                                    <div className="mt-4 border border-blue-500/10 rounded-lg overflow-hidden bg-white">
                                        <div className={`px-3 py-1 text-[9px] font-bold uppercase text-white ${themeColor.bg}`}>Resumo Financeiro do Atendimento</div>
                                        <div className="p-3 space-y-1">
                                            <div className="flex justify-between text-[11px]">
                                                <span>Consulta Clínica Geral</span>
                                                <span>R$ {parseFloat(baseValue).toFixed(2)}</span>
                                            </div>
                                            {services.map(s => (
                                                <div key={s.id} className="flex justify-between text-[11px]">
                                                    <span>{s.name}</span>
                                                    <span>R$ {s.value.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className={`flex justify-between pt-1 mt-1 border-t-2 font-bold text-sm ${themeColor.text}`}>
                                                <span>Valor Total</span>
                                                <span>R$ {(parseFloat(baseValue) + services.reduce((acc, s) => acc + s.value, 0)).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-8 flex justify-between items-end border-t border-dashed">
                                <div className="text-[9px] opacity-40 italic">Documento gerado eletronicamente em {format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
                                <div className="text-center w-56">
                                    <div className={`h-[1px] w-full ${themeColor.border} mb-2`}></div>
                                    <p className="text-[10px] font-bold uppercase">{veterinarian || 'Dr. Cleyton Chaves'}</p>
                                    <p className="text-[8px] opacity-60">Médico Veterinário • CRMV-SP</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    )
}
