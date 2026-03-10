'use client'

import { useParams } from 'next/navigation'
import { usePet, useMedicalRecords } from '@/lib/data-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft, Calendar, User, PawPrint, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DOMPurify from 'dompurify'

export default function ProntuarioPage() {
    const params = useParams()
    const petId = params.id as string
    const { pet, isLoading: petLoading } = usePet(petId)
    const { records, isLoading: recordsLoading } = useMedicalRecords(petId)

    if (petLoading || recordsLoading) {
        return <div className="p-8 text-center">Carregando prontuário...</div>
    }

    if (!pet) {
        return <div className="p-8 text-center">Paciente não encontrado.</div>
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="min-h-screen bg-white p-4 md:p-8 max-w-4xl mx-auto">
            {/* Header / Navbar (hidden on print) */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <Link href={`/pets/${petId}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para Ficha
                    </Button>
                </Link>
                <Button onClick={handlePrint} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir Prontuário
                </Button>
            </div>

            {/* Print Header */}
            <div className="border-b-2 border-primary pb-6 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-primary mb-2">AgendaVet</h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">Prontuário Médico Veterinário</p>
                </div>
                <div className="text-right text-xs">
                    <p>Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
                </div>
            </div>

            {/* Patient Info Card */}
            <Card className="mb-8 border-none shadow-none bg-slate-50 print:bg-slate-50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <PawPrint className="h-5 w-5 text-primary" />
                        Dados do Paciente
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="font-semibold text-muted-foreground uppercase text-[10px]">Nome</p>
                        <p className="text-lg font-bold">{pet.name}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground uppercase text-[10px]">Espécie / Raça</p>
                        <p>{pet.species} - {pet.breed || 'N/D'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground uppercase text-[10px]">Gênero</p>
                        <p>{pet.gender || 'Não Informado'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground uppercase text-[10px]">Peso Atual</p>
                        <p>{pet.weight} kg</p>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline of Records */}
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-6 print:mb-4">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Histórico Clínico e Procedimentos
                </h2>

                {records.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground italic border rounded-xl border-dashed">
                        Nenhum registro clínico encontrado para este paciente.
                    </div>
                ) : (
                    records.map((record, index) => (
                        <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            {/* Dot */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <Calendar className="h-4 w-4" />
                            </div>
                            {/* Card Content */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5">
                                <div className="flex items-center justify-between mb-1">
                                    <time className="font-mono text-xs font-bold text-slate-500">
                                        {format(new Date(record.date || record.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                    </time>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
                                        {record.type}
                                    </Badge>
                                </div>
                                <div className="text-slate-900 font-bold mb-1">{record.title}</div>
                                <div
                                    className="text-slate-600 text-sm prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: record.description ? DOMPurify.sanitize(record.description) : "" }}
                                />
                                {record.veterinarian && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-muted-foreground italic">
                                        <User className="h-3 w-3" />
                                        Veterinário: {record.veterinarian}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="mt-20 pt-8 border-t border-slate-200 text-center text-[10px] text-muted-foreground uppercase tracking-widest">
                <p>© {new Date().getFullYear()} AgendaVet - Sistema de Gestão Hospitalar Veterinária</p>
            </div>
        </div>
    )
}
