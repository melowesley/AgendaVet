import { Appointment } from '@/types/appointment';
import { Card, CardContent } from '@/components/ui/card';
import { PetAvatar } from './PetAvatar';
import { StatusBadge } from './StatusBadge';
import { Clock, User, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer hover:shadow-card transition-all duration-300 border-border/50 bg-card"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <PetAvatar type={appointment.pet.type} name={appointment.pet.name} size="md" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-foreground">
                    {appointment.pet.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {appointment.pet.breed}
                  </p>
                </div>
                <StatusBadge status={appointment.status} />
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-primary" />
                  <span>{appointment.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User size={14} className="text-primary" />
                  <span className="truncate">{appointment.pet.ownerName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Stethoscope size={14} className="text-primary" />
                  <span>{appointment.veterinarian}</span>
                </div>
              </div>

              <p className="mt-2 text-sm font-medium text-foreground/80">
                {appointment.reason}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
