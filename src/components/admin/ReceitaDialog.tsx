import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, FileText, Download } from 'lucide-react';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { useToast } from '@/hooks/use-toast';
import { TutorInfoSection } from './detail/TutorInfoSection';
import { Separator } from '@/components/ui/separator';

interface ReceitaDialogProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  request: AppointmentRequest;
}

export const ReceitaDialog = ({ open, onClose, onBack, request }: ReceitaDialogProps) => {
  const { toast } = useToast();
  const date = request.scheduled_date || request.preferred_date;
  const time = request.scheduled_time || request.preferred_time;
  const [medicamentos, setMedicamentos] = useState('');
  const [posologia, setPosologia] = useState('');
  const [duracao, setDuracao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && request.id) fetchReceitaData();
  }, [open, request.id]);

  const fetchReceitaData = async () => {
    const { data } = await supabase
      .from('pet_prescriptions')
      .select('*')
      .eq('appointment_request_id', request.id)
      .maybeSingle();

    if (data) {
      setMedicamentos(data.medications || '');
      setPosologia(data.dosage || '');
      setDuracao(data.duration || '');
      setObservacoes(data.notes || '');
    } else {
      setMedicamentos('');
      setPosologia('');
      setDuracao('');
      setObservacoes('');
    }
  };

  const handleSave = async () => {
    if (!medicamentos) {
      toast({ title: 'Atenção', description: 'Por favor, informe os medicamentos', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('pet_prescriptions').upsert({
      appointment_request_id: request.id,
      pet_id: request.pet.id,
      user_id: userData.user?.id,
      medications: medicamentos,
      dosage: posologia || null,
      duration: duracao || null,
      notes: observacoes || null,
      prescribed_at: new Date().toISOString(),
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
            tipo_atendimento: 'receita', 
            medicamentos: medicamentos,
            salvo_em: new Date().toISOString() 
          }) 
        })
        .eq('id', request.id);
      toast({ title: 'Receita registrada com sucesso!' });
      onClose();
    }
    setSaving(false);
  };

  const handleExportPdf = () => {
    toast({ title: 'Em desenvolvimento', description: 'Exportação de PDF em breve' });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
              <ArrowLeft size={16} />
            </Button>
            <FileText size={20} className="text-pink-500" />
            Receita Médica
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <TutorInfoSection request={request} date={date} time={time} />
          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medicamentos">Medicamentos *</Label>
              <Textarea
                id="medicamentos"
                value={medicamentos}
                onChange={(e) => setMedicamentos(e.target.value)}
                placeholder="Liste os medicamentos prescritos..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="posologia">Posologia</Label>
              <Textarea
                id="posologia"
                value={posologia}
                onChange={(e) => setPosologia(e.target.value)}
                placeholder="Como deve ser administrado..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao">Duração do Tratamento</Label>
              <Input
                id="duracao"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                placeholder="Ex: 7 dias, 2 semanas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre a prescrição..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
              size="lg"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Salvando...' : 'Salvar Receita'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleExportPdf}
              className="border-pink-500 text-pink-500 hover:bg-pink-50"
            >
              <Download size={18} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
