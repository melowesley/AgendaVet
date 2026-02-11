import { AppointmentStatus } from '@/types/appointment';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/20',
  },
  confirmed: {
    label: 'Confirmado',
    className: 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/20',
  },
  'in-progress': {
    label: 'Em atendimento',
    className: 'bg-accent/15 text-accent border-accent/30 hover:bg-accent/20',
  },
  completed: {
    label: 'Concluído',
    className: 'bg-success/15 text-success border-success/30 hover:bg-success/20',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn('font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
