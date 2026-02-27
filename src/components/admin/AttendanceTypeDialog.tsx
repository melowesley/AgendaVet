import { useState, useEffect, useCallback } from 'react';
import { Dialog, LeftPanelDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Stethoscope, Scissors, RotateCcw, ClipboardCheck, Weight, 
  Microscope, FileText, FlaskConical, Camera, Droplet, 
  ClipboardList, MessageSquare, Video, Cross, Bug, 
  ScissorsLineDashed, Skull, Syringe
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
import { DiagnosticoDialog } from './DiagnosticoDialog';
import { BanhoTosaDialog } from './BanhoTosaDialog';
import { ObitoDialog } from './ObitoDialog';
import { InternacaoDialog } from './InternacaoDialog';
import { format } from 'date-fns';

export const ATTENDANCE_TYPES = [
  { key: 'consulta',          label: 'Consulta',           icon: Stethoscope,     description: 'Atendimento clínico com anamnese',    color: 'bg-blue-600 hover:bg-blue-700',       accent: '#2563EB', isAttendance: true  },
  { key: 'avaliacao_cirurgica', label: 'Avaliação Cirúrgica', icon: ClipboardCheck, description: 'Avaliação pré-operatória',             color: 'bg-amber-600 hover:bg-amber-700',     accent: '#D97706', isAttendance: true  },
  { key: 'cirurgia',          label: 'Cirurgia',            icon: Scissors,        description: 'Procedimento cirúrgico',               color: 'bg-rose-700 hover:bg-rose-800',       accent: '#BE123C', isAttendance: true  },
  { key: 'retorno',           label: 'Retorno',             icon: RotateCcw,       description: 'Retorno de consulta anterior',         color: 'bg-emerald-600 hover:bg-emerald-700', accent: '#059669', isAttendance: true  },
  { key: 'peso',              label: 'Peso',                icon: Weight,          description: 'Registro de peso corporal',            color: 'bg-orange-600 hover:bg-orange-700',   accent: '#EA580C', isAttendance: false },
  { key: 'patologia',         label: 'Patologia',           icon: Microscope,      description: 'Registro de patologias',               color: 'bg-violet-700 hover:bg-violet-800',   accent: '#6D28D9', isAttendance: false },
  { key: 'documento',         label: 'Documento',           icon: FileText,        description: 'Anexar documentos clínicos',           color: 'bg-teal-600 hover:bg-teal-700',       accent: '#0D9488', isAttendance: false },
  { key: 'exame',             label: 'Exame',               icon: FlaskConical,    description: 'Registro de exames laboratoriais',     color: 'bg-red-600 hover:bg-red-700',         accent: '#DC2626', isAttendance: false },
  { key: 'fotos',             label: 'Fotos',               icon: Camera,          description: 'Registro fotográfico do paciente',     color: 'bg-sky-600 hover:bg-sky-700',         accent: '#0284C7', isAttendance: false },
  { key: 'vacina',            label: 'Aplicações',          icon: Syringe,         description: 'Vacinas e medicações aplicadas',       color: 'bg-amber-700 hover:bg-amber-800',     accent: '#B45309', isAttendance: false },
  { key: 'receita',           label: 'Receita',             icon: ClipboardList,   description: 'Prescrições e medicamentos',           color: 'bg-purple-700 hover:bg-purple-800',   accent: '#7E22CE', isAttendance: false },
  { key: 'observacoes',       label: 'Observações',         icon: MessageSquare,   description: 'Anotações e observações clínicas',     color: 'bg-slate-500 hover:bg-slate-600',     accent: '#64748B', isAttendance: false },
  { key: 'video',             label: 'Gravações',           icon: Video,           description: 'Vídeos e gravações clínicas',          color: 'bg-emerald-700 hover:bg-emerald-800', accent: '#047857', isAttendance: false },
  { key: 'internacao',        label: 'Internação',          icon: Cross,           description: 'Registro de internação hospitalar',    color: 'bg-red-800 hover:bg-red-900',         accent: '#991B1B', isAttendance: false },
  { key: 'diagnostico',       label: 'Diagnóstico',         icon: Bug,             description: 'Diagnóstico clínico registrado',       color: 'bg-indigo-700 hover:bg-indigo-800',   accent: '#4338CA', isAttendance: false },
  { key: 'banho_tosa',        label: 'Banho e Tosa',        icon: ScissorsLineDashed, description: 'Serviço de banho e tosa',           color: 'bg-cyan-700 hover:bg-cyan-800',       accent: '#0E7490', isAttendance: false },
  { key: 'obito',             label: 'Informar Óbito',      icon: Skull,           description: 'Registro de óbito do paciente',       color: 'bg-gray-700 hover:bg-gray-800',       accent: '#374151', isAttendance: false },
] as const;

export type AttendanceTypeKey = (typeof ATTENDANCE_TYPES)[number]['key'];

interface AttendanceTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  request?: AppointmentRequest;
  petId?: string;
  petName?: string;
  initialType?: AttendanceTypeKey | null;
}

