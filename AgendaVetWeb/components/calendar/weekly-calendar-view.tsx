'use client'

import { useState } from 'react'
import { Plus, Bell, HelpCircle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Appointment } from '@/lib/types'

interface WeeklyCalendarViewProps {
  appointments?: Appointment[]
  onAddClick?: () => void
  veterinarian?: string
  room?: string
  occupancy?: number
}

export function WeeklyCalendarView({
  appointments = [],
  onAddClick,
  veterinarian = 'Todos os Veterinários',
  room = 'Todas as Salas',
  occupancy = 78,
}: WeeklyCalendarViewProps) {
  const hours = Array.from({ length: 8 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`)
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
  const dayDates = [14, 15, 16, 17, 18]

  return (
    <div className="w-full space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Agenda Semanal</h2>
          <p className="text-sm text-slate-500 font-medium">14 de Agosto - 20 de Agosto, 2023</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex bg-slate-200/50 p-1 rounded-lg">
            <button className="px-4 py-1.5 rounded-md text-xs font-bold text-slate-600 hover:bg-white/50">Dia</button>
            <button className="px-4 py-1.5 rounded-md text-xs font-bold bg-white text-primary shadow-sm">Semana</button>
            <button className="px-4 py-1.5 rounded-md text-xs font-bold text-slate-600 hover:bg-white/50">Mês</button>
          </div>
          <Button onClick={onAddClick} className="bg-primary text-white font-bold shadow-sm hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1.5" />
            Agendar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="px-4 py-3 rounded-xl border border-slate-200">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Veterinário</label>
          <select className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-bold text-slate-800 mt-1 appearance-none">
            <option>{veterinarian}</option>
            <option>Dr. Ricardo Silva</option>
            <option>Dra. Ana Paula</option>
          </select>
        </Card>

        <Card className="px-4 py-3 rounded-xl border border-slate-200">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sala / Unidade</label>
          <select className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-bold text-slate-800 mt-1 appearance-none">
            <option>{room}</option>
            <option>Sala 01 - Clínica</option>
            <option>Sala 02 - Cirurgia</option>
          </select>
        </Card>

        <Card className="px-4 py-3 rounded-xl border border-slate-200">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Legenda</label>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="text-[10px] font-medium text-slate-500 ml-1">Ativa</span>
          </div>
        </Card>

        <Card className="px-4 py-3 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ocupação</p>
            <p className="text-lg font-bold text-emerald-600">{occupancy}%</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
            <span className="text-emerald-600">📈</span>
          </div>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        {/* Day Headers */}
        <div className="grid gap-0" style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}>
          <div className="h-12 flex items-center justify-center border-r border-slate-100 bg-slate-50/50">
            <span>⏰</span>
          </div>
          {days.map((day, i) => (
            <div key={day} className={`h-12 flex flex-col items-center justify-center border-r border-slate-100 ${i === 1 ? 'bg-primary/5' : ''}`}>
              <span className="text-[9px] font-bold text-slate-400 uppercase">
                {i === 1 ? 'TER' : day}
              </span>
              <span className={`text-sm font-bold ${i === 1 ? 'text-primary' : 'text-slate-800'}`}>
                {dayDates[i]}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar Grid Rows */}
        <div className="grid gap-0" style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}>
          {/* Time Column */}
          <div className="flex flex-col text-slate-400 text-[10px] font-bold border-r border-slate-100 bg-slate-50/30">
            {hours.map((hour) => (
              <div key={hour} className="h-16 flex items-start justify-center pt-2 border-b border-slate-100">
                {hour}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {days.map((_, dayIndex) => (
            <div key={dayIndex} className="relative border-r border-slate-100 bg-white last:border-r-0">
              {hours.map((_, hourIndex) => (
                <div
                  key={`${dayIndex}-${hourIndex}`}
                  className="h-16 border-b border-slate-100 p-1 hover:bg-slate-50 transition-colors relative"
                >
                  {/* Events will be rendered here dynamically */}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary text-white p-4 relative overflow-hidden rounded-xl shadow-sm">
          <div className="relative z-10">
            <p className="text-[10px] font-medium text-white/80 uppercase">Próxima Cirurgia</p>
            <h3 className="text-base font-bold mt-0.5">14:30 - Thor</h3>
            <Button
              variant="ghost"
              className="mt-2.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold h-auto py-1 px-3"
            >
              Detalhes
            </Button>
          </div>
          <span className="text-6xl absolute -right-2 -bottom-2 text-white/10">⚕️</span>
        </Card>

        <Card className="p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Avisos do Dia</p>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center flex-shrink-0 text-lg">
              ⚠️
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Dr. Marcos Mendes em licença médica. Redirecionar pacientes da Sala 03.
            </p>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Serviços</p>
          <div className="grid grid-cols-2 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-[10px] font-bold text-slate-700">Consulta</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span className="text-[10px] font-bold text-slate-700">Cirurgia</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[10px] font-bold text-slate-700">Vacinação</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-[10px] font-bold text-slate-700">Exames</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
