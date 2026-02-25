import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, PageDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bug, Save, Trash2, Edit2, ArrowLeft, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { exportPetRecordPdf } from './exportPetRecordPdf';
import { logPetAdminHistory } from './petAdminHistory';
import { PetAdminHistorySection } from './PetAdminHistorySection';

interface DiagnosticoDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
  petId: string;
  petName: string;
}

interface DiagnosticoRecord {
  id: string;
  name: string;
  diagnosis_date: string;
  status: string;
  description: string | null;
  treatment: string | null;
  notes: string | null;
}

export const DiagnosticoDialog = ({ open, onClose, onBack, onSuccess, petId, petName }: DiagnosticoDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<DiagnosticoRecord[]>([]);
  const [name, setName] = useState('');
  const [diagnosisDate, setDiagnosisDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('suspeita');
  const [description, setDescription] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    if (open) loadRecords();
  }, [open, petId]);

  const loadRecords = async () => {
    const { data } = await supabase
      .from('pet_pathologies')
      .select('*')
      .eq('pet_id', petId)
      .order('diagnosis_date', { ascending: false });
    if (data) setRecords(data);
  };

  const handleSave = async () => {
    if (!name || !diagnosisDate) {
      toast({ title: 'Erro', description: 'Diagnóstico e data são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user?.id) {
      toast({ title: 'Erro', description: 'Não foi possível obter dados do usuário.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from('pet_pathologies')
        .update({
          name,
          diagnosis_date: diagnosisDate,
          status,
          description: description || null,
          treatment: treatment || null,
          notes: notes || null,
        })
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        await logPetAdminHistory({
          petId,
          module: 'diagnostico',
          action: 'update',
          title: 'Ficha de Diagnóstico',
          details: {
            diagnostico: name,
            data: diagnosisDate,
            status,
            descricao: description || '—',
            tratamento: treatment || '—',
            veterinario: veterinarian || '—',
          },
          sourceTable: 'pet_pathologies',
          sourceId: editingId,
        });
        setHistoryRefresh(prev => prev + 1);
        onSuccess?.();
        toast({ title: 'Sucesso', description: 'Diagnóstico atualizado!' });
        resetForm();
        loadRecords();
      }
    } else {
      const { error } = await supabase.from('pet_pathologies').insert({
        pet_id: petId,
        user_id: userData.user.id,
        name,
        diagnosis_date: diagnosisDate,
        status,
        description: description || null,
        treatment: treatment || null,
        notes: notes || null,
      });

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        await logPetAdminHistory({
          petId,
          module: 'diagnostico',
          action: 'create',
          title: 'Ficha de Diagnóstico',
          details: {
            diagnostico: name,
            data: diagnosisDate,
            status,
            descricao: description || '—',
            tratamento: treatment || '—',
            veterinario: veterinarian || '—',
          },
          sourceTable: 'pet_pathologies',
        });
        setHistoryRefresh(prev => prev + 1);
        onSuccess?.();
        toast({ title: 'Sucesso', description: 'Diagnóstico registrado!' });
        resetForm();
        loadRecords();
      }
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTreatment('');
    setNotes('');
    setVeterinarian('');
    setStatus('suspeita');
    setDiagnosisDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingId(null);
  };

  const handleEdit = (record: DiagnosticoRecord) => {
    setName(record.name);
    setDiagnosisDate(record.diagnosis_date);
    setStatus(record.status);
    setDescription(record.description || '');
    setTreatment(record.treatment || '');
    setNotes(record.notes || '');
    setEditingId(record.id);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_pathologies').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logPetAdminHistory({
        petId,
        module: 'diagnostico',
        action: 'delete',
        title: 'Diagnóstico excluído',
        details: { registro_id: id },
        sourceTable: 'pet_pathologies',
        sourceId: id,
      });
      setHistoryRefresh(prev => prev + 1);
      onSuccess?.();
      toast({ title: 'Sucesso', description: 'Registro excluído' });
      loadRecords();
    }
  };

  const handleExportPdf = () => {
    exportPetRecordPdf({
      title: 'Diagnósticos',
      petName,
      sectionTitle: 'Dados de Diagnósticos',
      sectionData: {
        registro_atual: {
          diagnostico: name || '—',
          data: diagnosisDate || '—',
          status: status || '—',
          descricao: description || '—',
          tratamento: treatment || '—',
        },
        historico: records.map(r => ({
          diagnostico: r.name,
          data: r.diagnosis_date,
          status: r.status,
          descricao: r.description || '—',
          tratamento: r.treatment || '—',
        })),
      },
    });
  };

  const statusLabels: Record<string, string> = {
    suspeita: 'Suspeita',
    confirmado: 'Confirmado',
    descartado: 'Descartado',
    active: 'Ativo',
    controlled: 'Controlado',
    resolved: 'Resolvido',
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <PageDialogContent className="p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack || onClose}>
              <ArrowLeft size={16} />
            </Button>
            <Bug className="h-5 w-5" />
            Diagnóstico - {petName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            {editingId && (
              <div className="flex items-center gap-2 text-sm text-primary mb-2">
                <Edit2 className="h-4 w-4" />
                <span>Editando registro</span>
                <Button variant="ghost" size="sm" onClick={resetForm}>Cancelar</Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="diag-name">Diagnóstico *</Label>
                <Input id="diag-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Gastrite, Otite..." spellCheck lang="pt-BR" />
              </div>
              <div>
                <Label htmlFor="diag-date">Data *</Label>
                <Input id="diag-date" type="date" value={diagnosisDate} onChange={e => setDiagnosisDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="diag-status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suspeita">Suspeita</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                    <SelectItem value="active">Em tratamento</SelectItem>
                    <SelectItem value="controlled">Controlado</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="diag-vet">Veterinário Responsável</Label>
                <Input id="diag-vet" value={veterinarian} onChange={e => setVeterinarian(e.target.value)} placeholder="Nome do veterinário" spellCheck lang="pt-BR" />
              </div>
            </div>
            <div>
              <Label htmlFor="diag-desc">Descrição</Label>
              <Textarea id="diag-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes do diagnóstico..." rows={2} spellCheck lang="pt-BR" />
            </div>
            <div>
              <Label htmlFor="diag-treat">Tratamento Prescrito</Label>
              <Textarea id="diag-treat" value={treatment} onChange={e => setTreatment(e.target.value)} placeholder="Tratamento prescrito..." rows={2} spellCheck lang="pt-BR" />
            </div>
            <div>
              <Label htmlFor="diag-notes">Observações</Label>
              <Textarea id="diag-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações adicionais..." rows={2} spellCheck lang="pt-BR" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Diagnóstico'}
              </Button>
              <Button variant="outline" onClick={handleExportPdf}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Histórico de Diagnósticos</h3>
            <div className="space-y-3">
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum diagnóstico registrado</p>
              ) : (
                records.map(record => (
                  <div key={record.id} className="p-4 bg-card border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{record.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.diagnosis_date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={record.status === 'confirmado' || record.status === 'active' ? 'destructive' : record.status === 'controlled' ? 'default' : 'secondary'}>
                          {statusLabels[record.status] || record.status}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {record.description && <p className="text-sm mt-2"><strong>Descrição:</strong> {record.description}</p>}
                    {record.treatment && <p className="text-sm mt-1"><strong>Tratamento:</strong> {record.treatment}</p>}
                    {record.notes && <p className="text-sm text-muted-foreground mt-1">{record.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          <PetAdminHistorySection petId={petId} module="diagnostico" title="Histórico Detalhado" refreshKey={historyRefresh} />
        </div>
      </PageDialogContent>
    </Dialog>
  );
};
