import { useState } from 'react';
import { Appointment, PetType } from '@/types/appointment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dog, Cat, Bird, Rabbit, Plus } from 'lucide-react';

interface AddAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (appointment: Appointment) => void;
}

export function AddAppointmentDialog({
  open,
  onOpenChange,
  onAdd,
}: AddAppointmentDialogProps) {
  const [formData, setFormData] = useState({
    petName: '',
    petType: 'dog' as PetType,
    breed: '',
    age: '',
    weight: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    time: '',
    reason: '',
    notes: '',
    veterinarian: 'Dr. Carlos Mendes',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      pet: {
        id: crypto.randomUUID(),
        name: formData.petName,
        type: formData.petType,
        breed: formData.breed,
        age: formData.age,
        weight: formData.weight,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerEmail: formData.ownerEmail,
      },
      date: new Date(),
      time: formData.time,
      reason: formData.reason,
      notes: formData.notes,
      status: 'pending',
      veterinarian: formData.veterinarian,
    };

    onAdd(newAppointment);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      petName: '',
      petType: 'dog',
      breed: '',
      age: '',
      weight: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      time: '',
      reason: '',
      notes: '',
      veterinarian: 'Dr. Carlos Mendes',
    });
  };

  const petTypeIcons = {
    dog: Dog,
    cat: Cat,
    bird: Bird,
    rabbit: Rabbit,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Cadastrar Pet
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pet Info */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informações do Pet
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="petName">Nome do Pet</Label>
                <Input
                  id="petName"
                  value={formData.petName}
                  onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                  placeholder="Ex: Thor"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="petType">Tipo</Label>
                <Select
                  value={formData.petType}
                  onValueChange={(value: PetType) => setFormData({ ...formData, petType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="dog">🐕 Cachorro</SelectItem>
                    <SelectItem value="cat">🐱 Gato</SelectItem>
                    <SelectItem value="bird">🐦 Pássaro</SelectItem>
                    <SelectItem value="rabbit">🐰 Coelho</SelectItem>
                    <SelectItem value="hamster">🐹 Hamster</SelectItem>
                    <SelectItem value="other">🐾 Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed">Raça</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="Ex: Golden Retriever"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Ex: 3 anos"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Peso</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="Ex: 32 kg"
                  required
                />
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informações do Tutor
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="ownerName">Nome</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="ownerPhone">Telefone</Label>
                <Input
                  id="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  placeholder="(11) 99999-0000"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="ownerEmail">Email</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Appointment Info */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Detalhes da Consulta
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="veterinarian">Veterinário</Label>
                <Select
                  value={formData.veterinarian}
                  onValueChange={(value) => setFormData({ ...formData, veterinarian: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Dr. Carlos Mendes">Dr. Carlos Mendes</SelectItem>
                    <SelectItem value="Dra. Ana Paula">Dra. Ana Paula</SelectItem>
                    <SelectItem value="Dr. Roberto Lima">Dr. Roberto Lima</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="reason">Motivo da Consulta</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ex: Vacinação, Consulta de rotina..."
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground">
              <Plus size={16} className="mr-2" />
              Agendar Consulta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
