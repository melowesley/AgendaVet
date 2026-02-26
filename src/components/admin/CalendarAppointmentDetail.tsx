import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PawPrint, FileText } from 'lucide-react';
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
  reminder_sent: 'Lembrete Enviado',
  checked_in: 'Check-in',
  in_progress: 'Em Atendimento',
  completed: 'Concluído',
  return_scheduled: 'Retorno Agendado',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  reminder_sent: 'default',
  checked_in: 'default',
  in_progress: 'default',
  completed: 'outline',
  return_scheduled: 'outline',
  cancelled: 'destructive',
  no_show: 'secondary',
};

export const CalendarAppointmentDetail = ({ request, open, onClose }: CalendarAppointmentDetailProps) => {
  const navigate = useNavigate();
  const date = request.scheduled_date || request.preferred_date;
  const time = request.scheduled_time || request.preferred_time;
  const [showAttendance, setShowAttendance] = useState(false);

  const openPetProfile = () => {
    onClose();
    navigate(`/admin/pet/${request.pet.id}`);
  };

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

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={openPetProfile}
                >
                  <FileText size={18} className="mr-2" />
                  Abrir Ficha do Paciente
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground"
                  size="lg"
                  onClick={() => setShowAttendance(true)}
                >
                  <PawPrint size={18} className="mr-2" />
                  Iniciar Atendimento
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AttendanceTypeDialog
        open={showAttendance}
        onClose={() => { setShowAttendance(false); onClose(); }}
        request={request}
        petId={request.pet.id}
        petName={request.pet.name}
      />
    </>
  );
};
