import { useState } from 'react';
import { supabase } from '@/core/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useToast } from '@/shared/hooks/use-toast';
import { PawPrint, Save, User, Phone, Mail } from 'lucide-react';

interface AdminAddPetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AdminAddPetDialog = ({ open, onOpenChange, onSuccess }: AdminAddPetDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    // Dados do pet
    name: '',
    type: 'dog',
    breed: '',
    age: '',
    weight: '',
    color: '',
    sex: '',
    notes: '',
    // Dados do tutor
    tutor_name: '',
    tutor_lastname: '',
    tutor_phone: '',
    tutor_email: '',
    tutor_address: '',
  });

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!form.name.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Nome do paciente é obrigatório.', variant: 'destructive' });
      return;
    }
    if (!form.tutor_name.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Nome do tutor é obrigatório.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('Não autenticado');

      const ownerId = userData.user.id;
      const tutorFullName = [form.tutor_name.trim(), form.tutor_lastname.trim()].filter(Boolean).join(' ') || form.tutor_name.trim();

      const payload: any = {
        user_id: ownerId,
        name: form.name.trim(),
        type: form.type,
        breed: form.breed.trim() || null,
        age: form.age.trim() || null,
        weight: form.weight.trim() || null,
        notes: [
          form.notes.trim(),
          form.color ? `Cor/pelagem: ${form.color}` : null,
          form.sex ? `Sexo: ${form.sex === 'M' ? 'Macho' : 'Fêmea'}` : null,
          tutorFullName ? `Tutor: ${tutorFullName}` : null,
          form.tutor_phone ? `Tel: ${form.tutor_phone}` : null,
          form.tutor_email ? `Email: ${form.tutor_email}` : null,
          form.tutor_address ? `Endereço: ${form.tutor_address}` : null,
        ].filter(Boolean).join('\n') || null,
      };

      const { error } = await supabase.from('pets').insert(payload);
      if (error) throw error;

      toast({ title: 'Paciente cadastrado!', description: `${form.name} foi adicionado com sucesso.` });
      setForm({ name: '', type: 'dog', breed: '', age: '', weight: '', color: '', sex: '', notes: '', tutor_name: '', tutor_lastname: '', tutor_phone: '', tutor_email: '', tutor_address: '' });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error saving pet:', err);
      toast({ title: 'Erro ao cadastrar', description: err.message || 'Erro desconhecido', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5" />
            Cadastrar Novo Paciente
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do animal e do tutor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6">
          {/* ── DADOS DO ANIMAL ───────────────────────────────────── */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <PawPrint size={15} /> Dados do Animal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ap-name">Nome *</Label>
                <Input id="ap-name" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ex: Buddy" />
              </div>
              <div>
                <Label htmlFor="ap-type">Espécie *</Label>
                <Select value={form.type} onValueChange={v => update('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">🐕 Canino</SelectItem>
                    <SelectItem value="cat">🐱 Felino</SelectItem>
                    <SelectItem value="bird">🐦 Ave</SelectItem>
                    <SelectItem value="rabbit">🐇 Coelho</SelectItem>
                    <SelectItem value="hamster">🐹 Hamster</SelectItem>
                    <SelectItem value="reptile">🦎 Réptil</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ap-breed">Raça</Label>
                <Input id="ap-breed" value={form.breed} onChange={e => update('breed', e.target.value)} placeholder="Ex: Labrador" />
              </div>
              <div>
                <Label htmlFor="ap-age">Idade</Label>
                <Input id="ap-age" value={form.age} onChange={e => update('age', e.target.value)} placeholder="Ex: 3 anos" />
              </div>
              <div>
                <Label htmlFor="ap-weight">Peso</Label>
                <Input id="ap-weight" value={form.weight} onChange={e => update('weight', e.target.value)} placeholder="Ex: 12 kg" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ap-color">Cor / Pelagem</Label>
                <Input id="ap-color" value={form.color} onChange={e => update('color', e.target.value)} placeholder="Ex: Caramelo" />
              </div>
              <div>
                <Label htmlFor="ap-sex">Sexo</Label>
                <Select value={form.sex} onValueChange={v => update('sex', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Macho</SelectItem>
                    <SelectItem value="F">Fêmea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="ap-notes">Observações / Histórico resumido</Label>
              <Textarea id="ap-notes" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Alergias, condições pré-existentes..." rows={2} />
            </div>
          </div>

          {/* ── DADOS DO TUTOR ────────────────────────────────────── */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <User size={15} /> Dados do Tutor
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ap-tutor-name">Nome do Tutor *</Label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="ap-tutor-name" className="pl-9" value={form.tutor_name} onChange={e => update('tutor_name', e.target.value)} placeholder="Nome" />
                </div>
              </div>
              <div>
                <Label htmlFor="ap-tutor-lastname">Sobrenome</Label>
                <Input id="ap-tutor-lastname" value={form.tutor_lastname} onChange={e => update('tutor_lastname', e.target.value)} placeholder="Sobrenome" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ap-tutor-phone">Telefone</Label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="ap-tutor-phone" className="pl-9" type="tel" value={form.tutor_phone} onChange={e => update('tutor_phone', e.target.value)} placeholder="(11) 99999-0000" />
                </div>
              </div>
              <div>
                <Label htmlFor="ap-tutor-email">Email</Label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="ap-tutor-email" className="pl-9" type="email" value={form.tutor_email} onChange={e => update('tutor_email', e.target.value)} placeholder="tutor@email.com" />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="ap-tutor-address">Endereço</Label>
              <Input id="ap-tutor-address" value={form.tutor_address} onChange={e => update('tutor_address', e.target.value)} placeholder="Rua, número, bairro, cidade" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Cadastrando...' : 'Cadastrar Paciente'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
