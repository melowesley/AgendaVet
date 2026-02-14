import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Stethoscope, Scissors, RotateCcw, ClipboardCheck, Weight, 
  Microscope, FileText, FlaskConical, Camera, Droplet, 
  ClipboardList, MessageSquare, Video, Cross 
} from 'lucide-react';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ConsultaDialog } from './ConsultaDialog';
import { AvaliacaoCirurgicaDialog } from './AvaliacaoCirurgicaDialog';
import { CirurgiaDialog } from './CirurgiaDialog';
import { RetornoDialog } from './RetornoDialog';
import { PesoDialog } from './PesoDialog';
import { PatologiaDialog } from './PatologiaDialog';
import { DocumentoDialog } from './DocumentoDialog';
import { ExameDialog } from './ExameDialog';
import { FotosDialog } from './FotosDialog';
import { VacinaDialog } from './VacinaDialog';
import { ReceitaDialog } from './ReceitaDialog';
import { ObservacoesDialog } from './ObservacoesDialog';
import { VideoDialog } from './VideoDialog';
import { InternacaoDialog } from './InternacaoDialog';
import { format } from 'date-fns';

interface AttendanceTypeDialogProps {
  open: boolean;
  onClose: () => void;
  request?: AppointmentRequest;
  petId?: string;
  petName?: string;
}

const ATTENDANCE_TYPES = [
  { key: 'consulta', label: 'Consulta', icon: Stethoscope, description: 'Atendimento clínico com anamnese completa', color: 'bg-[#4A9FD8] hover:bg-[#3A8FC8]', isAttendance: true },
  { key: 'avaliacao_cirurgica', label: 'Avaliação Cirúrgica', icon: ClipboardCheck, description: 'Avaliação pré-operatória do paciente', color: 'bg-amber-500 hover:bg-amber-600', isAttendance: true },
  { key: 'cirurgia', label: 'Cirurgia', icon: Scissors, description: 'Procedimento cirúrgico', color: 'bg-rose-500 hover:bg-rose-600', isAttendance: true },
  { key: 'retorno', label: 'Retorno', icon: RotateCcw, description: 'Retorno de consulta anterior', color: 'bg-emerald-500 hover:bg-emerald-600', isAttendance: true },
  { key: 'peso', label: 'Peso', icon: Weight, description: 'Registro de peso', color: 'bg-[#CC8844] hover:bg-[#BC7834]', isAttendance: false },
  { key: 'patologia', label: 'Patologia', icon: Microscope, description: 'Registro de patologias', color: 'bg-[#7D4E9F] hover:bg-[#6D3E8F]', isAttendance: false },
  { key: 'documento', label: 'Documento', icon: FileText, description: 'Anexar documentos', color: 'bg-[#4CAF50] hover:bg-[#3C9F40]', isAttendance: false },
  { key: 'exame', label: 'Exame', icon: FlaskConical, description: 'Registro de exames', color: 'bg-[#E84855] hover:bg-[#D83845]', isAttendance: false },
  { key: 'fotos', label: 'Fotos', icon: Camera, description: 'Adicionar fotos', color: 'bg-[#2E7D9A] hover:bg-[#1E6D8A]', isAttendance: false },
  { key: 'vacina', label: 'Vacina', icon: Droplet, description: 'Registro de vacinas', color: 'bg-[#F59E42] hover:bg-[#E58E32]', isAttendance: false },
  { key: 'receita', label: 'Receita', icon: ClipboardList, description: 'Prescrições médicas', color: 'bg-[#9C4DCC] hover:bg-[#8C3DBC]', isAttendance: false },
  { key: 'observacoes', label: 'Observações', icon: MessageSquare, description: 'Adicionar observações', color: 'bg-[#6B7280] hover:bg-[#5B6270]', isAttendance: false },
  { key: 'video', label: 'Vídeo', icon: Video, description: 'Adicionar vídeos', color: 'bg-[#10B981] hover:bg-[#00A971]', isAttendance: false },
  { key: 'internacao', label: 'Internação', icon: Cross, description: 'Registro de internação', color: 'bg-[#B91C1C] hover:bg-[#A90C0C]', isAttendance: false },
];

