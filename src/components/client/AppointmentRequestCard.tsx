import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
}

interface AppointmentRequest {
  id: string;
  pet_id: string;
  preferred_date: string;
  preferred_time: string;
  reason: string;
  notes: string | null;
  status: string;
  created_at: string;
  sync_state?: 'synced' | 'pending' | 'failed';
  pets?: Pet;
}

interface AppointmentRequestCardProps {
  appointment: AppointmentRequest;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  confirmed: { label: 'Confirmada', variant: 'default' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  completed: { label: 'Concluída', variant: 'outline' },
};

export function AppointmentRequestCard({ appointment }: AppointmentRequestCardProps) {
  const status = statusConfig[appointment.status] || statusConfig.pending;
  const pet = appointment.pets;
  const hasPendingSync = appointment.sync_state === 'pending' || appointment.sync_state === 'failed';

  const formattedDate = format(parseISO(appointment.preferred_date), "dd 'de' MMMM", { locale: ptBR });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-display font-semibold text-foreground">
                {pet?.name || 'Pet'}
              </h3>
              <Badge variant={status.variant}>{status.label}</Badge>
              {hasPendingSync && (
                <Badge variant={appointment.sync_state === 'failed' ? 'destructive' : 'outline'}>
                  {appointment.sync_state === 'failed' ? 'Falha no sync' : 'Pend. sync'}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {appointment.reason}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-primary" />
                <span className="capitalize">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-primary" />
                <span>{appointment.preferred_time}</span>
              </div>
            </div>

            {appointment.notes && (
              <p className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                {appointment.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
