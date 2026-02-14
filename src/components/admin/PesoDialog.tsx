import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Weight, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface PesoDialogProps {
  open: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
}

interface WeightRecord {
  id: string;
  weight: number;
  date: string;
  notes: string | null;
}

export const PesoDialog = ({ open, onClose, petId, petName }: PesoDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

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
      toast({ title: 'Sucesso', description: 'Peso registrado com sucesso!' });
      setWeight('');
      setNotes('');
      loadRecords();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_weight_records').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Registro excluído' });
      loadRecords();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Weight className="h-5 w-5" />
            Registro de Peso - {petName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
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
                <Label htmlFor="date">Data</Label>
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
              />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Adicionar Registro'}
            </Button>
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
                    <div>
                      <p className="font-semibold">{record.weight} kg</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.date), 'dd/MM/yyyy')}
                      </p>
                      {record.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{record.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
