import { Appointment } from '@/types/appointment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PetAvatar } from './PetAvatar';
import { StatusBadge } from './StatusBadge';
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  Stethoscope,
  Weight,
  Cake,
  FileText,
  CheckCircle,
  XCircle,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CaseSummaryDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (id: string, status: Appointment['status']) => void;
}

export function CaseSummaryDialog({
  appointment,
  open,
  onOpenChange,
  onStatusChange,
}: CaseSummaryDialogProps) {
  if (!appointment) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader className="pb-2">
          <DialogTitle className="font-display text-xl">
            Resumo do Caso
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={appointment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Pet Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
              <PetAvatar
                type={appointment.pet.type}
                name={appointment.pet.name}
                size="lg"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="font-display font-bold text-2xl text-foreground">
                    {appointment.pet.name}
                  </h2>
                  <StatusBadge status={appointment.status} />
                </div>
                <p className="text-muted-foreground">{appointment.pet.breed}</p>
              </div>
            </div>

            {/* Pet Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Cake size={18} className="text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Idade</p>
                  <p className="font-medium">{appointment.pet.age}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Weight size={18} className="text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Peso</p>
                  <p className="font-medium">{appointment.pet.weight}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Owner Info */}
            <div>
              <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Informações do Tutor
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-primary" />
                  <span>{appointment.pet.ownerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-primary" />
                  <span>{appointment.pet.ownerPhone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-primary" />
                  <span>{appointment.pet.ownerEmail}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Appointment Info */}
            <div>
              <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Detalhes da Consulta
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-primary" />
                  <span className="capitalize">{formatDate(appointment.date)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-primary" />
                  <span>{appointment.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Stethoscope size={16} className="text-primary" />
                  <span>{appointment.veterinarian}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Reason & Notes */}
            <div>
              <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Motivo da Consulta
              </h3>
              <p className="font-medium text-foreground">{appointment.reason}</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-start gap-3">
                <FileText size={16} className="text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Observações</h4>
                  <p className="text-sm text-muted-foreground">
                    {appointment.notes}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              {appointment.status !== 'in-progress' && appointment.status !== 'completed' && (
                <Button
                  onClick={() => onStatusChange?.(appointment.id, 'in-progress')}
                  className="flex-1 sm:flex-none gradient-primary text-primary-foreground"
                >
                  <Play size={16} className="mr-2" />
                  Iniciar Atendimento
                </Button>
              )}
              {appointment.status === 'in-progress' && (
                <Button
                  onClick={() => onStatusChange?.(appointment.id, 'completed')}
                  className="flex-1 sm:flex-none bg-success hover:bg-success/90 text-success-foreground"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Concluir
                </Button>
              )}
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <Button
                  variant="outline"
                  onClick={() => onStatusChange?.(appointment.id, 'cancelled')}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <XCircle size={16} className="mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
