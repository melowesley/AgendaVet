import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PawPrint, Plus, Calendar, LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { AddPetDialog } from '@/components/client/AddPetDialog';
import { PetCard } from '@/components/client/PetCard';
import { RequestAppointmentDialog } from '@/components/client/RequestAppointmentDialog';
import { AppointmentRequestCard } from '@/components/client/AppointmentRequestCard';
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [requestAppointmentOpen, setRequestAppointmentOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [petsResult, appointmentsResult] = await Promise.all([
        supabase.from('pets').select('*').order('created_at', { ascending: false }),
        supabase.from('appointment_requests').select('*, pets(*)').order('created_at', { ascending: false }),
      ]);

      if (petsResult.data) setPets(petsResult.data);
      if (appointmentsResult.data) setAppointments(appointmentsResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-primary">
                <PawPrint className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-foreground">
                  Portal do Cliente
                </h1>
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground"
            >
              <LogOut size={18} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
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
      </main>

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
  );
};

export default ClientPortal;
