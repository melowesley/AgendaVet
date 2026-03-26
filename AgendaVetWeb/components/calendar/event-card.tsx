'use client'

// Tipo que espelha as colunas reais da tabela `appointments` no Supabase
export interface CalendarAppointment {
  id: string
  pet_name: string
  pet_breed?: string | null
  veterinarian_name: string
  type: string
  start_time: string
  end_time: string
  room?: string | null
  status?: string | null
  notes?: string | null
  owner_name?: string | null
  owner_phone?: string | null
}

interface EventCardProps {
  appointment: CalendarAppointment
  color?: 'blue' | 'emerald' | 'amber' | 'rose'
  onClick?: () => void
}

const colorMap = {
  blue: 'bg-blue-50 border-l-blue-600',
  emerald: 'bg-emerald-50 border-l-emerald-600',
  amber: 'bg-amber-50 border-l-amber-500',
  rose: 'bg-rose-50 border-l-rose-600',
}

const colorTextMap = {
  blue: 'text-blue-700',
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  rose: 'text-rose-700',
}

export function EventCard({
  appointment,
  color = 'blue',
  onClick,
}: EventCardProps) {
  return (
    <div
      className={`${colorMap[color]} border-l-[3px] rounded-md p-2 cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className={`text-[8px] font-bold ${colorTextMap[color]} uppercase`}>
          {appointment.type || 'Consulta'}
        </span>
      </div>
      <p className="text-[10px] font-bold text-slate-800 truncate">
        {appointment.pet_name} {appointment.pet_breed && `(${appointment.pet_breed})`}
      </p>
      <p className="text-[9px] text-slate-500">
        {appointment.veterinarian_name}
      </p>
    </div>
  )
}
