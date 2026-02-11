import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PawPrint } from 'lucide-react';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { TutorInfoSection } from './detail/TutorInfoSection';
import { AttendanceTypeDialog } from './AttendanceTypeDialog';

// Re-export for backward compat
export type { AnamnesisData } from './anamnesisTypes';

interface CalendarAppointmentDetailProps {
  request: AppointmentRequest;
  open: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  cancelled: 'destructive',
  completed: 'outline',
};

export const CalendarAppointmentDetail = ({ request, open, onClose }: CalendarAppointmentDetailProps) => {
  const date = request.scheduled_date || request.preferred_date;
  const time = request.scheduled_time || request.preferred_time;
  const [showAttendance, setShowAttendance] = useState(false);

  return (
    <>
      <Dialog open={open && !showAttendance} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              Detalhes da Consulta
              <Badge variant={STATUS_VARIANTS[request.status]}>
                {STATUS_LABELS[request.status] || request.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="px-6 pb-6">
              <TutorInfoSection request={request} date={date} time={time} />

              <Separator className="my-4" />

              <Button
                className="w-full gradient-primary text-primary-foreground"
                size="lg"
                onClick={() => setShowAttendance(true)}
              >
                <PawPrint size={18} className="mr-2" />
                Iniciar Atendimento
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AttendanceTypeDialog
        open={showAttendance}
        onClose={() => { setShowAttendance(false); onClose(); }}
        request={request}
      />
    </>
  );
};
