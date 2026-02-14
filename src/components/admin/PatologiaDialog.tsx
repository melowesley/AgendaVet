import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, PageDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FlaskConical, Save, Trash2, Edit2, ArrowLeft, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { exportPetRecordPdf } from './exportPetRecordPdf';
import { logPetAdminHistory } from './petAdminHistory';
import { PetAdminHistorySection } from './PetAdminHistorySection';
import { generatePatologiaSummary } from '@/utils/procedureSummaries';

interface PatologiaDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
  petId: string;
  petName: string;
}

interface Pathology {
  id: string;
  name: string;
  diagnosis_date: string;
  status: string;
  description: string | null;
  treatment: string | null;
  notes: string | null;
}

export const PatologiaDialog = ({ open, onClose, onBack, onSuccess, petId, petName }: PatologiaDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Pathology[]>([]);
  const [name, setName] = useState('');
  const [diagnosisDate, setDiagnosisDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('active');
  const [description, setDescription] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
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
      toast({ title: 'Erro', description: 'Nome e data são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    if (editingId) {
      // Editar registro existente
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
        const historyDetails = generatePatologiaSummary(name, diagnosisDate, status, description, treatment);
        await logPetAdminHistory({
          petId,
          module: 'patologia',
          action: 'update',
          title: 'Ficha de Patologia',
          details: historyDetails,
          sourceTable: 'pet_pathologies',
          sourceId: editingId,
        });
        setHistoryRefresh((prev) => prev + 1);
        onSuccess?.();
        toast({ title: 'Sucesso', description: 'Patologia atualizada com sucesso!' });
        resetForm();
        loadRecords();
      }
    } else {
      // Criar novo registro
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !userData.user?.id) {
        toast({ title: 'Erro', description: 'Não foi possível obter dados do usuário. Faça login novamente.', variant: 'destructive' });
        setLoading(false);
        return;
      }

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
        setLoading(false);
      } else {
        const historyDetails = generatePatologiaSummary(name, diagnosisDate, status, description, treatment);
        await logPetAdminHistory({
          petId,
          module: 'patologia',
          action: 'create',
          title: 'Ficha de Patologia',
          details: historyDetails,
          sourceTable: 'pet_pathologies',
        });
        setHistoryRefresh((prev) => prev + 1);
        onSuccess?.();
        toast({ title: 'Sucesso', description: 'Patologia registrada com sucesso!' });
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
    setStatus('active');
    setDiagnosisDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingId(null);
  };

  const handleEdit = (record: Pathology) => {
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
        module: 'patologia',
        action: 'delete',
        title: 'Patologia excluída',
        details: { registro_id: id },
        sourceTable: 'pet_pathologies',
        sourceId: id,
      });
      setHistoryRefresh((prev) => prev + 1);
      onSuccess?.();
      toast({ title: 'Sucesso', description: 'Registro excluído' });
      loadRecords();
    }
  };

  const handleExportPdf = () => {
    exportPetRecordPdf({
      title: 'Patologias',
      petName,
      sectionTitle: 'Dados de Patologias',
      sectionData: {
        registro_atual: {
          nome: name || '—',
          data_diagnostico: diagnosisDate || '—',
          status: status || '—',
          descricao: description || '—',
          tratamento: treatment || '—',
          observacoes: notes || '—',
        },
        historico: records.map((record) => ({
          nome: record.name,
          data_diagnostico: record.diagnosis_date,
          status: record.status,
          descricao: record.description || '—',
          tratamento: record.treatment || '—',
          observacoes: record.notes || '—',
        })),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <PageDialogContent className="p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack || onClose}>
              <ArrowLeft size={16} />
            </Button>
            <FlaskConical className="h-5 w-5" />
            Patologias - {petName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
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
                <Label htmlFor="name">Nome da Patologia *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Diabetes, Dermatite..."
                  spellCheck={true}
                  lang="pt-BR"
                />
              </div>
              <div>
                <Label htmlFor="diagnosis_date">Data do Diagnóstico *</Label>
                <Input
                  id="diagnosis_date"
                  type="date"
                  value={diagnosisDate}
                  onChange={(e) => setDiagnosisDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="controlled">Controlado</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da patologia..."
                rows={2}
                spellCheck={true}
                lang="pt-BR"
              />
            </div>
            <div>
              <Label htmlFor="treatment">Tratamento</Label>
              <Textarea
                id="treatment"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                placeholder="Tratamento prescrito..."
                rows={2}
                spellCheck={true}
                lang="pt-BR"
              />
            </div>
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={2}
                spellCheck={true}
                lang="pt-BR"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Informações'}
              </Button>
              <Button variant="outline" onClick={handleExportPdf}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          {/* Histórico */}
          <div>
            <h3 className="font-semibold mb-3">Histórico de Patologias</h3>
            <div className="space-y-3">
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro ainda</p>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="p-4 bg-card border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{record.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Diagnóstico: {format(new Date(record.diagnosis_date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={record.status === 'active' ? 'destructive' : record.status === 'controlled' ? 'default' : 'secondary'}>
                          {record.status === 'active' ? 'Ativo' : record.status === 'controlled' ? 'Controlado' : 'Resolvido'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(record)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {record.description && (
                      <p className="text-sm mt-2"><strong>Descrição:</strong> {record.description}</p>
                    )}
                    {record.treatment && (
                      <p className="text-sm mt-1"><strong>Tratamento:</strong> {record.treatment}</p>
                    )}
                    {record.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{record.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <PetAdminHistorySection
            petId={petId}
            module="patologia"
            title="Histórico Detalhado de Patologias"
            refreshKey={historyRefresh}
          />
        </div>
      </PageDialogContent>
    </Dialog>
  );
};
