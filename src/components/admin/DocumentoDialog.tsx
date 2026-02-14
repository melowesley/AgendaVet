import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Save, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';

interface DocumentoDialogProps {
  open: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
}

interface Document {
  id: string;
  title: string;
  document_type: string | null;
  file_url: string | null;
  description: string | null;
  date: string;
}

export const DocumentoDialog = ({ open, onClose, petId, petName }: DocumentoDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Document[]>([]);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (open) loadRecords();
  }, [open, petId]);

  const loadRecords = async () => {
    const { data } = await supabase
      .from('pet_documents')
      .select('*')
      .eq('pet_id', petId)
      .order('date', { ascending: false });
    
    if (data) setRecords(data);
  };

  const handleSave = async () => {
    if (!title || !date) {
      toast({ title: 'Erro', description: 'Título e data são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('pet_documents').insert({
      pet_id: petId,
      user_id: userData.user?.id,
      title,
      document_type: documentType || null,
      file_url: fileUrl || null,
      description: description || null,
      date,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Documento registrado com sucesso!' });
      resetForm();
      loadRecords();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setDocumentType('');
    setFileUrl('');
    setDescription('');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_documents').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Documento excluído' });
      loadRecords();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos - {petName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Atestado de Saúde, Laudo..."
                />
              </div>
              <div>
                <Label htmlFor="document_type">Tipo de Documento</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atestado">Atestado</SelectItem>
                    <SelectItem value="laudo">Laudo</SelectItem>
                    <SelectItem value="certificado">Certificado</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="termo">Termo</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <div>
              <Label htmlFor="file_url">URL do Arquivo</Label>
              <Input
                id="file_url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do documento..."
                rows={3}
              />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Adicionar Documento'}
            </Button>
          </div>

          {/* Histórico */}
          <div>
            <h3 className="font-semibold mb-3">Documentos Registrados</h3>
            <div className="space-y-2">
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum documento ainda</p>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="flex items-start justify-between p-3 bg-card border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{record.title}</h4>
                        {record.document_type && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                            {record.document_type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.date), 'dd/MM/yyyy')}
                      </p>
                      {record.description && (
                        <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
                      )}
                      {record.file_url && (
                        <a
                          href={record.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          <Download className="h-3 w-3" />
                          Abrir arquivo
                        </a>
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
