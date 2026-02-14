import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Stethoscope, FlaskConical, FileText, Calendar,
  PawPrint, Weight, Syringe, ClipboardList, Camera, MessageSquare,
  Video, Cross, Printer, Droplet, Microscope,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { AttendanceTypeDialog } from '@/components/admin/AttendanceTypeDialog';
import { PesoDialog } from '@/components/admin/PesoDialog';
import { PatologiaDialog } from '@/components/admin/PatologiaDialog';
import { DocumentoDialog } from '@/components/admin/DocumentoDialog';
import { ExameDialog } from '@/components/admin/ExameDialog';
import { FotosDialog } from '@/components/admin/FotosDialog';
import { VacinaDialog } from '@/components/admin/VacinaDialog';
import { ReceitaDialog } from '@/components/admin/ReceitaDialog';
import { ObservacoesDialog } from '@/components/admin/ObservacoesDialog';
import { VideoDialog } from '@/components/admin/VideoDialog';
import { InternacaoDialog } from '@/components/admin/InternacaoDialog';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
}

interface OwnerProfile {
  full_name: string | null;
  phone: string | null;
}

interface TimelineEntry {
  id: string;
  type: 'appointment';
  title: string;
  date: string;
  time: string;
  status: string;
  description?: string;
  veterinarian?: string | null;
  attendance_type?: string | null;
  admin_notes_raw?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'border-l-yellow-500',
  confirmed: 'border-l-blue-500',
  completed: 'border-l-green-500',
  cancelled: 'border-l-red-500',
};

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

type DialogType = 'atendimento' | 'peso' | 'patologia' | 'documento' | 'exame' | 'fotos' | 'vacina' | 'receita' | 'observacoes' | 'video' | 'internacao' | null;

const ACTION_BUTTONS = [
  { label: 'Atendimento', icon: Stethoscope, bg: 'bg-[#4A9FD8] hover:bg-[#3A8FC8]', dialogKey: 'atendimento' as DialogType },
  { label: 'Peso', icon: Weight, bg: 'bg-[#CC8844] hover:bg-[#BC7834]', dialogKey: 'peso' as DialogType },
  { label: 'Patologia', icon: Microscope, bg: 'bg-[#7D4E9F] hover:bg-[#6D3E8F]', dialogKey: 'patologia' as DialogType },
  { label: 'Documento', icon: FileText, bg: 'bg-[#4CAF50] hover:bg-[#3C9F40]', dialogKey: 'documento' as DialogType },
  { label: 'Exame', icon: FlaskConical, bg: 'bg-[#E84855] hover:bg-[#D83845]', dialogKey: 'exame' as DialogType },
  { label: 'Fotos', icon: Camera, bg: 'bg-[#2E7D9A] hover:bg-[#1E6D8A]', dialogKey: 'fotos' as DialogType },
  { label: 'Vacina', icon: Droplet, bg: 'bg-[#F59E42] hover:bg-[#E58E32]', dialogKey: 'vacina' as DialogType },
  { label: 'Receita', icon: ClipboardList, bg: 'bg-[#9C4DCC] hover:bg-[#8C3DBC]', dialogKey: 'receita' as DialogType },
  { label: 'Observações', icon: MessageSquare, bg: 'bg-[#6B7280] hover:bg-[#5B6270]', dialogKey: 'observacoes' as DialogType },
  { label: 'Vídeo', icon: Video, bg: 'bg-[#10B981] hover:bg-[#00A971]', dialogKey: 'video' as DialogType },
  { label: 'Internação', icon: Cross, bg: 'bg-[#B91C1C] hover:bg-[#A90C0C]', dialogKey: 'internacao' as DialogType },
];

