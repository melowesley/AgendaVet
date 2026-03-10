'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/data-store'
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
import { Stethoscope, Save, ArrowLeft, Plus, History } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ConsultaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

export function ConsultaDialog({ open, onOpenChange, onBack, petId, petName }: ConsultaDialogProps) {
    const [loading, setLoading] = useState(false)
    const [queixa, setQueixa] = useState('')
    const [anamnese, setAnamnese] = useState('')
    const [exameFisico, setExameFisico] = useState('')
    const [suspeita, setSuspeita] = useState('')
    const [tratamento, setTratamento] = useState('')

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
                description: `Queixa: ${queixa}\n\nAnamnese: ${anamnese}\n\nExame Físico: ${exameFisico}\n\nSuspeita: ${suspeita}\n\nTratamento: ${tratamento}`,
                date: new Date().toISOString(),
                veterinarian: 'Veterinário Responsável',
            }] as any) as any)

            if (error) throw error
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
            <DialogContent className="sm:max-w-3xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0 border-b border-border/50">
                    <div className="flex items-center gap-4 mb-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onBack}>
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                            <Stethoscope className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Consulta - {petName}</DialogTitle>
                            <DialogDescription>Registro de anamnese e exame físico</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        <Tabs defaultValue="anamnese" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
                                <TabsTrigger value="exame">Exame & Diagnóstico</TabsTrigger>
                            </TabsList>

                            <TabsContent value="anamnese" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="queixa">Queixa Principal *</Label>
                                    <Textarea
                                        id="queixa"
                                        value={queixa}
                                        onChange={(e) => setQueixa(e.target.value)}
                                        placeholder="O que trouxe o paciente hoje?"
                                        className="min-h-[100px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="anamnese_det">Anamnese Detalhada</Label>
                                    <Textarea
                                        id="anamnese_det"
                                        value={anamnese}
                                        onChange={(e) => setAnamnese(e.target.value)}
                                        placeholder="Histórico, sintomas, duração..."
                                        className="min-h-[150px]"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="exame" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="exame_fis">Exame Físico</Label>
                                    <Textarea
                                        id="exame_fis"
                                        value={exameFisico}
                                        onChange={(e) => setExameFisico(e.target.value)}
                                        placeholder="Mucosas, TPC, FC, FR, Temperatura..."
                                        className="min-h-[120px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="suspeita">Suspeita Diagnóstica / Diagnóstico</Label>
                                    <Input
                                        id="suspeita"
                                        value={suspeita}
                                        onChange={(e) => setSuspeita(e.target.value)}
                                        placeholder="Conclusão médica"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tratamento">Conduta / Tratamento</Label>
                                    <Textarea
                                        id="tratamento"
                                        value={tratamento}
                                        onChange={(e) => setTratamento(e.target.value)}
                                        placeholder="Medicamentos, exames solicitados, recomendações..."
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="pt-4 border-t border-border/50 flex gap-3">
                            <Button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                <Save className="size-4 mr-2" />
                                {loading ? 'Salvando...' : 'Finalizar Consulta'}
                            </Button>
                            <Button variant="outline" className="flex-1">
                                <History className="size-4 mr-2" />
                                Histórico Anterior
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
