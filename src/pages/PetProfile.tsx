import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Stethoscope, FlaskConical, FileText, Calendar,
  PawPrint, Weight, Syringe, ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { RequestAppointmentDialog } from '@/components/client/RequestAppointmentDialog';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
}

interface TimelineEntry {
  id: string;
  type: 'appointment' | 'exam' | 'weight';
  title: string;
  date: string;
  time: string;
  status: string;
  description?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const PetProfile = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pet, setPet] = useState<Pet | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    if (petId) loadPetData();
  }, [petId]);

  const loadPetData = async () => {
    setLoading(true);
    const [petRes, apptRes] = await Promise.all([
      supabase.from('pets').select('*').eq('id', petId!).single(),
      supabase
        .from('appointment_requests')
        .select('id, reason, status, preferred_date, preferred_time, scheduled_date, scheduled_time, service:services(name)')
        .eq('pet_id', petId!)
        .order('created_at', { ascending: false }),
    ]);

    if (petRes.data) setPet(petRes.data);

    type AppointmentRow = {
      id: string;
      reason: string;
      status: string;
      preferred_date: string;
      preferred_time: string;
      scheduled_date: string | null;
      scheduled_time: string | null;
      service: { name?: string | null } | null;
    };

    const entries: TimelineEntry[] = (apptRes.data || []).map((raw) => {
      const a = raw as AppointmentRow;
      return {
        id: a.id,
        type: 'appointment' as const,
        title: a.service?.name || 'Consulta',
        date: a.scheduled_date || a.preferred_date,
        time: a.scheduled_time || a.preferred_time,
        status: a.status,
        description: a.reason,
      };
    });

    setTimeline(entries);
    setLoading(false);
  };

  const handleAppointmentRequested = () => {
    loadPetData();
    toast({ title: 'Solicitação enviada!', description: 'Aguarde a confirmação da clínica.' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
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

  // Group timeline by year
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
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cliente')}>
            <ArrowLeft size={20} />
          </Button>
          <div className="text-3xl">{emoji}</div>
          <div>
            <h1 className="font-display font-bold text-lg">{pet.name}</h1>
            <p className="text-xs text-muted-foreground">
              {pet.type === 'dog' ? 'Cachorro' : 'Gato'}
              {pet.breed && ` • ${pet.breed}`}
              {pet.age && ` • ${pet.age}`}
              {pet.weight && ` • ${pet.weight}`}
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Timeline - Left */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
              <Calendar size={18} />
              Linha do Tempo
            </h2>
            <ScrollArea className="max-h-[60vh]">
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
                    <div key={year} className="mb-4">
                      <p className="text-sm font-bold text-muted-foreground mb-2">{year}</p>
                      <div className="relative border-l-2 border-border pl-4 space-y-4">
                        {entries.map((entry) => (
                          <div key={entry.id} className="relative">
                            <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full ${STATUS_COLORS[entry.status] || 'bg-muted-foreground'}`} />
                            <div className="bg-card border rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-primary">
                                  {format(new Date(entry.date), "dd/MM", { locale: ptBR })} às {entry.time}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[entry.status] || 'bg-muted'}`}>
                                  {STATUS_LABELS[entry.status] || entry.status}
                                </span>
                              </div>
                              <p className="text-sm font-semibold mt-1">{entry.title}</p>
                              {entry.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </ScrollArea>
          </motion.div>

          {/* Action Button - Right */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="font-display font-bold text-base mb-4">Solicitar Atendimento</h2>
            <button
              onClick={() => setRequestOpen(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-6 flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <Stethoscope size={36} />
              <div className="text-center">
                <span className="text-lg font-bold block">Agendar Consulta</span>
                <span className="text-sm opacity-90">Solicite um atendimento veterinário</span>
              </div>
            </button>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Os registros médicos do seu pet são gerenciados pela clínica veterinária.
            </p>
          </motion.div>
        </div>
      </main>

      <RequestAppointmentDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        petId={pet.id}
        pets={[pet]}
        onAppointmentRequested={handleAppointmentRequested}
      />
    </div>
  );
};

export default PetProfile;
