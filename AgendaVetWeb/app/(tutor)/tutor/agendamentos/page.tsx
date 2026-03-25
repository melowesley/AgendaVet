'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { TutorLayout } from '@/components/tutor/tutor-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, Plus, Search, PawPrint, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Appointment {
  id: string
  service_type: string
  scheduled_date: string
  status: string
  notes: string | null
  pet_id: string | null
  pets?: { name: string; species: string } | null
}

interface Pet {
  id: string
  name: string
  species: string
}

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  confirmed: { label: 'Confirmado', icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  pending: { label: 'Aguardando', icon: AlertCircle, className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30' },
  cancelled: { label: 'Cancelado', icon: XCircle, className: 'bg-red-500/15 text-red-600 border-red-500/30' },
  completed: { label: 'Concluído', icon: CheckCircle2, className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
}

const serviceTypes = [
  'Consulta Geral',
  'Vacinação',
  'Banho e Tosa',
  'Cirurgia',
  'Exame de Sangue',
  'Radiografia',
  'Ultrassom',
  'Retorno',
  'Emergência',
  'Outro',
]

function AgendamentosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    pet_id: searchParams.get('pet') || '',
    service_type: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
  })

  const fetchAppointments = async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('appointment_requests')
      .select('id, service_type, scheduled_date, status, notes, pet_id, pets(name, species)')
      .eq('owner_id', uid)
      .order('scheduled_date', { ascending: false })
    setAppointments((data || []) as Appointment[])
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/tutor/login'); return }
      setUserId(session.user.id)

      const { data: petsData } = await supabase
        .from('pets')
        .select('id, name, species')
        .eq('owner_id', session.user.id)
        .order('name')

      setPets(petsData || [])
      await fetchAppointments(session.user.id)
      setLoading(false)

      // Se veio de pets page com pet selecionado, abrir o dialog
      if (searchParams.get('pet')) {
        setDialogOpen(true)
      }
    }
    init()
  }, [router, searchParams])

  const handleSave = async () => {
    if (!form.service_type || !form.scheduled_date || !userId) return
    setSaving(true)
    const supabase = createClient()

    const dateTime = form.scheduled_time
      ? `${form.scheduled_date}T${form.scheduled_time}:00`
      : `${form.scheduled_date}T08:00:00`

    await supabase.from('appointment_requests').insert({
      owner_id: userId,
      pet_id: form.pet_id || null,
      service_type: form.service_type,
      scheduled_date: dateTime,
      notes: form.notes || null,
      status: 'pending',
    })

    await fetchAppointments(userId)
    setDialogOpen(false)
    setSaving(false)
    setForm({ pet_id: '', service_type: '', scheduled_date: '', scheduled_time: '', notes: '' })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date()

  const filtered = appointments.filter(a => {
    const matchSearch = a.service_type.toLowerCase().includes(search.toLowerCase()) ||
      (a.pets?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchStatus
  })

  const upcoming = filtered.filter(a => isUpcoming(a.scheduled_date) && a.status !== 'cancelled')
  const past = filtered.filter(a => !isUpcoming(a.scheduled_date) || a.status === 'cancelled' || a.status === 'completed')

  const AppointmentCard = ({ apt }: { apt: Appointment }) => {
    const status = statusConfig[apt.status] || statusConfig.pending
    const StatusIcon = status.icon
    return (
      <div className="flex items-start justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30">
        <div className="flex items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0 mt-0.5">
            <Calendar className="size-4 text-emerald-500" />
          </div>
          <div>
            <p className="font-medium text-sm">{apt.service_type}</p>
            {apt.pets && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <PawPrint className="size-3" />
                {apt.pets.name}
              </p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="size-3" />
              {formatDate(apt.scheduled_date)} · {formatTime(apt.scheduled_date)}
            </p>
            {apt.notes && <p className="text-xs text-muted-foreground italic mt-1">{apt.notes}</p>}
          </div>
        </div>
        <Badge variant="outline" className={`text-xs shrink-0 ml-2 ${status.className}`}>
          {status.label}
        </Badge>
      </div>
    )
  }

  return (
    <TutorLayout breadcrumbs={[{ label: 'Agendamentos' }]}>
      <div className="p-4 md:p-6 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Agendamentos</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{appointments.length} agendamento{appointments.length !== 1 ? 's' : ''} no total</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white w-fit">
            <Plus className="size-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por serviço ou pet..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-muted/30 border-border/50 focus-visible:ring-emerald-500"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 bg-muted/30 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Aguardando</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/40 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="size-12 text-muted-foreground/30 mb-4" />
              <p className="font-semibold text-muted-foreground">Nenhum agendamento encontrado</p>
              <Button onClick={() => setDialogOpen(true)} variant="outline" size="sm" className="mt-4 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
                <Plus className="size-3 mr-1" />
                Fazer agendamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Próximos</h2>
                <div className="space-y-2">
                  {upcoming.map(apt => <AppointmentCard key={apt.id} apt={apt} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Histórico</h2>
                <div className="space-y-2 opacity-80">
                  {past.map(apt => <AppointmentCard key={apt.id} apt={apt} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog novo agendamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>Solicite um agendamento para seu pet</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {pets.length > 0 && (
              <div>
                <Label>Pet</Label>
                <Select value={form.pet_id} onValueChange={v => setForm(f => ({ ...f, pet_id: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o pet (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.species === 'dog' ? '🐶' : p.species === 'cat' ? '🐱' : '🐾'} {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Serviço *</Label>
              <Select value={form.service_type} onValueChange={v => setForm(f => ({ ...f, service_type: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Tipo de serviço" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.scheduled_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.scheduled_time}
                  onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Descreva o motivo ou sintomas do pet..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={!form.service_type || !form.scheduled_date || saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {saving ? 'Enviando...' : 'Solicitar Agendamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TutorLayout>
  )
}

export default function TutorAgendamentosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
      <AgendamentosContent />
    </Suspense>
  )
}
