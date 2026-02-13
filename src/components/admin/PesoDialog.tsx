import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Scale } from 'lucide-react';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { useToast } from '@/hooks/use-toast';
import { TutorInfoSection } from './detail/TutorInfoSection';
import { Separator } from '@/components/ui/separator';

interface PesoDialogProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  request: AppointmentRequest;
}

export const PesoDialog = ({ open, onClose, onBack, request }: PesoDialogProps) => {
  const { toast } = useToast();
  const date = request.scheduled_date || request.preferred_date;
  const time = request.scheduled_time || request.preferred_time;
  const [peso, setPeso] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && request.id) fetchPesoData();
  }, [open, request.id]);

  const fetchPesoData = async () => {
    const { data } = await supabase
      .from('pet_weight_records')
      .select('*')
      .eq('appointment_request_id', request.id)
      .maybeSingle();

    if (data) {
      setPeso(data.weight?.toString() || '');
      setObservacoes(data.notes || '');
    } else {
      setPeso('');
      setObservacoes('');
    }
  };

  const handleSave = async () => {
    if (!peso) {
      toast({ title: 'Atenção', description: 'Por favor, informe o peso', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('pet_weight_records').upsert({
      appointment_request_id: request.id,
      pet_id: request.pet.id,
      user_id: userData.user?.id,
      weight: parseFloat(peso),
      notes: observacoes || null,
      recorded_at: new Date().toISOString(),
    }, {
      onConflict: 'appointment_request_id',
    });

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      await supabase
        .from('appointment_requests')
        .update({ 
          status: 'completed', 
          admin_notes: JSON.stringify({ 
            tipo_atendimento: 'peso', 
            peso: parseFloat(peso),
            salvo_em: new Date().toISOString() 
          }) 
        })
        .eq('id', request.id);
      toast({ title: 'Peso registrado com sucesso!' });
      onClose();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
              <ArrowLeft size={16} />
            </Button>
            <Scale size={20} className="text-orange-500" />
            Registro de Peso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <TutorInfoSection request={request} date={date} time={time} />
          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="peso">Peso (kg) *</Label>
              <Input
                id="peso"
                type="number"
                step="0.01"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="Ex: 12.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre o peso..."
                rows={4}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            size="lg"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Salvando...' : 'Salvar Peso'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
