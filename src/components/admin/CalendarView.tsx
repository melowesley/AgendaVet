import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { CalendarAppointmentDetail } from './CalendarAppointmentDetail';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { queryClient } from '@/lib/queryClient';

// ─── Notas de célula ──────────────────────────────────────────────────────────

const AGENDA_NOTES_KEY = 'agenda_cell_notes';

export const HIGHLIGHT_COLORS = {
  yellow: {
    label: 'Amarelo',
    bg: 'bg-yellow-200/90 dark:bg-yellow-900/50',
    bgCell: 'bg-yellow-100 dark:bg-yellow-950/40 border-yellow-300/50 dark:border-yellow-600/30',
    bgText: 'bg-yellow-200/70 dark:bg-yellow-800/50 text-yellow-900 dark:text-yellow-100',
    button: 'bg-[#FEF08A] hover:bg-[#FDE047] border-yellow-400/60',
  },
  orange: {
    label: 'Laranja',
    bg: 'bg-orange-200/90 dark:bg-orange-900/50',
    bgCell: 'bg-orange-100 dark:bg-orange-950/40 border-orange-300/50 dark:border-orange-600/30',
    bgText: 'bg-orange-200/70 dark:bg-orange-800/50 text-orange-900 dark:text-orange-100',
    button: 'bg-[#FDBA74] hover:bg-[#FB923C] border-orange-400/60',
  },
  green: {
    label: 'Verde',
    bg: 'bg-green-200/90 dark:bg-green-900/50',
    bgCell: 'bg-green-100 dark:bg-green-950/40 border-green-300/50 dark:border-green-600/30',
    bgText: 'bg-green-200/70 dark:bg-green-800/50 text-green-900 dark:text-green-100',
    button: 'bg-[#86EFAC] hover:bg-[#4ADE80] border-green-400/60',
  },
} as const;

export type HighlightColorKey = keyof typeof HIGHLIGHT_COLORS;

export interface AgendaCellNote {
  text: string;
  highlight: HighlightColorKey | null;
}

function loadCellNotes(): Record<string, AgendaCellNote> {
  try {
    const raw = localStorage.getItem(AGENDA_NOTES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { text: string; highlight?: boolean | string }>;
    return Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => {
        let h: HighlightColorKey | null = null;
        if (v.highlight === true || v.highlight === 'yellow') h = 'yellow';
        else if (v.highlight === 'orange') h = 'orange';
        else if (v.highlight === 'green') h = 'green';
        return [k, { text: v.text || '', highlight: h }];
      })
    );
  } catch {
    return {};
  }
}

function saveCellNotes(notes: Record<string, AgendaCellNote>) {
  try {
    localStorage.setItem(AGENDA_NOTES_KEY, JSON.stringify(notes));
  } catch {
    // ignore
  }
}

// ─── Status: cores, labels, ações ─────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:          'bg-amber-50 text-amber-800 border-amber-300',
  confirmed:        'bg-blue-50 text-blue-800 border-blue-300',
  reminder_sent:    'bg-indigo-50 text-indigo-800 border-indigo-300',
  checked_in:       'bg-cyan-50 text-cyan-800 border-cyan-300',
  in_progress:      'bg-violet-50 text-violet-800 border-violet-300',
  completed:        'bg-green-50 text-green-800 border-green-300',
  return_scheduled: 'bg-teal-50 text-teal-800 border-teal-300',
  cancelled:        'bg-red-50 text-red-500 border-red-200',
  no_show:          'bg-gray-100 text-gray-500 border-gray-300',
};

const STATUS_DOT: Record<string, string> = {
  pending:          'bg-amber-400',
  confirmed:        'bg-blue-500',
  reminder_sent:    'bg-indigo-500',
  checked_in:       'bg-cyan-500',
  in_progress:      'bg-violet-500',
  completed:        'bg-green-500',
  return_scheduled: 'bg-teal-500',
  cancelled:        'bg-red-400',
  no_show:          'bg-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  pending:          'Pendente',
  confirmed:        'Confirmado',
  reminder_sent:    'Lembrete Enviado',
  checked_in:       'Check-in',
  in_progress:      'Em Atendimento',
  completed:        'Concluído',
  return_scheduled: 'Retorno Agendado',
  cancelled:        'Cancelado',
  no_show:          'Não Compareceu',
};