export const AttendanceTypeDialog = ({ open, onClose, onSuccess, request, petId, petName, initialType }: AttendanceTypeDialogProps) => {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<AttendanceTypeKey | null>(null);
  const [tempRequest, setTempRequest] = useState<AppointmentRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const resolvedPetId = petId ?? request?.pet?.id;
  const resolvedPetName = petName ?? request?.pet?.name;

  const handleSelect = useCallback(async (key: AttendanceTypeKey) => {
    // Se for um tipo de atendimento e não houver request, criar um registro real no banco
    const type = ATTENDANCE_TYPES.find(t => t.key === key);
    if (type?.isAttendance && !request && resolvedPetId) {
      setLoading(true);
      try {
        // Buscar dados do pet
        const { data: petData } = await supabase
          .from('pets')
          .select('*')
          .eq('id', resolvedPetId)
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

        const today = format(new Date(), 'yyyy-MM-dd');
        const now = format(new Date(), 'HH:mm');

        // Inserir registro real em appointment_requests para obter UUID válido
        const { data: insertedRequest, error: insertError } = await supabase
          .from('appointment_requests')
          .insert({
            user_id: petData.user_id,
            pet_id: petData.id,
            preferred_date: today,
            preferred_time: now,
            reason: `Atendimento - ${type.label}`,
            status: 'confirmed',
            scheduled_date: today,
            scheduled_time: now,
          })
          .select('id, reason, preferred_date, preferred_time, scheduled_date, scheduled_time, status, notes, admin_notes, veterinarian, created_at, service_id, user_id')
          .single();

        if (insertError) {
          toast({ title: 'Erro', description: insertError.message || 'Erro ao criar atendimento', variant: 'destructive' });
          setLoading(false);
          return;
        }

        const newRequest: AppointmentRequest = {
          id: insertedRequest.id,
          reason: insertedRequest.reason,
          preferred_date: insertedRequest.preferred_date,
          preferred_time: insertedRequest.preferred_time,
          scheduled_date: insertedRequest.scheduled_date,
          scheduled_time: insertedRequest.scheduled_time,
          status: insertedRequest.status,
          notes: insertedRequest.notes ?? null,
          admin_notes: insertedRequest.admin_notes ?? null,
          veterinarian: insertedRequest.veterinarian ?? null,
          created_at: insertedRequest.created_at,
          service_id: insertedRequest.service_id ?? null,
          user_id: insertedRequest.user_id,
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
  }, [request, resolvedPetId, toast]);

  useEffect(() => {
    if (!open || !initialType || selectedType === initialType) return;
    void handleSelect(initialType);
  }, [open, initialType, selectedType, handleSelect]);

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
    return <ConsultaDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} request={currentRequest} />;
  }
  if (selectedType === 'avaliacao_cirurgica' && currentRequest) {
    return <AvaliacaoCirurgicaDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} request={currentRequest} />;
  }
  if (selectedType === 'cirurgia' && currentRequest) {
    return <CirurgiaDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} request={currentRequest} />;
  }
  if (selectedType === 'retorno' && currentRequest) {
    return <RetornoDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} request={currentRequest} />;
  }

  // Outras funcionalidades que precisam apenas de petId e petName
  if (selectedType === 'peso' && resolvedPetId && resolvedPetName) {
    return <PesoDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }
  if (selectedType === 'patologia' && resolvedPetId && resolvedPetName) {
    return <PatologiaDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }
  if (selectedType === 'documento' && resolvedPetId && resolvedPetName) {
    return <DocumentoDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }
  if (selectedType === 'exame' && resolvedPetId && resolvedPetName) {
    return <ExameDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }
  if (selectedType === 'fotos' && resolvedPetId && resolvedPetName) {
    return <FotosDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }
  if (selectedType === 'vacina' && resolvedPetId && resolvedPetName) {
    return <VacinaDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }
  if (selectedType === 'receita' && resolvedPetId && resolvedPetName) {
    return <ReceitaDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }
  if (selectedType === 'observacoes' && resolvedPetId && resolvedPetName) {
    return <ObservacoesDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }
  if (selectedType === 'video' && resolvedPetId && resolvedPetName) {
    return <VideoDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }
  if (selectedType === 'internacao' && resolvedPetId && resolvedPetName) {
    return <InternacaoDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }
  if (selectedType === 'diagnostico' && resolvedPetId && resolvedPetName) {
    return <DiagnosticoDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }
  if (selectedType === 'banho_tosa' && resolvedPetId && resolvedPetName) {
    return <BanhoTosaDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }
  if (selectedType === 'obito' && resolvedPetId && resolvedPetName) {
    return <ObitoDialog open={true} onClose={handleClose} onBack={handleBack} onSuccess={onSuccess} petId={resolvedPetId} petName={resolvedPetName} />;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <LeftPanelDialogContent>
        {/* Cabeçalho */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-border">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Stethoscope size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <DialogTitle className="text-xs font-bold text-slate-800 dark:text-foreground uppercase tracking-wider leading-tight">
              Tipo de Atendimento
            </DialogTitle>
            <p className="text-[10px] text-slate-400 dark:text-muted-foreground leading-tight">
              Selecione um procedimento
            </p>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
            <p className="text-xs text-slate-400">Criando atendimento...</p>
          </div>
        ) : (
          <div className="px-2 py-2 space-y-0.5">
            {ATTENDANCE_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => handleSelect(type.key)}
                disabled={loading}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-muted border border-transparent hover:border-slate-200 dark:hover:border-border transition-all duration-150 group text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Ícone */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: type.accent }}
                >
                  <type.icon size={15} strokeWidth={2} className="text-white" />
                </div>
                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-foreground leading-tight truncate">
                    {type.label}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-muted-foreground leading-tight truncate">
                    {type.description}
                  </p>
                </div>
                {/* Seta */}
                <svg
                  className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </LeftPanelDialogContent>
    </Dialog>
  );
};
