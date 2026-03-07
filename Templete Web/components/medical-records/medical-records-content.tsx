'use client'

import React from "react"

import { useState } from 'react'
import { useMedicalRecords, usePets } from '@/lib/data-store'
import type { MedicalRecord } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  FileText,
  Syringe,
  Stethoscope,
  Pill,
  FlaskConical,
  StickyNote,
} from 'lucide-react'
import Link from 'next/link'
import { MedicalRecordFormDialog } from './medical-record-form-dialog'

type TypeFilter = MedicalRecord['type'] | 'all'

const recordTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  vaccination: Syringe,
  diagnosis: Stethoscope,
  prescription: Pill,
  procedure: FlaskConical,
  'lab-result': FlaskConical,
  note: StickyNote,
}

const recordTypeLabels: Record<string, string> = {
  vaccination: 'Vacina',
  diagnosis: 'Diagnóstico',
  prescription: 'Receita',
  procedure: 'Procedimento',
  'lab-result': 'Exame',
  note: 'Observação',
}

export function MedicalRecordsContent() {
  const { records, isLoading } = useMedicalRecords()
  const { pets } = usePets()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const getPetName = (petId: string) => pets.find((p) => p.id === petId)?.name || 'Desconhecido'

  const filteredRecords = records
    .filter((record) => {
      const matchesSearch =
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getPetName(record.petId).toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.veterinarian.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === 'all' || record.type === typeFilter
      return matchesSearch && matchesType
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'Todos tipos' },
    { value: 'vaccination', label: 'Vacinas' },
    { value: 'diagnosis', label: 'Diagnósticos' },
    { value: 'prescription', label: 'Receitas' },
    { value: 'procedure', label: 'Procedimentos' },
    { value: 'lab-result', label: 'Exames' },
    { value: 'note', label: 'Observações' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Carregando prontuários...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prontuários</h1>
          <p className="text-muted-foreground">Visualize e gerencie o histórico médico dos pacientes</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 shadow-lg shadow-emerald-500/25 transition-all">
          <Plus className="size-4 mr-2" />
          Novo Registro
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Histórico de Pacientes</CardTitle>
              <CardDescription>{filteredRecords.length} registros encontrados</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar registros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
          </div>
          <div className="flex gap-1 flex-wrap mt-2">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTypeFilter(option.value === typeFilter ? 'all' : option.value)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${typeFilter === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="size-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground">
                {searchQuery || typeFilter !== 'all'
                  ? 'Tente ajustar seus filtros'
                  : 'Comece adicionando o histórico médico dos pets'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => {
                const Icon = recordTypeIcons[record.type] || FileText
                return (
                  <div key={record.id} className="flex gap-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-4 hover:border-emerald-500/30 transition-all group">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                      <Icon className="size-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-semibold group-hover:text-emerald-500 transition-colors">{record.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Link
                              href={`/pets/${record.petId}`}
                              className="font-medium text-foreground hover:text-emerald-500 transition-colors"
                            >
                              {getPetName(record.petId)}
                            </Link>
                            <span>•</span>
                            <span>{record.veterinarian || 'Veterinário não informado'}</span>
                            <span>•</span>
                            <span className="font-mono">
                              {new Date(record.date).toLocaleDateString('pt-BR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                          {recordTypeLabels[record.type] || record.type}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {record.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <MedicalRecordFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
