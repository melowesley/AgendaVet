import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePetsList } from '@/hooks/usePetsList';
import { ATTENDANCE_TYPES, type AttendanceTypeKey } from '@/modules/vet/components/AttendanceTypeDialog';
import { Search, PawPrint } from 'lucide-react';
import { useState } from 'react';

const TYPE_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐱',
};

interface SelectPatientForAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedureType: AttendanceTypeKey | null;
  onSelectPet: (petId: string) => void;
}

export const SelectPatientForAttendanceDialog = ({
  open,
  onOpenChange,
  procedureType,
  onSelectPet,
}: SelectPatientForAttendanceDialogProps) => {
  const navigate = useNavigate();
  const { pets, loading } = usePetsList();
  const [localSearch, setLocalSearch] = useState('');

  const label = procedureType
    ? ATTENDANCE_TYPES.find((t) => t.key === procedureType)?.label ?? procedureType
    : '';

  const handleSelect = (petId: string) => {
    onSelectPet(petId);
    onOpenChange(false);
    navigate(`/admin/pet/${petId}`);
  };

  const filteredPets = localSearch.trim()
    ? pets.filter(
      (p) =>
        p.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        (p.owner_name?.toLowerCase().includes(localSearch.toLowerCase()) ?? false)
    )
    : pets;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Iniciar atendimento: {label || 'Selecione o tipo'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Selecione o paciente para este atendimento. Você será levado à ficha do pet e o procedimento será aberto.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar paciente ou tutor"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ScrollArea className="h-[min(50vh,320px)] rounded-md border">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <PawPrint className="mx-auto h-8 w-8 mb-2 opacity-50" />
              {localSearch.trim() ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado.'}
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {filteredPets.map((pet) => (
                <li key={pet.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(pet.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-teal-50 dark:hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-2xl flex-shrink-0">{TYPE_EMOJI[pet.type] || '🐾'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{pet.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {pet.type === 'dog' ? 'Cachorro' : 'Gato'}
                        {pet.breed && ` · ${pet.breed}`}
                        {pet.owner_name && ` · ${pet.owner_name}`}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
