import { useState } from 'react';
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
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
}

interface AddPetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPetAdded: (pet: Pet) => void;
}

export function AddPetDialog({ open, onOpenChange, onPetAdded }: AddPetDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'dog',
    breed: '',
    age: '',
    weight: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('pets')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          type: formData.type,
          breed: formData.breed.trim() || null,
          age: formData.age.trim() || null,
          weight: formData.weight.trim() || null,
          notes: formData.notes.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      onPetAdded(data);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        type: 'dog',
        breed: '',
        age: '',
        weight: '',
        notes: '',
      });
    } catch (error: unknown) {
      let message = 'Ocorreu um erro inesperado';
      if (error instanceof Error) {
        message = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        message = String((error as { message: unknown }).message);
      }
      if (message.includes('permission denied') || message.includes('row-level security')) {
        message = 'Sem permissão. Faça login novamente e tente de novo.';
      }
      toast({
        title: 'Erro ao cadastrar pet',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Cadastrar Novo Pet
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pet-name">Nome do Pet *</Label>
            <Input
              id="pet-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Thor"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pet-type">Tipo *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="dog">🐕 Cachorro</SelectItem>
                <SelectItem value="cat">🐱 Gato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pet-breed">Raça</Label>
              <Input
                id="pet-breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                placeholder="Ex: Golden Retriever"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pet-age">Idade</Label>
              <Input
                id="pet-age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Ex: 3 anos"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pet-weight">Peso</Label>
            <Input
              id="pet-weight"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="Ex: 32 kg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pet-notes">Observações</Label>
            <Textarea
              id="pet-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Alergias, condições especiais..."
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
              disabled={loading}
            >
              {loading ? 'Salvando...' : (
                <>
                  <Plus size={16} className="mr-2" />
                  Cadastrar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
