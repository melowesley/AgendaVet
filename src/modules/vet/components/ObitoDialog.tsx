import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, PageDialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skull, Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { logPetAdminHistory } from './petAdminHistory';

interface ObitoDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
  petId: string;
  petName: string;
}

export const ObitoDialog = ({ open, onClose, onBack, onSuccess, petId, petName }: ObitoDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [obitoDate, setObitoDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [obitoTime, setObitoTime] = useState(format(new Date(), 'HH:mm'));
  const [cause, setCause] = useState('');
  const [causeType, setCauseType] = useState('natural');
  const [veterinarian, setVeterinarian] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');

  const handleSave = async () => {
    if (!obitoDate || !cause) {
      toast({ title: 'Erro', description: 'Data e causa são obrigatórios', variant: 'destructive' });
      return;
    }

    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user?.id) {
      toast({ title: 'Erro', description: 'Não foi possível obter dados do usuário.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Registrar no histórico administrativo
    await logPetAdminHistory({
      petId,
      module: 'obito',
      action: 'create',
        title: 'Ficha de Óbito',
      details: {
        data_obito: obitoDate,
        hora_obito: obitoTime,
        causa: cause,
        tipo_causa: causeType === 'natural' ? 'Natural' : causeType === 'acidental' ? 'Acidental' : causeType === 'eutanasia' ? 'Eutanásia' : 'Outros',
        veterinario: veterinarian || '—',
        local: location || '—',
        observacoes: notes || '—',
      },
    });

    // Registrar na tabela de óbitos (mortes)
    const dataDeMorteIso = new Date(`${obitoDate}T${obitoTime}`).toISOString();
    const notasCompletas = [
      causeType !== 'natural' && `Tipo: ${causeType === 'acidental' ? 'Acidental' : causeType === 'eutanasia' ? 'Eutanásia' : 'Outros'}`,
      veterinarian && `Veterinário: ${veterinarian}`,
      location && `Local: ${location}`,
      notes,
    ].filter(Boolean).join('\n') || null;

    await supabase.from('mortes').insert({
      pet_id: petId,
      data_de_morte: dataDeMorteIso,
      causa: cause,
      notas: notasCompletas || undefined,
    });

    // Registrar como observação também (histórico legado)
    await supabase.from('pet_observations').insert({
      pet_id: petId,
      user_id: userData.user.id,
      title: `Óbito - ${petName}`,
      observation: `Causa: ${cause}\nTipo: ${causeType}\nData: ${obitoDate} ${obitoTime}\n${veterinarian ? `Veterinário: ${veterinarian}\n` : ''}${location ? `Local: ${location}\n` : ''}${notes ? `Obs: ${notes}` : ''}`,
      observation_date: obitoDate,
      category: 'obito',
    });

    // Atualizar o pet com nota de óbito
    await supabase
      .from('pets')
      .update({
        notes: `[ÓBITO ${obitoDate}] ${cause}${notes ? ` - ${notes}` : ''}`,
      })
      .eq('id', petId);

    toast({
      title: 'Registro realizado',
      description: `Óbito de ${petName} registrado com sucesso.`,
    });

    onSuccess?.();
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <PageDialogContent className="p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack || onClose}>
              <ArrowLeft size={16} />
            </Button>
            <Skull className="h-5 w-5" />
            Informar Óbito - {petName}
          </DialogTitle>
          <DialogDescription>
            Registre as informações sobre o falecimento do paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {confirmed && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Confirmação necessária</p>
                <p className="text-sm text-muted-foreground">
                  Você está prestes a registrar o óbito de <strong>{petName}</strong>. 
                  Esta ação não pode ser desfeita facilmente. Clique em "Confirmar Registro" para prosseguir.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ob-date">Data do Óbito *</Label>
                <Input id="ob-date" type="date" value={obitoDate} onChange={e => setObitoDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ob-time">Hora</Label>
                <Input id="ob-time" type="time" value={obitoTime} onChange={e => setObitoTime(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ob-type">Tipo de Causa</Label>
                <Select value={causeType} onValueChange={setCauseType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="acidental">Acidental</SelectItem>
                    <SelectItem value="eutanasia">Eutanásia</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ob-vet">Veterinário Responsável</Label>
                <Input id="ob-vet" value={veterinarian} onChange={e => setVeterinarian(e.target.value)} placeholder="Nome do veterinário" spellCheck lang="pt-BR" />
              </div>
            </div>

            <div>
              <Label htmlFor="ob-cause">Causa *</Label>
              <Textarea id="ob-cause" value={cause} onChange={e => setCause(e.target.value)} placeholder="Descreva a causa do óbito..." rows={3} spellCheck lang="pt-BR" />
            </div>

            <div>
              <Label htmlFor="ob-location">Local</Label>
              <Input id="ob-location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Clínica, Residência..." spellCheck lang="pt-BR" />
            </div>

            <div>
              <Label htmlFor="ob-notes">Observações</Label>
              <Textarea id="ob-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informações adicionais..." rows={2} spellCheck lang="pt-BR" />
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              variant={confirmed ? 'destructive' : 'default'}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Registrando...' : confirmed ? 'Confirmar Registro de Óbito' : 'Informar Óbito'}
            </Button>
          </div>
        </div>
      </PageDialogContent>
    </Dialog>
  );
};