interface StatusAction {
  label: string;
  toStatus: string;
  colorClass: string;
}

const ACTIONS_BY_STATUS: Record<string, StatusAction[]> = {
  pending: [
    { label: 'Confirmar',      toStatus: 'confirmed',  colorClass: 'text-blue-700 focus:bg-blue-50' },
    { label: 'Cancelar',       toStatus: 'cancelled',  colorClass: 'text-red-600  focus:bg-red-50'  },
  ],
  confirmed: [
    { label: 'Check-in',          toStatus: 'checked_in', colorClass: 'text-cyan-700   focus:bg-cyan-50'   },
    { label: 'Não Compareceu',    toStatus: 'no_show',    colorClass: 'text-gray-600   focus:bg-gray-50'   },
    { label: 'Cancelar',          toStatus: 'cancelled',  colorClass: 'text-red-600    focus:bg-red-50'    },
  ],
  reminder_sent: [
    { label: 'Check-in',       toStatus: 'checked_in', colorClass: 'text-cyan-700 focus:bg-cyan-50'  },
    { label: 'Não Compareceu', toStatus: 'no_show',    colorClass: 'text-gray-600 focus:bg-gray-50'  },
    { label: 'Cancelar',       toStatus: 'cancelled',  colorClass: 'text-red-600  focus:bg-red-50'   },
  ],
  checked_in: [
    { label: 'Iniciar Atendimento', toStatus: 'in_progress', colorClass: 'text-violet-700 focus:bg-violet-50' },
    { label: 'Cancelar',            toStatus: 'cancelled',   colorClass: 'text-red-600    focus:bg-red-50'    },
  ],
  in_progress: [
    { label: 'Concluir', toStatus: 'completed', colorClass: 'text-green-700 focus:bg-green-50' },
    { label: 'Cancelar', toStatus: 'cancelled', colorClass: 'text-red-600   focus:bg-red-50'   },
  ],
  completed: [
    { label: 'Agendar Retorno', toStatus: 'return_scheduled', colorClass: 'text-teal-700 focus:bg-teal-50' },
  ],
};

// ─── Legenda do calendário ─────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { status: 'pending',     label: 'Pendente'       },
  { status: 'confirmed',   label: 'Confirmado'     },
  { status: 'checked_in',  label: 'Check-in'       },
  { status: 'in_progress', label: 'Em Atendimento' },
  { status: 'completed',   label: 'Concluído'      },
  { status: 'cancelled',   label: 'Cancelado'      },
  { status: 'no_show',     label: 'Não Compareceu' },
];

// ─── AppointmentCard ───────────────────────────────────────────────────────────

interface AppointmentCardProps {
  appt: AppointmentRequest;
  onSelect: (appt: AppointmentRequest) => void;
  onStatusUpdate: (id: string, toStatus: string) => Promise<void>;
  /** modo compacto: exibe hora + nome (visão mensal) */
  compact?: boolean;
}

