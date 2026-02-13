import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Syringe } from 'lucide-react';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { useToast } from '@/hooks/use-toast';
import { TutorInfoSection } from './detail/TutorInfoSection';
import { Separator } from '@/components/ui/separator';

interface VacinaDialogProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  request: AppointmentRequest;
}

export const VacinaDialog = ({ open, onClose, onBack, request }: VacinaDialogProps) => {
  const { toast } = useToast();
  const date = request.scheduled_date || request.preferred_date;
  const time = request.scheduled_time || request.preferred_time;
  const [nomeVacina, setNomeVacina] = useState('');
  const [laboratorio, setLaboratorio] = useState('');
  const [lote, setLote] = useState('');
  const [proximaDose, setProximaDose] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && request.id) fetchVacinaData();
  }, [open, request.id]);

  const fetchVacinaData = async () => {
    const { data } = await supabase
      .from('pet_vaccine_records')
      .select('*')
      .eq('appointment_request_id', request.id)
      .maybeSingle();

    if (data) {
      setNomeVacina(data.vaccine_name || '');
      setLaboratorio(data.laboratory || '');
      setLote(data.batch_number || '');
      setProximaDose(data.next_dose_date || '');
      setObservacoes(data.notes || '');
    } else {
      setNomeVacina('');
      setLaboratorio('');
      setLote('');
      setProximaDose('');
      setObservacoes('');
    }
  };

  const handleSave = async () => {
    if (!nomeVacina) {
      toast({ title: 'Atenção', description: 'Por favor, informe o nome da vacina', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('pet_vaccine_records').upsert({
      appointment_request_id: request.id,
      pet_id: request.pet.id,
      user_id: userData.user?.id,
      vaccine_name: nomeVacina,
      laboratory: laboratorio || null,
      batch_number: lote || null,
      next_dose_date: proximaDose || null,
      notes: observacoes || null,
      administered_at: new Date().toISOString(),
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
            tipo_atendimento: 'vacina', 
            vacina: nomeVacina,
            salvo_em: new Date().toISOString() 
          }) 
        })
        .eq('id', request.id);
      toast({ title: 'Vacina registrada com sucesso!' });
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
            <Syringe size={20} className="text-cyan-500" />
            Registro de Vacina
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <TutorInfoSection request={request} date={date} time={time} />
          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomeVacina">Nome da Vacina *</Label>
              <Input
                id="nomeVacina"
                value={nomeVacina}
                onChange={(e) => setNomeVacina(e.target.value)}
                placeholder="Ex: V10, Antirrábica"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="laboratorio">Laboratório</Label>
                <Input
                  id="laboratorio"
                  value={laboratorio}
                  onChange={(e) => setLaboratorio(e.target.value)}
                  placeholder="Ex: Zoetis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lote">Lote</Label>
                <Input
                  id="lote"
                  value={lote}
                  onChange={(e) => setLote(e.target.value)}
                  placeholder="Nº do lote"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proximaDose">Próxima Dose</Label>
              <Input
                id="proximaDose"
                type="date"
                value={proximaDose}
                onChange={(e) => setProximaDose(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre a vacinação..."
                rows={3}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
            size="lg"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Salvando...' : 'Salvar Vacina'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
