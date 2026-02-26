import { AppointmentStatus, APPOINTMENT_STATUS } from '@/types/appointment';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export const statusConfig: Record<AppointmentStatus, { label: string; className: string; dotClass: string }> = {
  [APPOINTMENT_STATUS.PENDING]: {
    label: 'Pendente',
    className: 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/20',
    dotClass: 'bg-warning',
  },
  [APPOINTMENT_STATUS.CONFIRMED]: {
    label: 'Confirmado',
    className: 'bg-blue-500/15 text-blue-500 border-blue-500/30 hover:bg-blue-500/20',
    dotClass: 'bg-blue-500',
  },
  [APPOINTMENT_STATUS.REMINDER_SENT]: {
    label: 'Lembrete Enviado',
    className: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30 hover:bg-indigo-500/20',
    dotClass: 'bg-indigo-500',
  },
  [APPOINTMENT_STATUS.CHECKED_IN]: {
    label: 'Check-in Realizado',
    className: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30 hover:bg-cyan-500/20',
    dotClass: 'bg-cyan-500',
  },
  [APPOINTMENT_STATUS.IN_PROGRESS]: {
    label: 'Em atendimento',
    className: 'bg-accent/15 text-accent border-accent/30 hover:bg-accent/20',
    dotClass: 'bg-accent',
  },
  [APPOINTMENT_STATUS.COMPLETED]: {
    label: 'Concluído',
    className: 'bg-success/15 text-success border-success/30 hover:bg-success/20',
    dotClass: 'bg-success',
  },
  [APPOINTMENT_STATUS.RETURN_SCHEDULED]: {
    label: 'Retorno Agendado',
    className: 'bg-purple-500/15 text-purple-500 border-purple-500/30 hover:bg-purple-500/20',
    dotClass: 'bg-purple-500',
  },
  [APPOINTMENT_STATUS.CANCELLED]: {
    label: 'Cancelado',
    className: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20',
    dotClass: 'bg-destructive',
  },
  [APPOINTMENT_STATUS.NO_SHOW]: {
    label: 'Não Compareceu',
    className: 'bg-slate-500/15 text-slate-500 border-slate-500/30 hover:bg-slate-500/20',
    dotClass: 'bg-slate-500',
  },
};

export function getStatusDotClass(status: AppointmentStatus) {
  return statusConfig[status]?.dotClass || 'bg-muted-foreground';
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig[APPOINTMENT_STATUS.PENDING];

  return (
    <Badge
      variant="outline"
      className={cn('font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
