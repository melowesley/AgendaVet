import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PawPrint, Plus, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { AddPetDialog } from '@/components/client/AddPetDialog';
import { PetCard } from '@/components/client/PetCard';
import { RequestAppointmentDialog } from '@/components/client/RequestAppointmentDialog';
import { AppointmentRequestCard } from '@/components/client/AppointmentRequestCard';
import { ClientLayout } from '@/components/layout/ClientLayout';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  getClientPortalSnapshot,
  isNetworkOnline,
  markQueueForRetry,
  syncClientPortalData,
} from '@/lib/local-first/sync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
  sync_state?: 'synced' | 'pending' | 'failed';
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
  sync_state?: 'synced' | 'pending' | 'failed';
  pets?: Pet;
}

const ClientPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [requestAppointmentOpen, setRequestAppointmentOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const refreshLocalSnapshot = useCallback(async (userId: string) => {
    const snapshot = await getClientPortalSnapshot(userId);
    setPets(snapshot.pets);
    setAppointments(snapshot.appointments);
    setPendingOperations(snapshot.pendingOperations);
    setLastSyncedAt(snapshot.lastSyncedAt);
  }, []);

  const runSync = useCallback(
    async (userId: string, silent = false) => {
      if (!isNetworkOnline()) return;

      setIsSyncing(true);
      try {
        await syncClientPortalData(userId);
        await refreshLocalSnapshot(userId);

        if (!silent) {
          toast({
            title: 'Sincronização concluída',
            description: 'Dados locais e Supabase estão alinhados.',
          });
        }
      } catch (error) {
        if (!silent) {
          const message =
            error instanceof Error ? error.message : 'Falha ao sincronizar dados.';
          toast({
            title: 'Erro na sincronização',
            description: message,
            variant: 'destructive',
          });
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [refreshLocalSnapshot, toast],
  );

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      await refreshLocalSnapshot(session.user.id);
      await runSync(session.user.id, true);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          refreshLocalSnapshot(session.user.id);
          runSync(session.user.id, true);
        }
      }
    });

    checkAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, refreshLocalSnapshot, runSync]);

  useEffect(() => {
    if (!user) return;

    const handleReconnect = async () => {
      toast({
        title: 'Conexão restabelecida',
        description: 'Tentando sincronizar pendências...',
      });
      await runSync(user.id, true);
    };

    window.addEventListener('online', handleReconnect);
    return () => window.removeEventListener('online', handleReconnect);
  }, [user, runSync, toast]);

  const handlePetAdded = (newPet: Pet) => {
    setPets((prev) => [newPet, ...prev.filter((item) => item.id !== newPet.id)]);
    if (newPet.sync_state === 'synced') {
      toast({
        title: 'Pet cadastrado!',
        description: `${newPet.name} foi adicionado e sincronizado.`,
      });
    } else {
      toast({
        title: 'Pet salvo offline',
        description: `${newPet.name} foi salvo localmente e será sincronizado ao reconectar.`,
      });
    }

    if (user) {
      refreshLocalSnapshot(user.id);
    }
  };

  const handleAppointmentRequested = (newAppointment: AppointmentRequest) => {
    setAppointments((prev) => [
      newAppointment,
      ...prev.filter((item) => item.id !== newAppointment.id),
    ]);

    if (newAppointment.sync_state === 'synced') {
      toast({
        title: 'Solicitação enviada!',
        description: 'A solicitação foi sincronizada com a clínica.',
      });
    } else {
      toast({
        title: 'Solicitação salva offline',
        description: 'A solicitação será sincronizada quando houver conexão.',
      });
    }

    if (user) {
      refreshLocalSnapshot(user.id);
    }
  };

  const openRequestAppointment = (petId: string) => {
    setSelectedPetId(petId);
    setRequestAppointmentOpen(true);
  };

  const handleRetrySync = async () => {
    if (!user) return;

    if (!isNetworkOnline()) {
      toast({
        title: 'Sem conexão',
        description: 'Conecte-se à internet para sincronizar as pendências.',
        variant: 'destructive',
      });
      return;
    }

    await markQueueForRetry(user.id);
    await runSync(user.id);
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
        <Card className="mb-4 border-dashed">
          <CardContent className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {isOnline ? 'Online' : 'Offline'} • Pendências de sync: {pendingOperations}
              </p>
              <p className="text-muted-foreground text-xs">
                {lastSyncedAt
                  ? `Última sincronização: ${new Date(lastSyncedAt).toLocaleString('pt-BR')}`
                  : 'Ainda não houve sincronização completa.'}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetrySync}
              disabled={isSyncing}
            >
              {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
            </Button>
          </CardContent>
        </Card>

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
        userId={user.id}
      />

      <RequestAppointmentDialog
        open={requestAppointmentOpen}
        onOpenChange={setRequestAppointmentOpen}
        petId={selectedPetId}
        pets={pets}
        onAppointmentRequested={handleAppointmentRequested}
        userId={user.id}
      />
      </div>
    </ClientLayout>
  );
};

export default ClientPortal;