const AppointmentCard = ({ appt, onSelect, onStatusUpdate, compact }: AppointmentCardProps) => {
  const actions = ACTIONS_BY_STATUS[appt.status] ?? [];
  const colorClass = STATUS_COLORS[appt.status] ?? 'bg-muted border-muted-foreground/20 text-foreground';

  return (
    <div
      data-appointment
      className={cn(
        'group relative flex items-stretch w-full mb-0.5 rounded border overflow-hidden',
        colorClass
      )}
    >
      {/* Barra lateral colorida de status */}
      <div className={cn('w-1 shrink-0', STATUS_DOT[appt.status] ?? 'bg-muted-foreground')} />

      {/* Nome do paciente (clica para detalhes) */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onSelect(appt); }}
        className={cn(
          'flex-1 text-left truncate px-1 py-0.5 min-w-0 hover:underline',
          compact ? 'text-[10px] leading-tight' : 'text-xs font-medium'
        )}
      >
        {compact
          ? <>{(appt.scheduled_time || appt.preferred_time)?.slice(0, 5)} {appt.pet?.name}</>
          : appt.pet?.name}
      </button>

      {/* Dropdown de ações */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 px-1 opacity-70 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            aria-label="Ações do agendamento"
          >
            <MoreHorizontal size={11} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 z-50">
          <DropdownMenuLabel className="text-xs font-semibold py-1 leading-tight">
            <span className="block truncate">{appt.pet?.name}</span>
            <span className={cn('text-[10px] font-normal', colorClass.split(' ')[1])}>
              {STATUS_LABELS[appt.status] ?? appt.status}
            </span>
          </DropdownMenuLabel>

          {actions.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {actions.map((action) => (
                <DropdownMenuItem
                  key={action.toStatus}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(appt.id, action.toStatus);
                  }}
                  className={cn('text-xs cursor-pointer', action.colorClass)}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onSelect(appt); }}
            className="text-xs cursor-pointer"
          >
            Ver detalhes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// ─── CalendarView principal ────────────────────────────────────────────────────

interface CalendarViewProps {
  requests: AppointmentRequest[];
  /** Chamado após atualizar o status de um agendamento (para atualizar dashboard/cards) */
  onStatusChange?: () => void;
}

type ViewMode = 'week' | 'month';

export const CalendarView = ({ requests, onStatusChange }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);
  const [cellNotes, setCellNotes] = useState<Record<string, AgendaCellNote>>(loadCellNotes);
  const [editingCell, setEditingCell] = useState<{ dateKey: string; time: string; date: Date } | null>(null);
  const [editText, setEditText] = useState('');
  const [editHighlight, setEditHighlight] = useState<HighlightColorKey | null>(null);

  useEffect(() => {
    saveCellNotes(cellNotes);
  }, [cellNotes]);

  const handleStatusUpdate = useCallback(async (requestId: string, newStatus: string) => {
    const { error } = await supabase
      .from('appointment_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['appointment-requests'] });
      onStatusChange?.();
    } else {
      console.error('Erro ao atualizar status:', error);
    }
  }, [onStatusChange]);

  const openCellEditor = useCallback((dateKey: string, time: string, date: Date) => {
    const key = `${dateKey}_${time}`;
    const existing = cellNotes[key];
    setEditingCell({ dateKey, time, date });
    setEditText(existing?.text ?? '');
    setEditHighlight(existing?.highlight ?? null);
  }, [cellNotes]);

  const saveCellNote = useCallback(() => {
    if (!editingCell) return;
    const key = `${editingCell.dateKey}_${editingCell.time}`;
    const text = editText.trim();
    if (!text) {
      setCellNotes((prev) => { const next = { ...prev }; delete next[key]; return next; });
    } else {
      setCellNotes((prev) => ({ ...prev, [key]: { text, highlight: editHighlight ?? null } }));
    }
    setEditingCell(null);
  }, [editingCell, editText, editHighlight]);

  const removeCellNote = useCallback(() => {
    if (!editingCell) return;
    const key = `${editingCell.dateKey}_${editingCell.time}`;
    setCellNotes((prev) => { const next = { ...prev }; delete next[key]; return next; });
    setEditText('');
    setEditHighlight(null);
    setEditingCell(null);
  }, [editingCell]);

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
    <div className="space-y-4 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="outline" size="icon" onClick={() => navigate('prev')} className="shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="shrink-0">Hoje</Button>
          <Button variant="outline" size="icon" onClick={() => navigate('next')} className="shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h3 className="text-base sm:text-lg font-semibold capitalize truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
            className="text-xs sm:text-sm"
          >
            <CalendarRange className="h-4 w-4 mr-1 shrink-0" />
            Semana
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('month')}
            className="text-xs sm:text-sm"
          >
            <CalendarDays className="h-4 w-4 mr-1 shrink-0" />
            Mês
          </Button>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex gap-3 flex-wrap">
        {LEGEND_ITEMS.map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={cn('h-2.5 w-2.5 rounded-full', STATUS_DOT[status])} />
            {label}
          </div>
        ))}
      </div>

      {/* Grid */}
      {viewMode === 'week' ? (
        <WeekView
          days={days}
          timeSlots={timeSlots}
          appointmentsByDate={appointmentsByDate}
          cellNotes={cellNotes}
          onSelect={setSelectedRequest}
          onStatusUpdate={handleStatusUpdate}
          onCellClick={openCellEditor}
        />
      ) : (
        <MonthView
          days={days}
          currentDate={currentDate}
          appointmentsByDate={appointmentsByDate}
          cellNotes={cellNotes}
          onSelect={setSelectedRequest}
          onStatusUpdate={handleStatusUpdate}
          onDayClick={openCellEditor}
        />
      )}

      {/* Dialog: anotação da célula */}
      <Dialog open={!!editingCell} onOpenChange={(open) => !open && setEditingCell(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCell
                ? `${format(editingCell.date, "EEEE, d 'de' MMMM", { locale: ptBR })} — ${editingCell.time}`
                : 'Anotação'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="cell-note">Anotação</Label>
              <Textarea
                id="cell-note"
                placeholder="Digite uma observação, lembrete ou informação para este horário..."
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Marca-texto</Label>
              <div className="flex items-center gap-1.5">
                {(Object.keys(HIGHLIGHT_COLORS) as HighlightColorKey[]).map((key) => {
                  const c = HIGHLIGHT_COLORS[key];
                  const selected = editHighlight === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditHighlight(editHighlight === key ? null : key)}
                      title={c.label}
                      className={cn(
                        'w-8 h-8 rounded-md border-2 transition-all shrink-0 shadow-sm',
                        c.button,
                        selected && 'ring-2 ring-offset-2 ring-teal-500 scale-110'
                      )}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            {editingCell && cellNotes[`${editingCell.dateKey}_${editingCell.time}`] && (
              <Button type="button" variant="outline" onClick={removeCellNote} className="mr-auto">
                Remover
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setEditingCell(null)}>
              Fechar
            </Button>
            <Button type="button" onClick={saveCellNote}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

// ─── WeekView ─────────────────────────────────────────────────────────────────

interface WeekViewProps {
  days: Date[];
  timeSlots: string[];
  appointmentsByDate: Map<string, AppointmentRequest[]>;
  cellNotes: Record<string, AgendaCellNote>;
  onSelect: (req: AppointmentRequest) => void;
  onStatusUpdate: (id: string, toStatus: string) => Promise<void>;
  onCellClick: (dateKey: string, time: string, date: Date) => void;
}

const WeekView = ({ days, timeSlots, appointmentsByDate, cellNotes, onSelect, onStatusUpdate, onCellClick }: WeekViewProps) => {
  const today = new Date();

  return (
    <div className="overflow-x-auto overflow-y-hidden border rounded-lg w-full min-w-0 [-webkit-overflow-scrolling:touch]">
      <div className="min-w-[560px]">
        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-[50px_repeat(7,minmax(70px,1fr))] border-b bg-muted/50">
          <div className="p-1.5 sm:p-2" />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                'p-1.5 sm:p-2 text-center border-l min-w-0',
                isSameDay(day, today) && 'bg-primary/10'
              )}
            >
              <p className="text-[10px] sm:text-xs text-muted-foreground capitalize truncate">
                {format(day, 'EEE', { locale: ptBR })}
              </p>
              <p className={cn(
                'text-xs sm:text-sm font-semibold',
                isSameDay(day, today) && 'text-primary'
              )}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {/* Grade de horários */}
        {timeSlots.map((time) => (
          <div key={time} className="grid grid-cols-[50px_repeat(7,minmax(70px,1fr))] border-b last:border-b-0">
            <div className="p-1 text-[10px] sm:text-xs text-muted-foreground text-right pr-1 sm:pr-2 pt-2">{time}</div>
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const slotKey = `${dateKey}_${time}`;
              const note = cellNotes[slotKey];
              const dayAppts = appointmentsByDate.get(dateKey) || [];
              const slotAppts = dayAppts.filter((a) => {
                const apptTime = a.scheduled_time || a.preferred_time;
                return apptTime?.startsWith(time.split(':')[0]);
              });

              return (
                <div
                  key={day.toISOString()}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-appointment]')) return;
                    onCellClick(dateKey, time, day);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!(e.target as HTMLElement).closest('[data-appointment]')) onCellClick(dateKey, time, day);
                    }
                  }}
                  className={cn(
                    'border-l min-h-[44px] sm:min-h-[48px] p-0.5 cursor-pointer transition-colors hover:bg-muted/50 min-w-0',
                    isSameDay(day, today) && 'bg-primary/5',
                    note?.highlight && HIGHLIGHT_COLORS[note.highlight].bgCell
                  )}
                >
                  {slotAppts.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onSelect={onSelect}
                      onStatusUpdate={onStatusUpdate}
                    />
                  ))}
                  {note?.text && (
                    <p
                      className={cn(
                        'text-[11px] leading-tight mt-0.5 px-1 py-0.5 rounded truncate',
                        note.highlight ? HIGHLIGHT_COLORS[note.highlight].bgText + ' font-medium' : 'text-muted-foreground bg-muted/50'
                      )}
                      title={note.text}
                    >
                      {note.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MonthView ────────────────────────────────────────────────────────────────

interface MonthViewProps {
  days: Date[];
  currentDate: Date;
  appointmentsByDate: Map<string, AppointmentRequest[]>;
  cellNotes: Record<string, AgendaCellNote>;
  onSelect: (req: AppointmentRequest) => void;
  onStatusUpdate: (id: string, toStatus: string) => Promise<void>;
  onDayClick: (dateKey: string, time: string, date: Date) => void;
}

const MonthView = ({ days, currentDate, appointmentsByDate, cellNotes, onSelect, onStatusUpdate, onDayClick }: MonthViewProps) => {
  const today = new Date();
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDayNotes = (dateKey: string) => {
    return Object.entries(cellNotes).filter(([key]) => key.startsWith(`${dateKey}_`));
  };

  return (
    <div className="border rounded-lg overflow-hidden w-full min-w-0">
      <div className="grid grid-cols-7 bg-muted/50">
        {weekDays.map((d) => (
          <div key={d} className="p-1 sm:p-2 text-center text-[10px] sm:text-xs font-medium text-muted-foreground border-b">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayAppts = appointmentsByDate.get(dateKey) || [];
          const dayNotes = getDayNotes(dateKey);
          const firstHighlight = dayNotes.find(([, n]) => n.highlight)?.[1]?.highlight;
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('[data-appointment]')) return;
                onDayClick(dateKey, '08:00', day);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!(e.target as HTMLElement).closest('[data-appointment]')) onDayClick(dateKey, '08:00', day);
                }
              }}
              className={cn(
                'min-h-[64px] sm:min-h-[80px] border-b border-r p-1 cursor-pointer transition-colors hover:bg-muted/50',
                !isCurrentMonth && 'bg-muted/30',
                isToday && 'bg-primary/5',
                firstHighlight && HIGHLIGHT_COLORS[firstHighlight].bgCell
              )}
            >
              <p className={cn(
                'text-xs mb-1',
                isToday ? 'font-bold text-primary' : !isCurrentMonth ? 'text-muted-foreground/50' : 'text-muted-foreground'
              )}>
                {format(day, 'd')}
                {dayNotes.length > 0 && (
                  <span className="ml-1 text-[10px] text-muted-foreground" title={`${dayNotes.length} anotação(ões)`}>
                    •
                  </span>
                )}
              </p>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appt={appt}
                    onSelect={onSelect}
                    onStatusUpdate={onStatusUpdate}
                    compact
                  />
                ))}
                {dayAppts.length > 3 && (
                  <p className="text-[10px] text-muted-foreground pl-1">+{dayAppts.length - 3} mais</p>
                )}
                {dayNotes.length > 0 && (
                  <p className="text-[10px] text-muted-foreground pl-1 truncate" title={dayNotes.map(([, n]) => n.text).join(' • ')}>
                    {dayNotes.length === 1 ? dayNotes[0][1].text : `${dayNotes.length} anotações`}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
