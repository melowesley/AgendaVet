import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Camera, Save, Trash2, ExternalLink, ArrowLeft, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { exportPetRecordPdf } from './exportPetRecordPdf';
import { logPetAdminHistory } from './petAdminHistory';
import { PetAdminHistorySection } from './PetAdminHistorySection';

interface FotosDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  petId: string;
  petName: string;
}

interface Photo {
  id: string;
  title: string | null;
  photo_url: string;
  description: string | null;
  date: string;
  tags: string[] | null;
}

export const FotosDialog = ({ open, onClose, onBack, petId, petName }: FotosDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Photo[]>([]);
  const [title, setTitle] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tags, setTags] = useState('');
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    if (open) loadRecords();
  }, [open, petId]);

  const loadRecords = async () => {
    const { data } = await supabase
      .from('pet_photos')
      .select('*')
      .eq('pet_id', petId)
      .order('date', { ascending: false });
    
    if (data) setRecords(data);
  };

  const handleSave = async () => {
    if (!photoUrl || !date) {
      toast({ title: 'Erro', description: 'URL da foto e data são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !userData.user?.id) {
      toast({ title: 'Erro', description: 'Não foi possível obter dados do usuário. Faça login novamente.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    const { error } = await supabase.from('pet_photos').insert({
      pet_id: petId,
      user_id: userData.user.id,
      title: title || null,
      photo_url: photoUrl,
      description: description || null,
      date,
      tags: tagsArray.length > 0 ? tagsArray : null,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      setLoading(false);
    } else {
      await logPetAdminHistory({
        petId,
        module: 'fotos',
        action: 'create',
        title: 'Foto adicionada à ficha',
        details: { titulo: title || '—', data, url: photoUrl, tags: tagsArray },
        sourceTable: 'pet_photos',
      });
      setHistoryRefresh((prev) => prev + 1);
      toast({ title: 'Sucesso', description: 'Foto registrada com sucesso!' });
      resetForm();
      loadRecords();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setPhotoUrl('');
    setDescription('');
    setTags('');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_photos').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logPetAdminHistory({
        petId,
        module: 'fotos',
        action: 'delete',
        title: 'Foto removida da ficha',
        details: { registro_id: id },
        sourceTable: 'pet_photos',
        sourceId: id,
      });
      setHistoryRefresh((prev) => prev + 1);
      toast({ title: 'Sucesso', description: 'Foto excluída' });
      loadRecords();
    }
  };

  const handleExportPdf = () => {
    exportPetRecordPdf({
      title: 'Fotos',
      petName,
      sectionTitle: 'Galeria de Fotos',
      sectionData: {
        registro_atual: {
          titulo: title || '—',
          data: date || '—',
          url_foto: photoUrl || '—',
          descricao: description || '—',
          tags: tags || '—',
        },
        historico: records.map((record) => ({
          titulo: record.title || '—',
          data: record.date,
          url_foto: record.photo_url,
          descricao: record.description || '—',
          tags: record.tags && record.tags.length ? record.tags.join(', ') : '—',
        })),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack || onClose}>
              <ArrowLeft size={16} />
            </Button>
            <Camera className="h-5 w-5" />
            Fotos - {petName}
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
                  placeholder="Ex: Consulta de rotina"
                  spellCheck={true}
                  lang="pt-BR"
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
              <Label htmlFor="photo_url">URL da Foto *</Label>
              <Input
                id="photo_url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da foto..."
                rows={2}
                spellCheck={true}
                lang="pt-BR"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ex: lesão, pele, tratamento"
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
            </div>
          </div>

          {/* Galeria */}
          <div>
            <h3 className="font-semibold mb-3">Galeria de Fotos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {records.length === 0 ? (
                <p className="col-span-full text-sm text-muted-foreground text-center py-8">Nenhuma foto registrada</p>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="group relative bg-card border rounded-lg overflow-hidden">
                    <a
                      href={record.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square bg-muted"
                    >
                      <img
                        src={record.photo_url}
                        alt={record.title || 'Foto'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EFoto%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </a>
                    <div className="p-2">
                      {record.title && (
                        <h4 className="font-semibold text-sm truncate">{record.title}</h4>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.date), 'dd/MM/yyyy')}
                      </p>
                      {record.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {record.description}
                        </p>
                      )}
                      {record.tags && record.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {record.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <a
                      href={record.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Button variant="secondary" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          <PetAdminHistorySection
            petId={petId}
            module="fotos"
            title="Histórico Detalhado de Fotos"
            refreshKey={historyRefresh}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
