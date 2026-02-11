import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { CalendarAppointmentDetail } from './CalendarAppointmentDetail';

interface CalendarViewProps {
  requests: AppointmentRequest[];
}

type ViewMode = 'week' | 'month';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/20 text-warning-foreground border-warning/40',
  confirmed: 'bg-primary/15 text-primary border-primary/40',
  completed: 'bg-success/15 text-success border-success/40',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/40',
};

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-warning',
  confirmed: 'bg-primary',
  completed: 'bg-success',
  cancelled: 'bg-destructive',
};

export const CalendarView = ({ requests }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);

  const days = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { locale: ptBR });
      const end = endOfWeek(currentDate, { locale: ptBR });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const monthStart = startOfWeek(start, { locale: ptBR });
    const monthEnd = endOfWeek(end, { locale: ptBR });
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentDate, viewMode]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentRequest[]>();
    requests.forEach((req) => {
      const dateKey = req.scheduled_date || req.preferred_date;
      if (!dateKey) return;
      const existing = map.get(dateKey) || [];
      existing.push(req);
      map.set(dateKey, existing);
    });
    return map;
  }, [requests]);

  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const title = viewMode === 'week'
    ? `${format(days[0], "dd MMM", { locale: ptBR })} — ${format(days[days.length - 1], "dd MMM yyyy", { locale: ptBR })}`
    : format(currentDate, "MMMM yyyy", { locale: ptBR });

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>Hoje</Button>
          <Button variant="outline" size="icon" onClick={() => navigate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold capitalize ml-2">{title}</h3>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            <CalendarRange className="h-4 w-4 mr-1" />
            Semana
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            Mês
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {[
          { status: 'pending', label: 'Pendente' },
          { status: 'confirmed', label: 'Confirmado' },
          { status: 'completed', label: 'Concluído' },
          { status: 'cancelled', label: 'Cancelado' },
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={cn('h-2.5 w-2.5 rounded-full', STATUS_DOT[status])} />
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {viewMode === 'week' ? (
        <WeekView days={days} timeSlots={timeSlots} appointmentsByDate={appointmentsByDate} onSelect={setSelectedRequest} />
      ) : (
        <MonthView days={days} currentDate={currentDate} appointmentsByDate={appointmentsByDate} onSelect={setSelectedRequest} />
      )}

      {selectedRequest && (
        <CalendarAppointmentDetail
          request={selectedRequest}
          open={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};

// Week View
interface WeekViewProps {
  days: Date[];
  timeSlots: string[];
  appointmentsByDate: Map<string, AppointmentRequest[]>;
  onSelect: (req: AppointmentRequest) => void;
}

const WeekView = ({ days, timeSlots, appointmentsByDate, onSelect }: WeekViewProps) => {
  const today = new Date();

  return (
    <div className="overflow-x-auto border rounded-lg">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/50">
          <div className="p-2" />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                'p-2 text-center border-l',
                isSameDay(day, today) && 'bg-primary/10'
              )}
            >
              <p className="text-xs text-muted-foreground capitalize">
                {format(day, 'EEE', { locale: ptBR })}
              </p>
              <p className={cn(
                'text-sm font-semibold',
                isSameDay(day, today) && 'text-primary'
              )}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {/* Time grid */}
        {timeSlots.map((time) => (
          <div key={time} className="grid grid-cols-[60px_repeat(7,1fr)] border-b last:border-b-0">
            <div className="p-1 text-xs text-muted-foreground text-right pr-2 pt-2">{time}</div>
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayAppts = appointmentsByDate.get(dateKey) || [];
              const slotAppts = dayAppts.filter((a) => {
                const apptTime = a.scheduled_time || a.preferred_time;
                return apptTime?.startsWith(time.split(':')[0]);
              });

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'border-l min-h-[48px] p-0.5',
                    isSameDay(day, today) && 'bg-primary/5'
                  )}
                >
                  {slotAppts.map((appt) => (
                    <button
                      key={appt.id}
                      onClick={() => onSelect(appt)}
                      className={cn(
                        'w-full text-left text-xs p-1 rounded border mb-0.5 truncate cursor-pointer hover:opacity-80 transition-opacity',
                        STATUS_COLORS[appt.status] || 'bg-muted'
                      )}
                    >
                      <span className="font-medium">{appt.pet?.name}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Month View
interface MonthViewProps {
  days: Date[];
  currentDate: Date;
  appointmentsByDate: Map<string, AppointmentRequest[]>;
  onSelect: (req: AppointmentRequest) => void;
}

const MonthView = ({ days, currentDate, appointmentsByDate, onSelect }: MonthViewProps) => {
  const today = new Date();
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/50">
        {weekDays.map((d) => (
          <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground border-b">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayAppts = appointmentsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[80px] border-b border-r p-1',
                !isCurrentMonth && 'bg-muted/30',
                isToday && 'bg-primary/5'
              )}
            >
              <p className={cn(
                'text-xs mb-1',
                isToday ? 'font-bold text-primary' : !isCurrentMonth ? 'text-muted-foreground/50' : 'text-muted-foreground'
              )}>
                {format(day, 'd')}
              </p>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map((appt) => (
                  <button
                    key={appt.id}
                    onClick={() => onSelect(appt)}
                    className={cn(
                      'w-full text-left text-[10px] leading-tight p-0.5 px-1 rounded truncate cursor-pointer hover:opacity-80',
                      STATUS_COLORS[appt.status] || 'bg-muted'
                    )}
                  >
                    {(appt.scheduled_time || appt.preferred_time)?.slice(0, 5)} {appt.pet?.name}
                  </button>
                ))}
                {dayAppts.length > 3 && (
                  <p className="text-[10px] text-muted-foreground pl-1">+{dayAppts.length - 3} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
