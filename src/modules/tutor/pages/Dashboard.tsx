import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PawPrint, Plus, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { AddPetDialog } from '@/modules/tutor/components/AddPetDialog';
import { PetCard } from '@/modules/tutor/components/PetCard';
import { RequestAppointmentDialog } from '@/modules/tutor/components/RequestAppointmentDialog';
import { AppointmentRequestCard } from '@/modules/tutor/components/AppointmentRequestCard';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { useAuthStore } from '@/store/useAuthStore';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
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
  pets?: Pet;
}

const ClientPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [requestAppointmentOpen, setRequestAppointmentOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  // Garante que os dados sejam buscados apenas UMA vez por sessão,
  // mesmo que TOKEN_REFRESHED acione re-renders no Android
  const dataLoaded = useRef(false);

  const loadData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const [petsResult, appointmentsResult] = await Promise.all([
        supabase
          .from('pets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('appointment_requests')
          .select('*, pets(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ]);

      if (petsResult.error) {
        console.error('Error loading pets:', petsResult.error);
        toast({
          title: 'Erro ao carregar pets',
          description: petsResult.error.message,
          variant: 'destructive',
        });
      } else {
        setPets(petsResult.data || []);
      }

      if (appointmentsResult.error) {
        console.error('Error loading appointments:', appointmentsResult.error);
        toast({
          title: 'Erro ao carregar solicitações',
          description: appointmentsResult.error.message,
          variant: 'destructive',
        });
      } else {
        setAppointments(appointmentsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Efeito 1: Apenas trata o redirecionamento de autenticação.
  // Roda somente quando o estado de loading termina — nunca em loop.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Efeito 2: Carrega os dados apenas UMA vez quando o usuário está autenticado.
  // O ref dataLoaded garante que TOKEN_REFRESHED não dispare nova busca.
  useEffect(() => {
    if (authLoading || !user || dataLoaded.current) return;
    dataLoaded.current = true;
    loadData(user.id);
  }, [authLoading, user, loadData]);

  const handlePetAdded = (newPet: Pet) => {
    setPets((prev) => [newPet, ...prev]);
    toast({
      title: 'Pet cadastrado!',
      description: `${newPet.name} foi adicionado com sucesso.`,
    });
  };

  const handleAppointmentRequested = (newAppointment: AppointmentRequest) => {
    setAppointments((prev) => [newAppointment, ...prev]);
    toast({
      title: 'Solicitação enviada!',
      description: 'Aguarde a confirmação da clínica.',
    });
  };

  const openRequestAppointment = (petId: string) => {
    setSelectedPetId(petId);
    setRequestAppointmentOpen(true);
  };

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return (
    <ClientLayout>
      <div className="container max-w-4xl mx-auto">
        {/* Pets Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">
              Meus Pets
            </h2>
            <Button
              onClick={() => setAddPetOpen(true)}
              size="sm"
              className="gradient-primary text-primary-foreground"
            >
              <Plus size={16} className="mr-2" />
              Adicionar Pet
            </Button>
          </div>

          {pets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <div className="p-4 rounded-full bg-muted inline-block mb-4">
                  <PawPrint size={32} className="text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  Nenhum pet cadastrado
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Cadastre seu pet para solicitar consultas
                </p>
                <Button
                  onClick={() => setAddPetOpen(true)}
                  className="gradient-primary text-primary-foreground"
                >
                  <Plus size={16} className="mr-2" />
                  Cadastrar Pet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {pets.map((pet, index) => (
                <motion.div
                  key={pet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PetCard
                    pet={pet}
                    onRequestAppointment={() => openRequestAppointment(pet.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Appointments Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display font-bold text-lg text-foreground mb-4">
            Minhas Solicitações
          </h2>

          {appointments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <div className="p-4 rounded-full bg-muted inline-block mb-4">
                  <Calendar size={32} className="text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  Nenhuma solicitação
                </h3>
                <p className="text-muted-foreground text-sm">
                  Clique em "Agendar Consulta" em um dos seus pets
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AppointmentRequestCard appointment={appointment} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Dialogs */}
        <AddPetDialog
          open={addPetOpen}
          onOpenChange={setAddPetOpen}
          onPetAdded={handlePetAdded}
        />

        <RequestAppointmentDialog
          open={requestAppointmentOpen}
          onOpenChange={setRequestAppointmentOpen}
          petId={selectedPetId}
          pets={pets}
          onAppointmentRequested={handleAppointmentRequested}
        />
      </div>
    </ClientLayout>
  );
};

export default ClientPortal;
