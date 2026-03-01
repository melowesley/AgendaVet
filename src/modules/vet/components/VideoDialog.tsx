import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, PageDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Video, Save, Trash2, Play, ArrowLeft, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { exportPetRecordPdf } from './exportPetRecordPdf';
import { logPetAdminHistory } from './petAdminHistory';
import { PetAdminHistorySection } from './PetAdminHistorySection';

interface VideoDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
  petId: string;
  petName: string;
}

interface VideoRecord {
  id: string;
  title: string | null;
  video_url: string;
  description: string | null;
  date: string;
  tags: string[] | null;
}

export const VideoDialog = ({ open, onClose, onBack, onSuccess, petId, petName }: VideoDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<VideoRecord[]>([]);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tags, setTags] = useState('');
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    if (open) loadRecords();
  }, [open, petId]);

  const loadRecords = async () => {
    const { data } = await supabase
      .from('pet_videos')
      .select('*')
      .eq('pet_id', petId)
      .order('date', { ascending: false });
    
    if (data) setRecords(data);
  };

  const handleSave = async () => {
    if (!videoUrl || !date) {
      toast({ title: 'Erro', description: 'URL do vídeo e data são obrigatórios', variant: 'destructive' });
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
    
    const { error } = await supabase.from('pet_videos').insert({
      pet_id: petId,
      user_id: userData.user.id,
      title: title || null,
      video_url: videoUrl,
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
        module: 'video',
        action: 'create',
        title: 'Ficha de Gravação',
        details: { titulo: title || '—', data, url: videoUrl, tags: tagsArray },
        sourceTable: 'pet_videos',
      });
      setHistoryRefresh((prev) => prev + 1);
      onSuccess?.();
      toast({ title: 'Sucesso', description: 'Vídeo registrado com sucesso!' });
      resetForm();
      loadRecords();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setVideoUrl('');
    setDescription('');
    setTags('');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_videos').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logPetAdminHistory({
        petId,
        module: 'video',
        action: 'delete',
        title: 'Gravação excluída',
        details: { registro_id: id },
        sourceTable: 'pet_videos',
        sourceId: id,
      });
      setHistoryRefresh((prev) => prev + 1);
      onSuccess?.();
      toast({ title: 'Sucesso', description: 'Vídeo excluído' });
      loadRecords();
    }
  };

  const handleExportPdf = () => {
    exportPetRecordPdf({
      title: 'Videos',
      petName,
      sectionTitle: 'Galeria de Videos',
      sectionData: {
        registro_atual: {
          titulo: title || '—',
          data: date || '—',
          url_video: videoUrl || '—',
          descricao: description || '—',
          tags: tags || '—',
        },
        historico: records.map((record) => ({
          titulo: record.title || '—',
          data: record.date,
          url_video: record.video_url,
          descricao: record.description || '—',
          tags: record.tags && record.tags.length ? record.tags.join(', ') : '—',
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
            <Video className="h-5 w-5" />
            Vídeos - {petName}
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
                  placeholder="Ex: Comportamento durante consulta"
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
              <Label htmlFor="video_url">URL do Vídeo *</Label>
              <Input
                id="video_url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://... (YouTube, Google Drive, etc)"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do vídeo..."
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
                placeholder="Ex: comportamento, sintomas, tratamento"
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

          {/* Lista de Vídeos */}
          <div>
            <h3 className="font-semibold mb-3">Vídeos Registrados</h3>
            <div className="space-y-3">
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum vídeo registrado</p>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="p-4 bg-card border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          <Play className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {record.title && (
                            <h4 className="font-semibold">{record.title}</h4>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(record.date), 'dd/MM/yyyy')}
                          </p>
                          {record.description && (
                            <p className="text-sm text-muted-foreground mt-1">
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
                          <a
                            href={record.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                          >
                            <Play className="h-3 w-3" />
                            Assistir vídeo
                          </a>
                        </div>
                      </div>
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
            module="video"
            title="Histórico Detalhado de Vídeos"
            refreshKey={historyRefresh}
          />
        </div>
      </PageDialogContent>
    </Dialog>
  );
};
