import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export type PetRecordType =
  | 'peso'
  | 'documento'
  | 'vacina'
  | 'exame'
  | 'receita'
  | 'observacao'
  | 'patologia'
  | 'fotos'
  | 'video'
  | 'internacao';

interface AddPetRecordDialogProps {
  open: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
  recordType: PetRecordType;
  onSaved?: () => void;
}

const RECORD_LABELS: Record<PetRecordType, string> = {
  peso: 'Registrar Peso',
  documento: 'Adicionar Documento',
  vacina: 'Registrar Vacina',
  exame: 'Registrar Exame',
  receita: 'Adicionar Receita',
  observacao: 'Adicionar Observação',
  patologia: 'Registrar Patologia',
  fotos: 'Adicionar Foto',
  video: 'Adicionar Vídeo',
  internacao: 'Registrar Internação',
};

export const AddPetRecordDialog = ({
  open,
  onClose,
  petId,
  petName,
  recordType,
  onSaved,
}: AddPetRecordDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Form state - generic key-value for each type
  const [form, setForm] = useState<Record<string, string>>(() => getInitialForm(recordType, today));

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const getPayload = (): { title: string | null; data: Record<string, unknown> } => {
    switch (recordType) {
      case 'peso':
        return {
          title: `Peso ${form.data || today} - ${form.value || ''} kg`,
          data: { value: form.value, unit: 'kg', date: form.data || today, notes: form.notes || null },
        };
      case 'documento':
        return {
          title: form.title || 'Documento',
          data: { url: form.url || null, description: form.notes || null },
        };
      case 'vacina':
        return {
          title: form.name || 'Vacina',
          data: { name: form.name, date: form.data || today, next_date: form.next_date || null, notes: form.notes || null },
        };
      case 'exame':
        return {
          title: form.name || 'Exame',
          data: { name: form.name, date: form.data || today, result: form.result || null, url: form.url || null, notes: form.notes || null },
        };
      case 'receita':
        return {
          title: `Receita ${form.data || today}`,
          data: { prescription: form.prescription, date: form.data || today },
        };
      case 'observacao':
        return {
          title: form.title || `Observação ${form.data || today}`,
          data: { text: form.text, date: form.data || today },
        };
      case 'patologia':
        return {
          title: form.name || 'Patologia',
          data: { name: form.name, description: form.notes || null, date: form.data || today },
        };
      case 'fotos':
        return {
          title: form.caption || 'Foto',
          data: { url: form.url, caption: form.caption || null },
        };
      case 'video':
        return {
          title: form.title || 'Vídeo',
          data: { url: form.url, title: form.title || null },
        };
      case 'internacao':
        return {
          title: `Internação ${form.admission_date || ''}`,
          data: {
            admission_date: form.admission_date || today,
            discharge_date: form.discharge_date || null,
            reason: form.reason || null,
            notes: form.notes || null,
          },
        };
      default:
        return { title: null, data: {} };
    }
  };

  const handleSave = async () => {
    const { title, data } = getPayload();
    if (recordType === 'peso' && !form.value?.trim()) {
      toast({ title: 'Informe o peso', variant: 'destructive' });
      return;
    }
    if (recordType === 'vacina' && !form.name?.trim()) {
      toast({ title: 'Informe o nome da vacina', variant: 'destructive' });
      return;
    }
    if (recordType === 'exame' && !form.name?.trim()) {
      toast({ title: 'Informe o nome do exame', variant: 'destructive' });
      return;
    }
    if (recordType === 'receita' && !form.prescription?.trim()) {
      toast({ title: 'Informe a receita', variant: 'destructive' });
      return;
    }
    if (recordType === 'observacao' && !form.text?.trim()) {
      toast({ title: 'Informe a observação', variant: 'destructive' });
      return;
    }
    if (recordType === 'patologia' && !form.name?.trim()) {
      toast({ title: 'Informe a patologia', variant: 'destructive' });
      return;
    }
    if (recordType === 'fotos' && !form.url?.trim()) {
      toast({ title: 'Informe a URL da foto', variant: 'destructive' });
      return;
    }
    if (recordType === 'video' && !form.url?.trim()) {
      toast({ title: 'Informe a URL do vídeo', variant: 'destructive' });
      return;
    }
    if (recordType === 'documento' && !form.title?.trim()) {
      toast({ title: 'Informe o título do documento', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('pet_records').insert({
      pet_id: petId,
      record_type: recordType,
      title,
      data,
      created_by: userData.user?.id ?? null,
    });

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Registro salvo com sucesso!' });
      onSaved?.();
      onClose();
      setForm(getInitialForm(recordType, today));
    }
    setSaving(false);
  };

  const renderForm = () => {
    switch (recordType) {
      case 'peso':
        return (
          <>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={(e) => update('data', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input type="text" placeholder="Ex: 12,5" value={form.value} onChange={(e) => update('value', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Opcional" value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
            </div>
          </>
        );
      case 'documento':
        return (
          <>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input placeholder="Nome do documento" value={form.title} onChange={(e) => update('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>URL ou link</Label>
              <Input placeholder="https://..." value={form.url} onChange={(e) => update('url', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
            </div>
          </>
        );
      case 'vacina':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome da vacina</Label>
              <Input placeholder="Ex: V10, Antirrábica" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data da aplicação</Label>
              <Input type="date" value={form.data} onChange={(e) => update('data', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Próxima dose (opcional)</Label>
              <Input type="date" value={form.next_date} onChange={(e) => update('next_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
            </div>
          </>
        );
      case 'exame':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome do exame</Label>
              <Input placeholder="Ex: Hemograma, Creatinina" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={(e) => update('data', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Resultado ou descrição</Label>
              <Textarea value={form.result} onChange={(e) => update('result', e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>URL do laudo (opcional)</Label>
              <Input placeholder="https://..." value={form.url} onChange={(e) => update('url', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
            </div>
          </>
        );
      case 'receita':
        return (
          <>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={(e) => update('data', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Receita / Prescrição</Label>
              <Textarea placeholder="Medicamentos e orientações" value={form.prescription} onChange={(e) => update('prescription', e.target.value)} rows={4} />
            </div>
          </>
        );
      case 'observacao':
        return (
          <>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={(e) => update('data', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <Input placeholder="Resumo" value={form.title} onChange={(e) => update('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea placeholder="Texto da observação" value={form.text} onChange={(e) => update('text', e.target.value)} rows={4} />
            </div>
          </>
        );
      case 'patologia':
        return (
          <>
            <div className="space-y-2">
              <Label>Patologia / Diagnóstico</Label>
              <Input placeholder="Ex: Dermatite alérgica" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={(e) => update('data', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição / Observações</Label>
              <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} />
            </div>
          </>
        );
      case 'fotos':
        return (
          <>
            <div className="space-y-2">
              <Label>URL da imagem</Label>
              <Input placeholder="https://..." value={form.url} onChange={(e) => update('url', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Legenda (opcional)</Label>
              <Input placeholder="Descrição da foto" value={form.caption} onChange={(e) => update('caption', e.target.value)} />
            </div>
          </>
        );
      case 'video':
        return (
          <>
            <div className="space-y-2">
              <Label>URL do vídeo</Label>
              <Input placeholder="https://..." value={form.url} onChange={(e) => update('url', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <Input placeholder="Descrição do vídeo" value={form.title} onChange={(e) => update('title', e.target.value)} />
            </div>
          </>
        );
      case 'internacao':
        return (
          <>
            <div className="space-y-2">
              <Label>Data de internação</Label>
              <Input type="date" value={form.admission_date} onChange={(e) => update('admission_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data de alta (opcional)</Label>
              <Input type="date" value={form.discharge_date} onChange={(e) => update('discharge_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input placeholder="Motivo da internação" value={form.reason} onChange={(e) => update('reason', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{RECORD_LABELS[recordType]} — {petName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {renderForm()}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function getInitialForm(recordType: PetRecordType, today: string): Record<string, string> {
  const base: Record<string, string> = { data: today };
  switch (recordType) {
    case 'peso':
      return { ...base, value: '', notes: '' };
    case 'documento':
      return { title: '', url: '', notes: '' };
    case 'vacina':
      return { ...base, name: '', next_date: '', notes: '' };
    case 'exame':
      return { ...base, name: '', result: '', url: '', notes: '' };
    case 'receita':
      return { ...base, prescription: '' };
    case 'observacao':
      return { ...base, title: '', text: '' };
    case 'patologia':
      return { ...base, name: '', notes: '' };
    case 'fotos':
      return { url: '', caption: '' };
    case 'video':
      return { url: '', title: '' };
    case 'internacao':
      return { admission_date: today, discharge_date: '', reason: '', notes: '' };
    default:
      return base;
  }
}
