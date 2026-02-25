import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logSupabaseError } from '@/lib/supabaseLogger';
import { Dialog, PageDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FlaskConical, Save, Trash2, Download, Edit2, ArrowLeft, FileDown, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { exportPetRecordPdf } from './exportPetRecordPdf';
import { logPetAdminHistory } from './petAdminHistory';
import { PetAdminHistorySection } from './PetAdminHistorySection';
import { generateExameSummary } from '@/utils/procedureSummaries';

interface ExameDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
  petId: string;
  petName: string;
}

interface Exam {
  id: string;
  exam_type: string;
  exam_date: string;
  results: string | null;
  veterinarian: string | null;
  file_url: string | null;
  notes: string | null;
}

export const ExameDialog = ({ open, onClose, onBack, onSuccess, petId, petName }: ExameDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Exam[]>([]);
  const [examType, setExamType] = useState('');
  const [examDate, setExamDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [results, setResults] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  useEffect(() => {
    if (open) loadRecords();
  }, [open, petId]);

  const loadRecords = async () => {
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const { data, error } = await supabase
        .from('pet_exams')
        .select('*')
        .eq('pet_id', petId)
        .order('exam_date', { ascending: false });

      if (error) {
        logSupabaseError('ExameDialog loadRecords', error, { petId });
        setRecordsError(error.message);
        toast({
          title: 'Erro ao carregar exames',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      setRecords(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado ao carregar exames';
      setRecordsError(msg);
      toast({
        title: 'Erro ao carregar exames',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!examType || !examDate) {
      toast({ title: 'Erro', description: 'Tipo de exame e data são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    if (editingId) {
      // Editar registro existente
      const { error } = await supabase
        .from('pet_exams')
        .update({
          exam_type: examType,
          exam_date: examDate,
          results: results || null,
          veterinarian: veterinarian || null,
          file_url: fileUrl || null,
          notes: notes || null,
        })
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        const historyDetails = generateExameSummary(examType, examDate, results, veterinarian);
        await logPetAdminHistory({
          petId,
          module: 'exame',
          action: 'update',
          title: 'Ficha de Exame',
          details: historyDetails,
          sourceTable: 'pet_exams',
          sourceId: editingId,
        });
        setHistoryRefresh((prev) => prev + 1);
        onSuccess?.();
        toast({ title: 'Sucesso', description: 'Exame atualizado com sucesso!' });
        resetForm();
        loadRecords();
      }
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('pet_exams').insert({
        pet_id: petId,
        user_id: userData.user?.id,
        exam_type: examType,
        exam_date: examDate,
        results: results || null,
        veterinarian: veterinarian || null,
        file_url: fileUrl || null,
        notes: notes || null,
      });

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        const historyDetails = generateExameSummary(examType, examDate, results, veterinarian);
        await logPetAdminHistory({
          petId,
          module: 'exame',
          action: 'create',
          title: 'Ficha de Exame',
          details: historyDetails,
          sourceTable: 'pet_exams',
        });
        setHistoryRefresh((prev) => prev + 1);
        onSuccess?.();
        toast({ title: 'Sucesso', description: 'Exame registrado com sucesso!' });
        resetForm();
        loadRecords();
      }
    }
    setLoading(false);
  };

  const resetForm = () => {
    setExamType('');
    setResults('');
    setVeterinarian('');
    setFileUrl('');
    setNotes('');
    setExamDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingId(null);
  };

  const handleEdit = (record: Exam) => {
    setExamType(record.exam_type);
    setExamDate(record.exam_date);
    setResults(record.results || '');
    setVeterinarian(record.veterinarian || '');
    setFileUrl(record.file_url || '');
    setNotes(record.notes || '');
    setEditingId(record.id);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_exams').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logPetAdminHistory({
        petId,
        module: 'exame',
        action: 'delete',
        title: 'Exame excluído',
        details: { registro_id: id },
        sourceTable: 'pet_exams',
        sourceId: id,
      });
      setHistoryRefresh((prev) => prev + 1);
      onSuccess?.();
      toast({ title: 'Sucesso', description: 'Exame excluído' });
      loadRecords();
    }
  };

  const handleExportPdf = () => {
    exportPetRecordPdf({
      title: 'Exames',
      petName,
      sectionTitle: 'Registro de Exames',
      sectionData: {
        registro_atual: {
          tipo_exame: examType || '—',
          data: examDate || '—',
          resultados: results || '—',
          veterinario: veterinarian || '—',
          url_arquivo: fileUrl || '—',
          observacoes: notes || '—',
        },
        historico: records.map((record) => ({
          tipo_exame: record.exam_type,
          data: record.exam_date,
          resultados: record.results || '—',
          veterinario: record.veterinarian || '—',
          url_arquivo: record.file_url || '—',
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
            Exames - {petName}
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
                <Label htmlFor="exam_type">Tipo de Exame *</Label>
                <Input
                  id="exam_type"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  placeholder="Ex: Hemograma, Raio-X..."
                  spellCheck={true}
                  lang="pt-BR"
                />
              </div>
              <div>
                <Label htmlFor="exam_date">Data do Exame *</Label>
                <Input
                  id="exam_date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="veterinarian">Veterinário</Label>
              <Input
                id="veterinarian"
                value={veterinarian}
                onChange={(e) => setVeterinarian(e.target.value)}
                placeholder="Nome do veterinário responsável"
                spellCheck={true}
                lang="pt-BR"
              />
            </div>
            <div>
              <Label htmlFor="results">Resultados</Label>
              <Textarea
                id="results"
                value={results}
                onChange={(e) => setResults(e.target.value)}
                placeholder="Resultados do exame..."
                rows={3}
                spellCheck={true}
                lang="pt-BR"
              />
            </div>
            <div>
              <Label htmlFor="file_url">URL do Arquivo/Laudo</Label>
              <Input
                id="file_url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
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
            <h3 className="font-semibold mb-3">Histórico de Exames</h3>
            <div className="space-y-3">
              {recordsLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                  <span className="text-sm">Carregando exames...</span>
                </div>
              ) : recordsError ? (
                <div className="flex flex-col items-center gap-2 py-8 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-destructive font-medium">Falha ao carregar exames</p>
                  <p className="text-xs text-muted-foreground text-center">{recordsError}</p>
                  <Button variant="outline" size="sm" onClick={loadRecords}>
                    Tentar novamente
                  </Button>
                </div>
              ) : records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum exame registrado</p>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="p-4 bg-card border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{record.exam_type}</h4>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.exam_date), 'dd/MM/yyyy')}
                        </p>
                        {record.veterinarian && (
                          <p className="text-xs text-muted-foreground">
                            Veterinário: {record.veterinarian}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
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
                    {record.results && (
                      <p className="text-sm mt-2"><strong>Resultados:</strong> {record.results}</p>
                    )}
                    {record.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{record.notes}</p>
                    )}
                    {record.file_url && (
                      <a
                        href={record.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                      >
                        <Download className="h-3 w-3" />
                        Ver laudo
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <PetAdminHistorySection
            petId={petId}
            module="exame"
            title="Histórico Detalhado de Exames"
            refreshKey={historyRefresh}
          />
        </div>
      </PageDialogContent>
    </Dialog>
  );
};
