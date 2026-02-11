import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Stethoscope, Scissors, RotateCcw, ClipboardCheck } from 'lucide-react';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { ConsultaDialog } from './ConsultaDialog';
import { AvaliacaoCirurgicaDialog } from './AvaliacaoCirurgicaDialog';
import { CirurgiaDialog } from './CirurgiaDialog';
import { RetornoDialog } from './RetornoDialog';

interface AttendanceTypeDialogProps {
  open: boolean;
  onClose: () => void;
  request: AppointmentRequest;
}

const ATTENDANCE_TYPES = [
  { key: 'consulta', label: 'Consulta', icon: Stethoscope, description: 'Atendimento clínico com anamnese completa', color: 'bg-sky-500 hover:bg-sky-600' },
  { key: 'avaliacao_cirurgica', label: 'Avaliação Cirúrgica', icon: ClipboardCheck, description: 'Avaliação pré-operatória do paciente', color: 'bg-amber-500 hover:bg-amber-600' },
  { key: 'cirurgia', label: 'Cirurgia', icon: Scissors, description: 'Procedimento cirúrgico', color: 'bg-rose-500 hover:bg-rose-600' },
  { key: 'retorno', label: 'Retorno', icon: RotateCcw, description: 'Retorno de consulta anterior', color: 'bg-emerald-500 hover:bg-emerald-600' },
];

export const AttendanceTypeDialog = ({ open, onClose, request }: AttendanceTypeDialogProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSelect = (key: string) => {
    setSelectedType(key);
  };

  const handleClose = () => {
    setSelectedType(null);
    onClose();
  };

  const handleBack = () => setSelectedType(null);

  if (selectedType === 'consulta') {
    return <ConsultaDialog open={true} onClose={handleClose} onBack={handleBack} request={request} />;
  }
  if (selectedType === 'avaliacao_cirurgica') {
    return <AvaliacaoCirurgicaDialog open={true} onClose={handleClose} onBack={handleBack} request={request} />;
  }
  if (selectedType === 'cirurgia') {
    return <CirurgiaDialog open={true} onClose={handleClose} onBack={handleBack} request={request} />;
  }
  if (selectedType === 'retorno') {
    return <RetornoDialog open={true} onClose={handleClose} onBack={handleBack} request={request} />;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tipo de Atendimento</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          {ATTENDANCE_TYPES.map((type) => (
            <button
              key={type.key}
              onClick={() => handleSelect(type.key)}
              className={`${type.color} text-white rounded-xl p-5 flex flex-col items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-sm`}
            >
              <type.icon size={28} />
              <span className="text-sm font-semibold text-center">{type.label}</span>
              <span className="text-[10px] opacity-80 text-center leading-tight">{type.description}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