const AdminPetProfile = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [pet, setPet] = useState<Pet | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (petId && isAdmin) loadPetData();
  }, [petId, isAdmin]);

  const loadPetData = async () => {
    setLoading(true);
    const [petRes, apptRes] = await Promise.all([
      supabase.from('pets').select('*').eq('id', petId!).single(),
      supabase
        .from('appointment_requests')
        .select('id, reason, status, preferred_date, preferred_time, scheduled_date, scheduled_time, veterinarian, admin_notes, service:services(name)')
        .eq('pet_id', petId!)
        .order('created_at', { ascending: false }),
    ]);

    if (petRes.data) {
      setPet(petRes.data);
      // Fetch owner profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', petRes.data.user_id)
        .single();
      if (profileData) setOwner(profileData);
    }

    type AppointmentRow = {
      id: string;
      reason: string;
      status: string;
      preferred_date: string;
      preferred_time: string;
      scheduled_date: string | null;
      scheduled_time: string | null;
      veterinarian: string | null;
      admin_notes: string | null;
      service: { name?: string | null } | null;
    };

    const entries: TimelineEntry[] = (apptRes.data || []).map((raw) => {
      const a = raw as AppointmentRow;
      let attendanceType: string | null = null;
      try {
        const parsed = a.admin_notes ? JSON.parse(a.admin_notes) : null;
        attendanceType = parsed?.tipo_atendimento || null;
      } catch { /* ignore parse errors */ }
      return {
        id: a.id,
        type: 'appointment' as const,
        title: a.service?.name || 'Consulta',
        date: a.scheduled_date || a.preferred_date,
        time: a.scheduled_time || a.preferred_time,
        status: a.status,
        description: a.reason,
        veterinarian: a.veterinarian,
        attendance_type: attendanceType,
        admin_notes_raw: a.admin_notes,
      };
    });

    setTimeline(entries);
    setLoading(false);
  };

  const handleAction = (dialogKey: DialogType) => {
    setActiveDialog(dialogKey);
  };

  const closeDialog = () => {
    setActiveDialog(null);
    loadPetData(); // Recarregar dados após fechar o diálogo
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Pet não encontrado.</p>
      </div>
    );
  }

  const emoji = pet.type === 'dog' ? '🐕' : '🐱';

  // Group by year
  const grouped = timeline.reduce<Record<string, TimelineEntry[]>>((acc, entry) => {
    const year = new Date(entry.date).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(entry);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft size={20} />
            </Button>
            <div className="text-3xl">{emoji}</div>
            <div>
              <h1 className="font-bold text-lg">{pet.name}</h1>
              <p className="text-xs text-muted-foreground">
                {pet.type === 'dog' ? 'Cachorro' : 'Gato'}
                {pet.breed && ` • ${pet.breed}`}
                {pet.age && ` • ${pet.age}`}
                {pet.weight && ` • ${pet.weight}`}
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            {owner && (
              <div>
                <p className="font-medium">{owner.full_name || 'Tutor'}</p>
                <p className="text-xs text-muted-foreground">{owner.phone || ''}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Calendar size={18} />
                Linha do Tempo
              </h2>
              <Button variant="outline" size="sm">
                <Printer size={14} className="mr-1" />
                Imprimir
              </Button>
            </div>
            <ScrollArea className="max-h-[calc(100vh-220px)]">
              {timeline.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <PawPrint className="mx-auto mb-2 text-muted-foreground" size={28} />
                    <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(grouped)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([year, entries]) => (
                    <div key={year} className="mb-5">
                      <p className="text-lg font-bold mb-3">{year}</p>
                      <div className="space-y-3">
                        {entries.map((entry) => (
                          <div
                            key={entry.id}
                            className={`bg-card border rounded-lg p-3 border-l-4 ${STATUS_COLORS[entry.status] || 'border-l-muted'} flex items-start gap-3`}
                          >
                            <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[entry.status] || 'bg-muted-foreground'}`} />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-primary">
                                {format(new Date(entry.date), "dd/MM", { locale: ptBR })} às {entry.time}
                              </span>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{entry.title}</p>
                                {entry.attendance_type && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {entry.attendance_type === 'consulta' ? 'Consulta' :
                                     entry.attendance_type === 'avaliacao_cirurgica' ? 'Aval. Cirúrgica' :
                                     entry.attendance_type === 'cirurgia' ? 'Cirurgia' :
                                     entry.attendance_type === 'retorno' ? 'Retorno' : entry.attendance_type}
                                  </Badge>
                                )}
                              </div>
                              {entry.description && (
                                <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
                              )}
                              {entry.veterinarian && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Stethoscope size={10} /> {entry.veterinarian}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-[10px] flex-shrink-0">
                              {STATUS_LABELS[entry.status]}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </ScrollArea>
          </motion.div>

          {/* Action Grid */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="font-bold text-base mb-4">Adicionar</h2>
            <div className="grid grid-cols-3 gap-4">
              {ACTION_BUTTONS.map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => handleAction(btn.dialogKey)}
                  className={`${btn.bg} text-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg min-h-[120px]`}
                >
                  <btn.icon size={32} strokeWidth={2} />
                  <span className="text-sm font-semibold leading-tight text-center">{btn.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Dialogs */}
      {pet && (
        <>
          <AttendanceTypeDialog
            open={activeDialog === 'atendimento'}
            onClose={closeDialog}
            petId={pet.id}
          />
          <PesoDialog
            open={activeDialog === 'peso'}
            onClose={closeDialog}
            petId={pet.id}
            petName={pet.name}
          />
          <PatologiaDialog
            open={activeDialog === 'patologia'}
            onClose={closeDialog}
            petId={pet.id}
            petName={pet.name}
          />
          <DocumentoDialog
            open={activeDialog === 'documento'}
            onClose={closeDialog}
            petId={pet.id}
            petName={pet.name}
          />
          <ExameDialog
            open={activeDialog === 'exame'}
            onClose={closeDialog}
            petId={pet.id}
            petName={pet.name}
          />
          <FotosDialog
            open={activeDialog === 'fotos'}
            onClose={closeDialog}
            petId={pet.id}
            petName={pet.name}
          />
          <VacinaDialog
            open={activeDialog === 'vacina'}
            onClose={closeDialog}
            petId={pet.id}
            petName={pet.name}
          />
          <ReceitaDialog
            open={activeDialog === 'receita'}
            onClose={closeDialog}
            petId={pet.id}
            petName={pet.name}
          />
          <ObservacoesDialog
            open={activeDialog === 'observacoes'}
            onClose={closeDialog}
            petId={pet.id}
            petName={pet.name}
          />
          <VideoDialog
            open={activeDialog === 'video'}
            onClose={closeDialog}
            petId={pet.id}
            petName={pet.name}
          />
          <InternacaoDialog
            open={activeDialog === 'internacao'}
            onClose={closeDialog}
            petId={pet.id}
            petName={pet.name}
          />
        </>
      )}
    </div>
  );
};

export default AdminPetProfile;
