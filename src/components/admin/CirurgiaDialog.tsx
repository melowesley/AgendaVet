import { useState } from 'react';
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
import { PetAdminHistorySection } from './PetAdminHistorySection';
import { logPetAdminHistory } from './petAdminHistory';

interface CirurgiaDialogProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  request: AppointmentRequest;
}

const TIPOS_ANESTESIA = [
  'Anestesia geral inalatória',
  'Anestesia geral intravenosa (TIVA)',
  'Anestesia dissociativa',
  'Bloqueio regional / epidural',
  'Sedação + anestesia local',
];

const MATERIAIS_SUTURA = [
  'Nylon', 'Poliglactina 910 (Vicryl)', 'Polidioxanona (PDS)',
  'Categute cromado', 'Polipropileno (Prolene)', 'Ácido poliglicólico (Dexon)',
];

interface CirurgiaData {
  procedimento_realizado: string;
  tecnica_cirurgica: string;
  tipo_anestesia: string;
  protocolo_anestesico: string;
  duracao_minutos: string;
  materiais_sutura: string[];
  intercorrencias: string;
  pos_operatorio_imediato: string;
  prescricao_pos_op: string;
  retorno_previsto: string;
}

const EMPTY_CIRURGIA: CirurgiaData = {
  procedimento_realizado: '',
  tecnica_cirurgica: '',
  tipo_anestesia: '',
  protocolo_anestesico: '',
  duracao_minutos: '',
  materiais_sutura: [],
  intercorrencias: '',
  pos_operatorio_imediato: '',
  prescricao_pos_op: '',
  retorno_previsto: '',
};

export const CirurgiaDialog = ({ open, onClose, onBack, request }: CirurgiaDialogProps) => {
  const { toast } = useToast();
  const date = request.scheduled_date || request.preferred_date;
  const time = request.scheduled_time || request.preferred_time;
  const [data, setData] = useState<CirurgiaData>(EMPTY_CIRURGIA);
  const [saving, setSaving] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const updateField = <K extends keyof CirurgiaData>(field: K, value: CirurgiaData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMaterial = (mat: string) => {
    setData(prev => ({
      ...prev,
      materiais_sutura: prev.materiais_sutura.includes(mat)
        ? prev.materiais_sutura.filter(m => m !== mat)
        : [...prev.materiais_sutura, mat],
    }));
  };

  const handleSave = async () => {
    if (!data.procedimento_realizado.trim()) {
      toast({ title: 'Preencha o procedimento realizado', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('appointment_requests')
      .update({
        status: 'completed',
        admin_notes: JSON.stringify({
          tipo_atendimento: 'cirurgia',
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
        module: 'cirurgia',
        action: 'procedure',
        title: 'Procedimento cirúrgico registrado',
        details: {
          procedimento_realizado: data.procedimento_realizado || '—',
          tipo_anestesia: data.tipo_anestesia || '—',
          duracao_minutos: data.duracao_minutos || '—',
          intercorrencias: data.intercorrencias || '—',
          retorno_previsto: data.retorno_previsto || '—',
        },
        sourceTable: 'appointment_requests',
        sourceId: request.id,
      });
      setHistoryRefresh((prev) => prev + 1);
      toast({ title: 'Registro cirúrgico salvo com sucesso!' });
    }
    setSaving(false);
  };

  const handleExportPdf = () => {
    exportAppointmentPdf({
      request,
      date,
      time,
      title: 'Registro Cirúrgico',
      sectionTitle: 'Dados do Procedimento Cirúrgico',
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
            Registro Cirúrgico
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 pb-6 space-y-5">
            <TutorInfoSection request={request} date={date} time={time} />
            <Separator />

            <div className="space-y-2">
              <Label className="font-semibold">Procedimento Realizado</Label>
              <Input
                placeholder="Ex: Ovariohisterectomia"
                value={data.procedimento_realizado}
                onChange={(e) => updateField('procedimento_realizado', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Técnica Cirúrgica</Label>
              <Textarea
                placeholder="Descreva a técnica utilizada..."
                value={data.tecnica_cirurgica}
                onChange={(e) => updateField('tecnica_cirurgica', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Tipo de Anestesia</Label>
                <Select value={data.tipo_anestesia} onValueChange={(v) => updateField('tipo_anestesia', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ANESTESIA.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Duração (min)</Label>
                <Input
                  type="number"
                  placeholder="minutos"
                  value={data.duracao_minutos}
                  onChange={(e) => updateField('duracao_minutos', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Protocolo Anestésico</Label>
              <Textarea
                placeholder="MPA, indução, manutenção, fármacos e doses..."
                value={data.protocolo_anestesico}
                onChange={(e) => updateField('protocolo_anestesico', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Materiais de Sutura Utilizados</Label>
              <div className="grid grid-cols-2 gap-2">
                {MATERIAIS_SUTURA.map((mat) => (
                  <label key={mat} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={data.materiais_sutura.includes(mat)}
                      onCheckedChange={() => toggleMaterial(mat)}
                    />
                    {mat}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Intercorrências</Label>
              <Textarea
                placeholder="Descreva intercorrências durante o procedimento (se houver)..."
                value={data.intercorrencias}
                onChange={(e) => updateField('intercorrencias', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Pós-operatório Imediato</Label>
              <Textarea
                placeholder="Estado do paciente na recuperação anestésica..."
                value={data.pos_operatorio_imediato}
                onChange={(e) => updateField('pos_operatorio_imediato', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Prescrição Pós-operatória</Label>
              <Textarea
                placeholder="Medicamentos, curativos, restrições..."
                value={data.prescricao_pos_op}
                onChange={(e) => updateField('prescricao_pos_op', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Retorno Previsto</Label>
              <Input
                placeholder="Ex: 10 dias para retirada de pontos"
                value={data.retorno_previsto}
                onChange={(e) => updateField('retorno_previsto', e.target.value)}
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button onClick={handleSave} disabled={saving} className="flex-1 gradient-primary text-primary-foreground" size="lg">
                <Save size={18} className="mr-2" />
                {saving ? 'Salvando...' : 'Salvar Registro Cirúrgico'}
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
              module="cirurgia"
              title="Histórico Detalhado da Cirurgia"
              refreshKey={historyRefresh}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
