import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatusBadge } from '@/components/StatusBadge';
import { AppointmentStatus } from '@/types/appointment';

interface AppointmentRequest {
  id: string;
  pet_id: string;
  preferred_date: string;
  preferred_time: string;
  reason: string;
  notes: string | null;
  status: string;
  created_at: string;
  pets?: {
    id: string;
    name: string;
    type: string;
    breed: string | null;
  };
}

interface AppointmentRequestCardProps {
  appointment: AppointmentRequest;
}

export function AppointmentRequestCard({ appointment }: AppointmentRequestCardProps) {
  const pet = appointment.pets;

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
              <StatusBadge status={appointment.status as AppointmentStatus} />
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
