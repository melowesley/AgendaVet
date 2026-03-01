import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetsList, type PetListItem } from '@/hooks/usePetsList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, PawPrint, User, Eye, Pill, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdminAddPetDialog } from './AdminAddPetDialog';

const TYPE_LABELS: Record<string, string> = {
  dog: 'Canina',
  cat: 'Felina',
};

const TYPE_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐱',
};

export const PetsListTab = () => {
  const navigate = useNavigate();
  const { pets, loading, searchTerm, setSearchTerm, refetch } = usePetsList();
  const [addOpen, setAddOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AdminAddPetDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={refetch}
      />

      {/* Barra de Busca + Botão Adicionar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar paciente ou tutor"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="px-3 py-2">
          {pets.length} paciente{pets.length !== 1 ? 's' : ''}
        </Badge>
        <Button onClick={() => setAddOpen(true)} size="sm" className="gap-2 shrink-0">
          <Plus size={16} />
          Novo Paciente
        </Button>
      </div>

      {/* Lista de Pacientes */}
      {pets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <PawPrint className="mx-auto mb-2 text-muted-foreground" size={28} />
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Nenhum paciente encontrado para a busca.' : 'Nenhum paciente cadastrado.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map(pet => (
            <PetCard key={pet.id} pet={pet} onViewRecord={() => navigate(`/admin/pet/${pet.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
};

interface PetCardProps {
  pet: PetListItem;
  onViewRecord: () => void;
}

const PetCard = ({ pet, onViewRecord }: PetCardProps) => {
  const emoji = TYPE_EMOJI[pet.type] || '🐾';
  const typeLabel = TYPE_LABELS[pet.type] || pet.type;
  const hasActivePrescriptions = pet.prescriptions.length > 0;
  const isHospitalized = !!pet.hospitalization_status;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl flex-shrink-0">{emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base truncate">{pet.name}</h3>
              {isHospitalized && (
                <Badge variant="destructive" className="text-[10px]">
                  Internado
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <User size={10} />
              <span>{pet.owner_name || 'Sem tutor'}</span>
            </div>
            {pet.hospitalization_location && (
              <p className="text-xs font-medium text-blue-600 mt-0.5">
                {pet.hospitalization_location}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {typeLabel}
              {pet.breed && ` | ${pet.breed}`}
              {pet.age && ` | ${pet.age}`}
            </p>
            {pet.weight && (
              <p className="text-xs text-muted-foreground">
                Peso: {pet.weight}
              </p>
            )}
          </div>
        </div>

        {/* Prescrições */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center gap-1 mb-1">
            <Pill size={12} className="text-muted-foreground" />
            <span className="text-xs font-semibold">Prescrições</span>
          </div>
          {hasActivePrescriptions ? (
            <div className="space-y-1">
              {pet.prescriptions.slice(0, 3).map(presc => (
                <p key={presc.id} className="text-xs text-muted-foreground truncate">
                  {presc.medication_name}
                  {presc.veterinarian && ` - ${presc.veterinarian}`}
                  {' '}({format(new Date(presc.prescription_date), 'dd/MM/yyyy', { locale: ptBR })})
                </p>
              ))}
              {pet.prescriptions.length > 3 && (
                <p className="text-xs text-primary">+{pet.prescriptions.length - 3} mais</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum procedimento recente
            </p>
          )}
        </div>

        {/* Botão Ver Ficha */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3 text-primary border-primary hover:bg-primary/5"
          onClick={onViewRecord}
        >
          <Eye size={14} className="mr-1" />
          VER FICHA
        </Button>
      </CardContent>
    </Card>
  );
};
