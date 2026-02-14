import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, PageDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Save, Trash2, Edit2, ArrowLeft, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { exportPetRecordPdf } from './exportPetRecordPdf';
import { logPetAdminHistory } from './petAdminHistory';
import { PetAdminHistorySection } from './PetAdminHistorySection';

interface ObservacoesDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
  petId: string;
  petName: string;
}

interface Observation {
  id: string;
  title: string | null;
  observation: string;
  observation_date: string;
  category: string | null;
}

export const ObservacoesDialog = ({ open, onClose, onBack, onSuccess, petId, petName }: ObservacoesDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Observation[]>([]);
  const [title, setTitle] = useState('');
  const [observation, setObservation] = useState('');
  const [observationDate, setObservationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    if (open) loadRecords();
  }, [open, petId]);

  const loadRecords = async () => {
    const { data } = await supabase
      .from('pet_observations')
      .select('*')
      .eq('pet_id', petId)
      .order('observation_date', { ascending: false });
    
    if (data) setRecords(data);
  };

  const handleSave = async () => {
    if (!observation || !observationDate) {
      toast({ title: 'Erro', description: 'Observação e data são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    if (editingId) {
      // Editar registro existente
      const { error } = await supabase
        .from('pet_observations')
        .update({
          title: title || null,
          observation,
          observation_date: observationDate,
          category: category || null,
        })
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        await logPetAdminHistory({
          petId,
          module: 'observacoes',
          action: 'update',
          title: 'Ficha de Observações',
          details: { titulo: title || '—', categoria: category || '—', data: observationDate, observacao: observation },
          sourceTable: 'pet_observations',
          sourceId: editingId,
        });
        setHistoryRefresh((prev) => prev + 1);
        onSuccess?.();
        toast({ title: 'Sucesso', description: 'Observação atualizada com sucesso!' });
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

      const { error } = await supabase.from('pet_observations').insert({
        pet_id: petId,
        user_id: userData.user.id,
        title: title || null,
        observation,
        observation_date: observationDate,
        category: category || null,
      });

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        setLoading(false);
      } else {
        await logPetAdminHistory({
          petId,
          module: 'observacoes',
          action: 'create',
          title: 'Ficha de Observações',
          details: { titulo: title || '—', categoria: category || '—', data: observationDate, observacao: observation },
          sourceTable: 'pet_observations',
        });
        setHistoryRefresh((prev) => prev + 1);
        onSuccess?.();
        toast({ title: 'Sucesso', description: 'Observação registrada com sucesso!' });
        resetForm();
        loadRecords();
      }
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setObservation('');
    setCategory('');
    setObservationDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingId(null);
  };

  const handleEdit = (record: Observation) => {
    setTitle(record.title || '');
    setObservation(record.observation);
    setObservationDate(record.observation_date);
    setCategory(record.category || '');
    setEditingId(record.id);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_observations').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logPetAdminHistory({
        petId,
        module: 'observacoes',
        action: 'delete',
        title: 'Observação excluída',
        details: { registro_id: id },
        sourceTable: 'pet_observations',
        sourceId: id,
      });
      setHistoryRefresh((prev) => prev + 1);
      onSuccess?.();
      toast({ title: 'Sucesso', description: 'Observação excluída' });
      loadRecords();
    }
  };

  const getCategoryColor = (cat: string | null) => {
    switch (cat) {
      case 'comportamento': return 'bg-blue-500';
      case 'alimentacao': return 'bg-green-500';
      case 'saude': return 'bg-red-500';
      case 'tratamento': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const handleExportPdf = () => {
    exportPetRecordPdf({
      title: 'Observacoes',
      petName,
      sectionTitle: 'Historico de Observacoes',
      sectionData: {
        registro_atual: {
          titulo: title || '—',
          categoria: category || '—',
          data: observationDate || '—',
          observacao: observation || '—',
        },
        historico: records.map((record) => ({
          titulo: record.title || '—',
          categoria: record.category || '—',
          data: record.observation_date,
          observacao: record.observation,
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
            <MessageSquare className="h-5 w-5" />
            Observações - {petName}
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
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da observação"
                  spellCheck={true}
                  lang="pt-BR"
                />
              </div>
              <div>
                <Label htmlFor="observation_date">Data *</Label>
                <Input
                  id="observation_date"
                  type="date"
                  value={observationDate}
                  onChange={(e) => setObservationDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comportamento">Comportamento</SelectItem>
                  <SelectItem value="alimentacao">Alimentação</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="tratamento">Tratamento</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="observation">Observação *</Label>
              <Textarea
                id="observation"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Descreva a observação..."
                rows={4}
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
            <h3 className="font-semibold mb-3">Histórico de Observações</h3>
            <div className="space-y-3">
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma observação registrada</p>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="p-4 bg-card border-l-4 border rounded-lg" style={{ borderLeftColor: record.category ? getCategoryColor(record.category) : '#888' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {record.title && (
                            <h4 className="font-semibold">{record.title}</h4>
                          )}
                          {record.category && (
                            <Badge variant="secondary" className="text-[10px]">
                              {record.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.observation_date), 'dd/MM/yyyy')}
                        </p>
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
                    <p className="text-sm whitespace-pre-wrap">{record.observation}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <PetAdminHistorySection
            petId={petId}
            module="observacoes"
            title="Histórico Detalhado de Observações"
            refreshKey={historyRefresh}
          />
        </div>
      </PageDialogContent>
    </Dialog>
  );
};
