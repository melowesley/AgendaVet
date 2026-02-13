import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { useToast } from '@/hooks/use-toast';
import { TutorInfoSection } from './detail/TutorInfoSection';
import { Separator } from '@/components/ui/separator';

interface DocumentoDialogProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  request: AppointmentRequest;
}

export const DocumentoDialog = ({ open, onClose, onBack, request }: DocumentoDialogProps) => {
  const { toast } = useToast();
  const date = request.scheduled_date || request.preferred_date;
  const time = request.scheduled_time || request.preferred_time;
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && request.id) fetchDocumentoData();
  }, [open, request.id]);

  const fetchDocumentoData = async () => {
    const { data } = await supabase
      .from('pet_documents')
      .select('*')
      .eq('appointment_request_id', request.id)
      .maybeSingle();

    if (data) {
      setTipoDocumento(data.document_type || '');
      setTitulo(data.title || '');
      setConteudo(data.content || '');
    } else {
      setTipoDocumento('');
      setTitulo('');
      setConteudo('');
    }
  };

  const handleSave = async () => {
    if (!tipoDocumento || !titulo) {
      toast({ title: 'Atenção', description: 'Por favor, preencha tipo e título', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('pet_documents').upsert({
      appointment_request_id: request.id,
      pet_id: request.pet.id,
      user_id: userData.user?.id,
      document_type: tipoDocumento,
      title: titulo,
      content: conteudo || null,
      created_at: new Date().toISOString(),
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
            tipo_atendimento: 'documento', 
            tipo_documento: tipoDocumento,
            titulo: titulo,
            salvo_em: new Date().toISOString() 
          }) 
        })
        .eq('id', request.id);
      toast({ title: 'Documento registrado com sucesso!' });
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
            <FileText size={20} className="text-emerald-500" />
            Registro de Documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <TutorInfoSection request={request} date={date} time={time} />
          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
              <Input
                id="tipoDocumento"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                placeholder="Ex: Atestado, Laudo, Declaração"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Atestado de Saúde"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conteudo">Conteúdo</Label>
              <Textarea
                id="conteudo"
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder="Digite o conteúdo do documento..."
                rows={6}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            size="lg"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Salvando...' : 'Salvar Documento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
