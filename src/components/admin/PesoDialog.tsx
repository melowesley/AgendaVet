import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Weight, Save, Trash2, Edit2, TrendingUp, TrendingDown, Minus, ArrowLeft, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { exportPetRecordPdf } from './exportPetRecordPdf';
import { logPetAdminHistory } from './petAdminHistory';
import { PetAdminHistorySection } from './PetAdminHistorySection';

interface PesoDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  petId: string;
  petName: string;
}

interface WeightRecord {
  id: string;
  weight: number;
  date: string;
  notes: string | null;
}

export const PesoDialog = ({ open, onClose, onBack, petId, petName }: PesoDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    if (open) {
      loadRecords();
    }
  }, [open, petId]);

  const loadRecords = async () => {
    const { data } = await supabase
      .from('pet_weight_records')
      .select('*')
      .eq('pet_id', petId)
      .order('date', { ascending: false });
    
    if (data) setRecords(data);
  };

  const handleSave = async () => {
    if (!weight || !date) {
      toast({ title: 'Erro', description: 'Peso e data são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    
    if (editingId) {
      // Editar registro existente
      const { error } = await supabase
        .from('pet_weight_records')
        .update({
          weight: parseFloat(weight),
          date,
          notes: notes || null,
        })
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        await logPetAdminHistory({
          petId,
          module: 'peso',
          action: 'update',
          title: 'Registro de peso atualizado',
          details: { peso_kg: weight, data: date, observacoes: notes || '—' },
          sourceTable: 'pet_weight_records',
          sourceId: editingId,
        });
        setHistoryRefresh((prev) => prev + 1);
        toast({ title: 'Sucesso', description: 'Registro atualizado com sucesso!' });
        resetForm();
        loadRecords();
      }
    } else {
      // Criar novo registro
      const { error } = await supabase.from('pet_weight_records').insert({
        pet_id: petId,
        user_id: userData.user?.id,
        weight: parseFloat(weight),
        date,
        notes: notes || null,
      });

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        await logPetAdminHistory({
          petId,
          module: 'peso',
          action: 'create',
          title: 'Novo registro de peso',
          details: { peso_kg: weight, data: date, observacoes: notes || '—' },
          sourceTable: 'pet_weight_records',
        });
        setHistoryRefresh((prev) => prev + 1);
        toast({ title: 'Sucesso', description: 'Peso registrado com sucesso!' });
        resetForm();
        loadRecords();
      }
    }
    setLoading(false);
  };

  const resetForm = () => {
    setWeight('');
    setNotes('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingId(null);
  };

  const handleEdit = (record: WeightRecord) => {
    setWeight(record.weight.toString());
    setDate(record.date);
    setNotes(record.notes || '');
    setEditingId(record.id);
  };

  const calculateVariation = () => {
    if (records.length < 2) return null;
    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const oldest = sorted[0].weight;
    const newest = sorted[sorted.length - 1].weight;
    const variation = newest - oldest;
    return { variation, isPositive: variation > 0 };
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_weight_records').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logPetAdminHistory({
        petId,
        module: 'peso',
        action: 'delete',
        title: 'Registro de peso excluído',
        details: { registro_id: id },
        sourceTable: 'pet_weight_records',
        sourceId: id,
      });
      setHistoryRefresh((prev) => prev + 1);
      toast({ title: 'Sucesso', description: 'Registro excluído' });
      loadRecords();
    }
  };

  const handleExportPdf = () => {
    exportPetRecordPdf({
      title: 'Registro de Peso',
      petName,
      sectionTitle: 'Dados de Peso',
      sectionData: {
        registro_atual: {
          peso_kg: weight || '—',
          data: date || '—',
          observacoes: notes || '—',
        },
        historico: records.map((record) => ({
          peso_kg: record.weight,
          data: record.date,
          observacoes: record.notes || '—',
        })),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack || onClose}>
              <ArrowLeft size={16} />
            </Button>
            <Weight className="h-5 w-5" />
            Registro de Peso - {petName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas */}
          {records.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Último Peso</p>
                  <p className="text-lg font-bold">{records[0]?.weight} kg</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Média</p>
                  <p className="text-lg font-bold">
                    {(records.reduce((sum, r) => sum + r.weight, 0) / records.length).toFixed(2)} kg
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Variação</p>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const variation = calculateVariation();
                      if (!variation) return <span className="text-lg font-bold">-</span>;
                      const Icon = variation.isPositive ? TrendingUp : variation.variation === 0 ? Minus : TrendingDown;
                      return (
                        <>
                          <Icon className={`h-4 w-4 ${variation.isPositive ? 'text-green-500' : variation.variation === 0 ? 'text-gray-500' : 'text-red-500'}`} />
                          <span className={`text-lg font-bold ${variation.isPositive ? 'text-green-500' : variation.variation === 0 ? 'text-gray-500' : 'text-red-500'}`}>
                            {variation.variation > 0 ? '+' : ''}{variation.variation.toFixed(2)} kg
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
                <Label htmlFor="weight">Peso (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
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
            <h3 className="font-semibold mb-3">Histórico de Peso</h3>
            <div className="space-y-2">
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro ainda</p>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">{record.weight} kg</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.date), 'dd/MM/yyyy')}
                      </p>
                      {record.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{record.notes}</p>
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
                ))
              )}
            </div>
          </div>

          <PetAdminHistorySection
            petId={petId}
            module="peso"
            title="Histórico Detalhado do Peso"
            refreshKey={historyRefresh}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
