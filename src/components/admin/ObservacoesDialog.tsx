import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface ObservacoesDialogProps {
  open: boolean;
  onClose: () => void;
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

export const ObservacoesDialog = ({ open, onClose, petId, petName }: ObservacoesDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Observation[]>([]);
  const [title, setTitle] = useState('');
  const [observation, setObservation] = useState('');
  const [observationDate, setObservationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('');

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
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('pet_observations').insert({
      pet_id: petId,
      user_id: userData.user?.id,
      title: title || null,
      observation,
      observation_date: observationDate,
      category: category || null,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Observação registrada com sucesso!' });
      resetForm();
      loadRecords();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setObservation('');
    setCategory('');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_observations').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Observações - {petName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da observação"
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
              />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Adicionar Observação'}
            </Button>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{record.observation}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
