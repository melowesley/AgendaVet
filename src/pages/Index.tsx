import { useState } from 'react';
import { Appointment } from '@/types/appointment';
import { mockAppointments } from '@/data/mockAppointments';
import { AppointmentCard } from '@/components/AppointmentCard';
import { CaseSummaryDialog } from '@/components/CaseSummaryDialog';
import { AddAppointmentDialog } from '@/components/AddAppointmentDialog';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  PawPrint,
} from 'lucide-react';
import { motion } from 'framer-motion';

const Index = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCaseDialogOpen(true);
  };

  const handleStatusChange = (id: string, status: Appointment['status']) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id ? { ...apt, status } : apt
      )
    );
    setSelectedAppointment((prev) =>
      prev?.id === id ? { ...prev, status } : prev
    );
  };

  const handleAddAppointment = (appointment: Appointment) => {
    setAppointments((prev) => [...prev, appointment].sort((a, b) => 
      a.time.localeCompare(b.time)
    ));
  };

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    inProgress: appointments.filter((a) => a.status === 'in-progress').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-primary">
                <PawPrint className="text-primary-foreground" size={28} />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground">
                  VetAgenda
                </h1>
                <p className="text-sm text-muted-foreground">
                  Clínica Veterinária
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin'}
              >
                Área Admin
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/auth'}
              >
                Portal do Cliente
              </Button>
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="gradient-primary text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
              >
                <Plus size={18} className="mr-2" />
                Cadastrar Pet
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Date & Stats */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-6">
            <Calendar size={18} className="text-primary" />
            <span className="capitalize">{today}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              icon={Stethoscope}
              label="Total de Consultas"
              value={stats.total}
              variant="primary"
            />
            <StatsCard
              icon={AlertCircle}
              label="Pendentes"
              value={stats.pending}
              variant="warning"
            />
            <StatsCard
              icon={Clock}
              label="Em Atendimento"
              value={stats.inProgress}
              variant="accent"
            />
            <StatsCard
              icon={CheckCircle}
              label="Concluídas"
              value={stats.completed}
              variant="success"
            />
          </div>
        </motion.div>

        {/* Appointments List */}
        <div>
          <h2 className="font-display font-bold text-lg text-foreground mb-4">
            Agenda de Hoje
          </h2>

          <div className="space-y-3">
            {appointments
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AppointmentCard
                    appointment={appointment}
                    onClick={() => handleAppointmentClick(appointment)}
                  />
                </motion.div>
              ))}
          </div>

          {appointments.length === 0 && (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-muted inline-block mb-4">
                <Calendar size={32} className="text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                Nenhuma consulta agendada
              </h3>
              <p className="text-muted-foreground mb-4">
                Clique no botão acima para agendar uma nova consulta.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <CaseSummaryDialog
        appointment={selectedAppointment}
        open={caseDialogOpen}
        onOpenChange={setCaseDialogOpen}
        onStatusChange={handleStatusChange}
      />

      <AddAppointmentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddAppointment}
      />
    </div>
  );
};

export default Index;
