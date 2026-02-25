import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye } from 'lucide-react';

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

interface PetCardProps {
  pet: Pet;
  onRequestAppointment: () => void;
}

const petTypeEmojis: Record<string, string> = {
  dog: '🐕',
  cat: '🐱',
};

const petTypeLabels: Record<string, string> = {
  dog: 'Cachorro',
  cat: 'Gato',
};

export function PetCard({ pet, onRequestAppointment }: PetCardProps) {
  const navigate = useNavigate();
  const emoji = petTypeEmojis[pet.type] || '🐾';
  const label = petTypeLabels[pet.type] || 'Pet';
  const pendingSync = pet.sync_state === 'pending' || pet.sync_state === 'failed';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="text-4xl flex-shrink-0">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-foreground truncate">
                {pet.name}
              </h3>
              {pendingSync && (
                <Badge
                  variant={pet.sync_state === 'failed' ? 'destructive' : 'secondary'}
                  className="shrink-0"
                >
                  {pet.sync_state === 'failed' ? 'Falha no sync' : 'Pend. sync'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {label}
              {pet.breed && ` • ${pet.breed}`}
            </p>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              {pet.age && (
                <span className="bg-muted px-2 py-0.5 rounded-full">{pet.age}</span>
              )}
              {pet.weight && (
                <span className="bg-muted px-2 py-0.5 rounded-full">{pet.weight}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border flex gap-2">
          <Button
            onClick={() => navigate(`/cliente/pet/${pet.id}`)}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Eye size={16} className="mr-2" />
            Ver Ficha
          </Button>
          <Button
            onClick={onRequestAppointment}
            size="sm"
            className="flex-1 gradient-primary text-primary-foreground"
          >
            <Calendar size={16} className="mr-2" />
            Agendar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
