import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FlaskConical, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface PatologiaDialogProps {
  open: boolean;
  onClose: () => void;
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

export const PatologiaDialog = ({ open, onClose, petId, petName }: PatologiaDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Pathology[]>([]);
  const [name, setName] = useState('');
  const [diagnosisDate, setDiagnosisDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('active');
  const [description, setDescription] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');

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
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('pet_pathologies').insert({
      pet_id: petId,
      user_id: userData.user?.id,
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
      toast({ title: 'Sucesso', description: 'Patologia registrada com sucesso!' });
      resetForm();
      loadRecords();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTreatment('');
    setNotes('');
    setStatus('active');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_pathologies').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Registro excluído' });
      loadRecords();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Patologias - {petName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Patologia *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Diabetes, Dermatite..."
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
              />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Adicionar Patologia'}
            </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
