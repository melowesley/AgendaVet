import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, FileDown } from 'lucide-react';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { useToast } from '@/hooks/use-toast';
import { TutorInfoSection } from './detail/TutorInfoSection';
import { exportAppointmentPdf } from './exportAppointmentPdf';
import { PetAdminHistorySection } from './PetAdminHistorySection';
import { logPetAdminHistory } from './petAdminHistory';

interface RetornoDialogProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  request: AppointmentRequest;
}

const EVOLUCAO_OPTIONS = [
  'Melhora significativa',
  'Melhora parcial',
  'Estável',
  'Piora parcial',
  'Piora significativa',
];

interface RetornoData {
  motivo_retorno: string;
  evolucao_quadro: string;
  descricao_evolucao: string;
  peso_atual: string;
  temperatura: string;
  fc: string;
  fr: string;
  exame_fisico_resumido: string;
  exames_complementares: string;
  conduta: string;
  proximo_retorno: string;
  observacoes: string;
}

const EMPTY_RETORNO: RetornoData = {
  motivo_retorno: '',
  evolucao_quadro: '',
  descricao_evolucao: '',
  peso_atual: '',
  temperatura: '',
  fc: '',
  fr: '',
  exame_fisico_resumido: '',
  exames_complementares: '',
  conduta: '',
  proximo_retorno: '',
  observacoes: '',
};

export const RetornoDialog = ({ open, onClose, onBack, request }: RetornoDialogProps) => {
  const { toast } = useToast();
  const date = request.scheduled_date || request.preferred_date;
  const time = request.scheduled_time || request.preferred_time;
  const [data, setData] = useState<RetornoData>(EMPTY_RETORNO);
  const [saving, setSaving] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const updateField = <K extends keyof RetornoData>(field: K, value: RetornoData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!data.motivo_retorno.trim()) {
      toast({ title: 'Preencha o motivo do retorno', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('appointment_requests')
      .update({
        status: 'completed',
        admin_notes: JSON.stringify({
          tipo_atendimento: 'retorno',
          ...data,
          salvo_em: new Date().toISOString(),
        }),
      })
      .eq('id', request.id);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      await logPetAdminHistory({
        petId: request.pet.id,
        module: 'retorno',
        action: 'procedure',
        title: 'Retorno registrado',
        details: {
          motivo_retorno: data.motivo_retorno || '—',
          evolucao_quadro: data.evolucao_quadro || '—',
          conduta: data.conduta || '—',
          proximo_retorno: data.proximo_retorno || '—',
        },
        sourceTable: 'appointment_requests',
        sourceId: request.id,
      });
      setHistoryRefresh((prev) => prev + 1);
      toast({ title: 'Retorno salvo com sucesso!' });
    }
    setSaving(false);
  };

  const handleExportPdf = () => {
    exportAppointmentPdf({
      request,
      date,
      time,
      title: 'Retorno',
      sectionTitle: 'Dados do Retorno',
      sectionData: data,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
              <ArrowLeft size={16} />
            </Button>
            Retorno
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 pb-6 space-y-5">
            <TutorInfoSection request={request} date={date} time={time} />
            <Separator />

            <div className="space-y-2">
              <Label className="font-semibold">Motivo do Retorno</Label>
              <Input
                placeholder="Ex: Retorno pós-cirúrgico, acompanhamento dermatológico..."
                value={data.motivo_retorno}
                onChange={(e) => updateField('motivo_retorno', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Evolução do Quadro</Label>
                <Select value={data.evolucao_quadro} onValueChange={(v) => updateField('evolucao_quadro', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVOLUCAO_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Descrição da Evolução</Label>
              <Textarea
                placeholder="Descreva a evolução clínica desde a última consulta..."
                value={data.descricao_evolucao}
                onChange={(e) => updateField('descricao_evolucao', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Parâmetros Vitais</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Peso atual (kg)</Label>
                  <Input value={data.peso_atual} onChange={(e) => updateField('peso_atual', e.target.value)} placeholder="kg" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Temperatura (°C)</Label>
                  <Input value={data.temperatura} onChange={(e) => updateField('temperatura', e.target.value)} placeholder="°C" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">FC (bpm)</Label>
                  <Input value={data.fc} onChange={(e) => updateField('fc', e.target.value)} placeholder="bpm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">FR (mrpm)</Label>
                  <Input value={data.fr} onChange={(e) => updateField('fr', e.target.value)} placeholder="mrpm" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Exame Físico Resumido</Label>
              <Textarea
                placeholder="Achados relevantes no exame físico..."
                value={data.exame_fisico_resumido}
                onChange={(e) => updateField('exame_fisico_resumido', e.target.value)}
                rows={3}
                spellCheck={true}
                lang="pt-BR"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Exames Complementares</Label>
              <Textarea
                placeholder="Resultados de exames solicitados no retorno..."
                value={data.exames_complementares}
                onChange={(e) => updateField('exames_complementares', e.target.value)}
                rows={2}
                spellCheck={true}
                lang="pt-BR"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Conduta</Label>
              <Textarea
                placeholder="Nova prescrição, ajuste de medicação, encaminhamento..."
                value={data.conduta}
                onChange={(e) => updateField('conduta', e.target.value)}
                rows={3}
                spellCheck={true}
                lang="pt-BR"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Próximo Retorno</Label>
              <Input
                placeholder="Ex: 15 dias, 1 mês..."
                value={data.proximo_retorno}
                onChange={(e) => updateField('proximo_retorno', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Observações</Label>
              <Textarea
                placeholder="Observações adicionais..."
                value={data.observacoes}
                onChange={(e) => updateField('observacoes', e.target.value)}
                rows={2}
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button onClick={handleSave} disabled={saving} className="flex-1 gradient-primary text-primary-foreground" size="lg">
                <Save size={18} className="mr-2" />
                {saving ? 'Salvando...' : 'Salvar Retorno'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={handleExportPdf}
              >
                <FileDown size={18} className="mr-2" />
                Exportar PDF
              </Button>
            </div>

            <PetAdminHistorySection
              petId={request.pet.id}
              module="retorno"
              title="Histórico Detalhado de Retorno"
              refreshKey={historyRefresh}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