export const AttendanceTypeDialog = ({ open, onClose, request, petId, petName }: AttendanceTypeDialogProps) => {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [tempRequest, setTempRequest] = useState<AppointmentRequest | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (key: string) => {
    // Se for um tipo de atendimento e não houver request, criar um temporário
    const type = ATTENDANCE_TYPES.find(t => t.key === key);
    if (type?.isAttendance && !request && petId) {
      setLoading(true);
      try {
        // Buscar dados do pet
        const { data: petData } = await supabase
          .from('pets')
          .select('*')
          .eq('id', petId)
          .single();

        if (!petData) {
          toast({ title: 'Erro', description: 'Pet não encontrado', variant: 'destructive' });
          setLoading(false);
          return;
        }

        // Buscar dados do profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('user_id', petData.user_id)
          .single();

        // Criar request temporário
        const today = format(new Date(), 'yyyy-MM-dd');
        const now = format(new Date(), 'HH:mm');
        
        const newRequest: AppointmentRequest = {
          id: `temp-${Date.now()}`,
          reason: `Atendimento - ${type.label}`,
          preferred_date: today,
          preferred_time: now,
          scheduled_date: today,
          scheduled_time: now,
          status: 'confirmed',
          notes: null,
          admin_notes: null,
          veterinarian: null,
          created_at: new Date().toISOString(),
          service_id: null,
          user_id: petData.user_id,
          pet: {
            id: petData.id,
            name: petData.name,
            type: petData.type,
            breed: petData.breed,
          },
          profile: {
            full_name: profileData?.full_name || null,
            phone: profileData?.phone || null,
          },
        };

        setTempRequest(newRequest);
        setSelectedType(key);
      } catch (error) {
        toast({ title: 'Erro', description: 'Erro ao criar atendimento', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedType(key);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setTempRequest(null);
    onClose();
  };

  const handleBack = () => {
    setSelectedType(null);
    setTempRequest(null);
  };

  const currentRequest = request || tempRequest;

  // Tipos de atendimento que precisam de request
  if (selectedType === 'consulta' && currentRequest) {
    return <ConsultaDialog open={true} onClose={handleClose} onBack={handleBack} request={currentRequest} />;
  }
  if (selectedType === 'avaliacao_cirurgica' && currentRequest) {
    return <AvaliacaoCirurgicaDialog open={true} onClose={handleClose} onBack={handleBack} request={currentRequest} />;
  }
  if (selectedType === 'cirurgia' && currentRequest) {
    return <CirurgiaDialog open={true} onClose={handleClose} onBack={handleBack} request={currentRequest} />;
  }
  if (selectedType === 'retorno' && currentRequest) {
    return <RetornoDialog open={true} onClose={handleClose} onBack={handleBack} request={currentRequest} />;
  }

  // Outras funcionalidades que precisam apenas de petId e petName
  if (selectedType === 'peso' && petId && petName) {
    return <PesoDialog open={true} onClose={handleClose} petId={petId} petName={petName} />;
  }
  if (selectedType === 'patologia' && petId && petName) {
    return <PatologiaDialog open={true} onClose={handleClose} petId={petId} petName={petName} />;
  }
  if (selectedType === 'documento' && petId && petName) {
    return <DocumentoDialog open={true} onClose={handleClose} petId={petId} petName={petName} />;
  }
  if (selectedType === 'exame' && petId && petName) {
    return <ExameDialog open={true} onClose={handleClose} petId={petId} petName={petName} />;
  }
  if (selectedType === 'fotos' && petId && petName) {
    return <FotosDialog open={true} onClose={handleClose} petId={petId} petName={petName} />;
  }
  if (selectedType === 'vacina' && petId && petName) {
    return <VacinaDialog open={true} onClose={handleClose} petId={petId} petName={petName} />;
  }
  if (selectedType === 'receita' && petId && petName) {
    return <ReceitaDialog open={true} onClose={handleClose} petId={petId} petName={petName} />;
  }
  if (selectedType === 'observacoes' && petId && petName) {
    return <ObservacoesDialog open={true} onClose={handleClose} petId={petId} petName={petName} />;
  }
  if (selectedType === 'video' && petId && petName) {
    return <VideoDialog open={true} onClose={handleClose} petId={petId} petName={petName} />;
  }
  if (selectedType === 'internacao' && petId && petName) {
    return <InternacaoDialog open={true} onClose={handleClose} petId={petId} petName={petName} />;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Adicionar</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 auto-rows-fr">
            {ATTENDANCE_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => handleSelect(type.key)}
                disabled={loading}
                className={`${type.color} text-white rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg aspect-square disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <type.icon size={28} strokeWidth={2} />
                <span className="text-xs font-semibold leading-tight text-center">{type.label}</span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
