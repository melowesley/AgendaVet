import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Calendar, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getErrorMessage } from '@/utils/errorMessage';

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

interface RequestAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string | null;
  pets: Pet[];
  onAppointmentRequested: (appointment: AppointmentRequest) => void;
}

export function RequestAppointmentDialog({
  open,
  onOpenChange,
  petId,
  pets,
  onAppointmentRequested,
}: RequestAppointmentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    petId: '',
    date: '',
    time: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    if (petId) {
      setFormData((prev) => ({ ...prev, petId }));
    }
  }, [petId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('appointment_requests')
        .insert({
          user_id: user.id,
          pet_id: formData.petId,
          preferred_date: formData.date,
          preferred_time: formData.time,
          reason: formData.reason.trim(),
          notes: formData.notes.trim() || null,
        })
        .select('*, pets(*)')
        .single();

      if (error) throw error;

      onAppointmentRequested(data);
      onOpenChange(false);
      
      toast({
        title: 'Consulta solicitada!',
        description: 'Sua solicitação foi enviada com sucesso.',
      });
      
      // Reset form
      setFormData({
        petId: '',
        date: '',
        time: '',
        reason: '',
        notes: '',
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('Erro ao solicitar consulta:', error);
      toast({
        title: 'Erro ao solicitar consulta',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const minDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Solicitar Consulta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pet-select">Pet *</Label>
            <Select
              value={formData.petId}
              onValueChange={(value) => setFormData({ ...formData, petId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o pet" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {pets.map((pet) => (
                  <SelectItem key={pet.id} value={pet.id}>
                    {pet.name} ({pet.type === 'dog' ? 'Cachorro' : pet.type === 'cat' ? 'Gato' : pet.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred-date">Data Preferida *</Label>
              <Input
                id="preferred-date"
                type="date"
                min={minDate}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred-time">Horário Preferido *</Label>
              <Input
                id="preferred-time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Consulta *</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => setFormData({ ...formData, reason: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="Consulta de rotina">Consulta de rotina</SelectItem>
                <SelectItem value="Vacinação">Vacinação</SelectItem>
                <SelectItem value="Emergência">Emergência</SelectItem>
                <SelectItem value="Cirurgia">Cirurgia</SelectItem>
                <SelectItem value="Exames">Exames</SelectItem>
                <SelectItem value="Banho e tosa">Banho e tosa</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment-notes">Observações</Label>
            <Textarea
              id="appointment-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Descreva os sintomas ou informações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="gradient-primary text-primary-foreground"
              disabled={loading || !formData.petId}
            >
              {loading ? 'Enviando...' : (
                <>
                  <Send size={16} className="mr-2" />
                  Solicitar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    </>
  );
}
