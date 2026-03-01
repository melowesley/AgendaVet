import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, PawPrint, FileText, MapPin } from 'lucide-react';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';

interface TutorInfoSectionProps {
  request: AppointmentRequest;
  date: string;
  time: string;
}

export const TutorInfoSection = ({ request, date, time }: TutorInfoSectionProps) => (
  <div className="space-y-3">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Dados do Tutor (somente leitura)
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4 border">
      <div className="flex items-start gap-3">
        <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">
            {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <p className="text-sm text-muted-foreground">{time}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{request.profile?.full_name || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">{request.profile?.phone || 'Sem telefone'}</p>
        </div>
      </div>
      {request.profile?.address && (
        <div className="flex items-start gap-3 sm:col-span-2">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Endereço</p>
            <p className="text-sm text-muted-foreground">{request.profile.address}</p>
          </div>
        </div>
      )}
      <div className="flex items-start gap-3">
        <PawPrint className="h-4 w-4 mt-0.5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{request.pet?.name}</p>
          <p className="text-sm text-muted-foreground capitalize">{request.pet?.type} — {request.pet?.breed || 'SRD'}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Motivo</p>
          <p className="text-sm text-muted-foreground">{request.reason}</p>
        </div>
      </div>
    </div>
  </div>
);
