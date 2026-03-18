'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/data-store'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[150px] w-full animate-pulse bg-muted rounded-md" /> })
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
import { Stethoscope, Save, ArrowLeft, Plus, History, Printer, PawPrint, DollarSign, Trash2, Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useReactToPrint } from 'react-to-print'
import { usePet, useOwner, useMedicalRecords } from '@/lib/data-store'
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
    const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Consulta_${petName}_${format(new Date(), 'dd_MM_yyyy')}` })

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
            <DialogContent className="w-[95vw] max-w-[1400px] h-[90vh] max-h-[90vh] rounded-2xl p-0 flex flex-col overflow-hidden border border-border/20 shadow-2xl">
                <DialogHeader className="p-4 md:p-6 border-b border-border/50 bg-white flex flex-row items-center justify-between shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100" onClick={onBack}>
                                <ArrowLeft className="size-5" />
                            </Button>
                        )}
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md" style={{background: 'linear-gradient(135deg, #13C8CC, #002653)'}}>
                            <Stethoscope className="size-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800 flex items-center" style={{background: 'linear-gradient(to right, #13C8CC, #002653)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                                AgendaVet
                            </DialogTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 font-medium">
                                <span className="flex items-center gap-1"><PawPrint className="size-3.5" /> <span className="font-bold text-slate-700">{petName}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 font-bold text-slate-500 uppercase tracking-tighter text-[11px] bg-slate-100 px-2 py-0.5 rounded">Ficha Clínica</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-bold text-slate-500">
                            Fechar
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className="h-10 px-6 font-black text-white shadow-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700">
                            <Save className="size-4 mr-2" />
                            {loading ? 'Salvando...' : 'Finalizar Atendimento'}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex bg-slate-100/50">
                    {/* NEW: Left Sidebar with Patient History - Styled more like a column */}
                    <div className="hidden xl:block w-[380px] bg-slate-50/80 border-r border-border/30 p-8 overflow-y-auto shrink-0 shadow-inner">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-l-4 border-blue-500 pl-4 mb-8">
                            Histórico do Paciente
                        </h3>
                        
                        {allRecords.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center gap-4 opacity-50">
                                <Clock className="size-10 text-slate-300" />
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Sem registros prévios</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {allRecords.map(record => (
                                    <div key={record.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-500 transition-all hover:shadow-md group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[11px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-[3px]">
                                                {format(new Date(record.date || record.createdAt), "dd/MM/yyyy")}
                                            </span>
                                            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                {record.type}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-800 line-clamp-2 leading-snug">{record.title}</h4>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Side */}
                    <div className="w-full md:w-[450px] p-8 bg-white border-r border-border/30 overflow-y-auto shrink-0 shadow-lg z-10 relative">
                        <div className="space-y-8">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-l-4 border-slate-900 pl-4">
                                Registro de Atendimento
                            </h3>
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

                            <div className="flex gap-3 pt-6">
                                <Button onClick={handleSave} disabled={loading} className={`flex-1 h-10 font-semibold ${themeColor.bg} ${themeColor.bgHover} text-white shadow-sm rounded-lg`}>
                                    <Save className="size-4 mr-2" />
                                    {loading ? 'Salvando...' : 'Salvar Registro'}
                                </Button>

                                <Button variant="outline" className="h-10 px-4 rounded-lg" title="Imprimir" onClick={() => handlePrint()}>
                                    <Printer className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-1 bg-slate-200/50 p-6 lg:p-12 overflow-y-auto justify-center items-start">
                        <div
                            ref={printRef}
                            className={`w-full max-w-[650px] min-h-[700px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm border p-12 flex flex-col text-slate-900 ${themeColor.borderLight} border-t-8 ${themeColor.border}`}
                        >
                            {/* AgendaVet Header A4 */}
                            <div className="flex justify-between items-start pb-6 mb-8 border-b-2" style={{borderImage: 'linear-gradient(to right, #13C8CC, #002653) 1'}}>
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #13C8CC, #002653)'}}>
                                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                    <path d="M14 4C9 4 5 8 5 13c0 3 1.5 5.5 3.8 7L14 24l5.2-4C21.5 18.5 23 16 23 13c0-5-4-9-9-9z" fill="white" opacity="0.9"/>
                                    <path d="M14 8v10M9 13h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-2xl font-black tracking-tight" style={{background: 'linear-gradient(to right, #13C8CC, #002653)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                                    AgendaVet
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Gestão Veterinária Inteligente</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-slate-800 uppercase tracking-tight">Ficha de Consulta Clínica</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Relatório de Atendimento Veterinário</p>
                                <p className="text-[9px] text-slate-400 mt-2">Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
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

                            <div className="mt-auto pt-8 border-t border-slate-100">
                              <div className="flex justify-between items-end">
                                <div className="text-[9px] text-slate-400 leading-tight max-w-[220px]">
                                  <p className="font-semibold" style={{background: 'linear-gradient(to right, #13C8CC, #002653)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>AgendaVet © 2026</p>
                                  <p className="opacity-70 mt-0.5">Gestão Veterinária Profissional. As informações são de responsabilidade do médico veterinário.</p>
                                </div>
                                <div className="text-center w-56">
                                  <div className="h-[2px] w-full mb-3 rounded" style={{background: 'linear-gradient(to right, #13C8CC, #002653)'}}></div>
                                  <p className="text-[13px] font-black uppercase text-slate-900 tracking-tight">{veterinarian || 'Dr. Responsável'}</p>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Médico Veterinário • CRMV</p>
                                </div>
                              </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    )
}
