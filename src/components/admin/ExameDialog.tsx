import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FlaskConical, Save, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';

interface ExameDialogProps {
  open: boolean;
  onClose: () => void;
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

export const ExameDialog = ({ open, onClose, petId, petName }: ExameDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Exam[]>([]);
  const [examType, setExamType] = useState('');
  const [examDate, setExamDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [results, setResults] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) loadRecords();
  }, [open, petId]);

  const loadRecords = async () => {
    const { data } = await supabase
      .from('pet_exams')
      .select('*')
      .eq('pet_id', petId)
      .order('exam_date', { ascending: false });
    
    if (data) setRecords(data);
  };

  const handleSave = async () => {
    if (!examType || !examDate) {
      toast({ title: 'Erro', description: 'Tipo de exame e data são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
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
      toast({ title: 'Sucesso', description: 'Exame registrado com sucesso!' });
      resetForm();
      loadRecords();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setExamType('');
    setResults('');
    setVeterinarian('');
    setFileUrl('');
    setNotes('');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_exams').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Exame excluído' });
      loadRecords();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Exames - {petName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exam_type">Tipo de Exame *</Label>
                <Input
                  id="exam_type"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  placeholder="Ex: Hemograma, Raio-X..."
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
              />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Adicionar Exame'}
            </Button>
          </div>

          {/* Histórico */}
          <div>
            <h3 className="font-semibold mb-3">Histórico de Exames</h3>
            <div className="space-y-3">
              {records.length === 0 ? (
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
