import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, FileDown } from 'lucide-react';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { useToast } from '@/hooks/use-toast';
import { TutorInfoSection } from './detail/TutorInfoSection';
import { exportAppointmentPdf } from './exportAppointmentPdf';

interface AvaliacaoCirurgicaDialogProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  request: AppointmentRequest;
}

const EXAMES_PRE_OP = [
  'Hemograma completo',
  'Bioquímica sérica (ALT, FA, Ureia, Creatinina)',
  'Coagulograma',
  'Eletrocardiograma',
  'Ecocardiograma',
  'Radiografia torácica',
  'Ultrassonografia abdominal',
];

const RISCO_ASA = [
  { value: 'I', label: 'ASA I – Paciente saudável' },
  { value: 'II', label: 'ASA II – Doença sistêmica leve' },
  { value: 'III', label: 'ASA III – Doença sistêmica grave' },
  { value: 'IV', label: 'ASA IV – Doença sistêmica grave, risco de vida' },
  { value: 'V', label: 'ASA V – Paciente moribundo' },
];

interface AvaliacaoData {
  procedimento_proposto: string;
  risco_asa: string;
  exames_pre_operatorios: string[];
  jejum_confirmado: boolean;
  peso_atual: string;
  temperatura: string;
  fc: string;
  fr: string;
  observacoes: string;
}

const EMPTY_AVALIACAO: AvaliacaoData = {
  procedimento_proposto: '',
  risco_asa: '',
  exames_pre_operatorios: [],
  jejum_confirmado: false,
  peso_atual: '',
  temperatura: '',
  fc: '',
  fr: '',
  observacoes: '',
};

export const AvaliacaoCirurgicaDialog = ({ open, onClose, onBack, request }: AvaliacaoCirurgicaDialogProps) => {
  const { toast } = useToast();
  const date = request.scheduled_date || request.preferred_date;
  const time = request.scheduled_time || request.preferred_time;
  const [data, setData] = useState<AvaliacaoData>(EMPTY_AVALIACAO);
  const [saving, setSaving] = useState(false);

  const updateField = <K extends keyof AvaliacaoData>(field: K, value: AvaliacaoData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleExame = (exame: string) => {
    setData(prev => ({
      ...prev,
      exames_pre_operatorios: prev.exames_pre_operatorios.includes(exame)
        ? prev.exames_pre_operatorios.filter(e => e !== exame)
        : [...prev.exames_pre_operatorios, exame],
    }));
  };

  const handleSave = async () => {
    if (!data.procedimento_proposto.trim()) {
      toast({ title: 'Preencha o procedimento proposto', variant: 'destructive' });
      return;
    }
    setSaving(true);
    // For now, save as a note on the appointment request
    const { error } = await supabase
      .from('appointment_requests')
      .update({
        status: 'completed',
        admin_notes: JSON.stringify({
          tipo_atendimento: 'avaliacao_cirurgica',
          ...data,
          salvo_em: new Date().toISOString(),
        }),
      })
      .eq('id', request.id);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Avaliação cirúrgica salva com sucesso!' });
    }
    setSaving(false);
  };

  const handleExportPdf = () => {
    exportAppointmentPdf({
      request,
      date,
      time,
      title: 'Avaliação Cirúrgica',
      sectionTitle: 'Dados da Avaliação Cirúrgica',
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
            Avaliação Cirúrgica
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 pb-6 space-y-5">
            <TutorInfoSection request={request} date={date} time={time} />
            <Separator />

            {/* Procedimento */}
            <div className="space-y-2">
              <Label className="font-semibold">Procedimento Proposto</Label>
              <Input
                placeholder="Ex: Ovariohisterectomia eletiva"
                value={data.procedimento_proposto}
                onChange={(e) => updateField('procedimento_proposto', e.target.value)}
              />
            </div>

            {/* Risco ASA */}
            <div className="space-y-2">
              <Label className="font-semibold">Classificação de Risco (ASA)</Label>
              <Select value={data.risco_asa} onValueChange={(v) => updateField('risco_asa', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o risco" />
                </SelectTrigger>
                <SelectContent>
                  {RISCO_ASA.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parâmetros vitais */}
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

            {/* Exames pré-op */}
            <div className="space-y-2">
              <Label className="font-semibold">Exames Pré-operatórios Solicitados</Label>
              <div className="grid grid-cols-1 gap-2">
                {EXAMES_PRE_OP.map((exame) => (
                  <label key={exame} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={data.exames_pre_operatorios.includes(exame)}
                      onCheckedChange={() => toggleExame(exame)}
                    />
                    {exame}
                  </label>
                ))}
              </div>
            </div>

            {/* Jejum */}
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <Checkbox
                checked={data.jejum_confirmado}
                onCheckedChange={(v) => updateField('jejum_confirmado', !!v)}
              />
              Jejum confirmado pelo tutor
            </label>

            {/* Observações */}
            <div className="space-y-2">
              <Label className="font-semibold">Observações</Label>
              <Textarea
                placeholder="Observações adicionais sobre a avaliação..."
                value={data.observacoes}
                onChange={(e) => updateField('observacoes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button onClick={handleSave} disabled={saving} className="flex-1 gradient-primary text-primary-foreground" size="lg">
                <Save size={18} className="mr-2" />
                {saving ? 'Salvando...' : 'Salvar Avaliação Cirúrgica'}
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
