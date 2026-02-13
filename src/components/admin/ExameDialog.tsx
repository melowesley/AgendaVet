import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, TestTube } from 'lucide-react';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { useToast } from '@/hooks/use-toast';
import { TutorInfoSection } from './detail/TutorInfoSection';
import { Separator } from '@/components/ui/separator';

interface ExameDialogProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  request: AppointmentRequest;
}

export const ExameDialog = ({ open, onClose, onBack, request }: ExameDialogProps) => {
  const { toast } = useToast();
  const date = request.scheduled_date || request.preferred_date;
  const time = request.scheduled_time || request.preferred_time;
  const [tipoExame, setTipoExame] = useState('');
  const [solicitacao, setSolicitacao] = useState('');
  const [resultados, setResultados] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && request.id) fetchExameData();
  }, [open, request.id]);

  const fetchExameData = async () => {
    const { data } = await supabase
      .from('pet_exam_records')
      .select('*')
      .eq('appointment_request_id', request.id)
      .maybeSingle();

    if (data) {
      setTipoExame(data.exam_type || '');
      setSolicitacao(data.request_details || '');
      setResultados(data.results || '');
    } else {
      setTipoExame('');
      setSolicitacao('');
      setResultados('');
    }
  };

  const handleSave = async () => {
    if (!tipoExame) {
      toast({ title: 'Atenção', description: 'Por favor, informe o tipo de exame', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('pet_exam_records').upsert({
      appointment_request_id: request.id,
      pet_id: request.pet.id,
      user_id: userData.user?.id,
      exam_type: tipoExame,
      request_details: solicitacao || null,
      results: resultados || null,
      exam_date: new Date().toISOString(),
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
            tipo_atendimento: 'exame', 
            tipo_exame: tipoExame,
            salvo_em: new Date().toISOString() 
          }) 
        })
        .eq('id', request.id);
      toast({ title: 'Exame registrado com sucesso!' });
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
            <TestTube size={20} className="text-rose-500" />
            Registro de Exame
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <TutorInfoSection request={request} date={date} time={time} />
          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipoExame">Tipo de Exame *</Label>
              <Input
                id="tipoExame"
                value={tipoExame}
                onChange={(e) => setTipoExame(e.target.value)}
                placeholder="Ex: Hemograma, Ultrassom, Raio-X"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solicitacao">Solicitação / Indicação</Label>
              <Textarea
                id="solicitacao"
                value={solicitacao}
                onChange={(e) => setSolicitacao(e.target.value)}
                placeholder="Descreva a solicitação do exame..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resultados">Resultados</Label>
              <Textarea
                id="resultados"
                value={resultados}
                onChange={(e) => setResultados(e.target.value)}
                placeholder="Registre os resultados do exame..."
                rows={4}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white"
            size="lg"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Salvando...' : 'Salvar Exame'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
