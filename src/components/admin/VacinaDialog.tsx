import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Syringe, Save, Trash2, Calendar, Edit2, ArrowLeft, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { exportPetRecordPdf } from './exportPetRecordPdf';
import { logPetAdminHistory } from './petAdminHistory';
import { PetAdminHistorySection } from './PetAdminHistorySection';

interface VacinaDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  petId: string;
  petName: string;
}

interface Vaccine {
  id: string;
  vaccine_name: string;
  application_date: string;
  next_dose_date: string | null;
  batch_number: string | null;
  veterinarian: string | null;
  notes: string | null;
}

export const VacinaDialog = ({ open, onClose, onBack, petId, petName }: VacinaDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Vaccine[]>([]);
  const [vaccineName, setVaccineName] = useState('');
  const [applicationDate, setApplicationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [nextDoseDate, setNextDoseDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    if (open) loadRecords();
  }, [open, petId]);

  const loadRecords = async () => {
    const { data } = await supabase
      .from('pet_vaccines')
      .select('*')
      .eq('pet_id', petId)
      .order('application_date', { ascending: false });
    
    if (data) setRecords(data);
  };

  const handleSave = async () => {
    if (!vaccineName || !applicationDate) {
      toast({ title: 'Erro', description: 'Nome da vacina e data são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    if (editingId) {
      // Editar registro existente
      const { error } = await supabase
        .from('pet_vaccines')
        .update({
          vaccine_name: vaccineName,
          application_date: applicationDate,
          next_dose_date: nextDoseDate || null,
          batch_number: batchNumber || null,
          veterinarian: veterinarian || null,
          notes: notes || null,
        })
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        await logPetAdminHistory({
          petId,
          module: 'vacina',
          action: 'update',
          title: 'Registro vacinal atualizado',
          details: { vacina: vaccineName, aplicacao: applicationDate, proxima_dose: nextDoseDate || '—', lote: batchNumber || '—' },
          sourceTable: 'pet_vaccines',
          sourceId: editingId,
        });
        setHistoryRefresh((prev) => prev + 1);
        toast({ title: 'Sucesso', description: 'Vacina atualizada com sucesso!' });
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

      const { error } = await supabase.from('pet_vaccines').insert({
        pet_id: petId,
        user_id: userData.user.id,
        vaccine_name: vaccineName,
        application_date: applicationDate,
        next_dose_date: nextDoseDate || null,
        batch_number: batchNumber || null,
        veterinarian: veterinarian || null,
        notes: notes || null,
      });

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        setLoading(false);
      } else {
        await logPetAdminHistory({
          petId,
          module: 'vacina',
          action: 'create',
          title: 'Nova vacina registrada',
          details: { vacina: vaccineName, aplicacao: applicationDate, proxima_dose: nextDoseDate || '—', lote: batchNumber || '—' },
          sourceTable: 'pet_vaccines',
        });
        setHistoryRefresh((prev) => prev + 1);
        toast({ title: 'Sucesso', description: 'Vacina registrada com sucesso!' });
        resetForm();
        loadRecords();
      }
    }
    setLoading(false);
  };

  const resetForm = () => {
    setVaccineName('');
    setNextDoseDate('');
    setBatchNumber('');
    setVeterinarian('');
    setNotes('');
    setApplicationDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingId(null);
  };

  const handleEdit = (record: Vaccine) => {
    setVaccineName(record.vaccine_name);
    setApplicationDate(record.application_date);
    setNextDoseDate(record.next_dose_date || '');
    setBatchNumber(record.batch_number || '');
    setVeterinarian(record.veterinarian || '');
    setNotes(record.notes || '');
    setEditingId(record.id);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_vaccines').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logPetAdminHistory({
        petId,
        module: 'vacina',
        action: 'delete',
        title: 'Vacina excluída',
        details: { registro_id: id },
        sourceTable: 'pet_vaccines',
        sourceId: id,
      });
      setHistoryRefresh((prev) => prev + 1);
      toast({ title: 'Sucesso', description: 'Vacina excluída' });
      loadRecords();
    }
  };

  const handleExportPdf = () => {
    exportPetRecordPdf({
      title: 'Vacinas',
      petName,
      sectionTitle: 'Controle Vacinal',
      sectionData: {
        registro_atual: {
          nome_vacina: vaccineName || '—',
          data_aplicacao: applicationDate || '—',
          proxima_dose: nextDoseDate || '—',
          lote: batchNumber || '—',
          veterinario: veterinarian || '—',
          observacoes: notes || '—',
        },
        historico: records.map((record) => ({
          nome_vacina: record.vaccine_name,
          data_aplicacao: record.application_date,
          proxima_dose: record.next_dose_date || '—',
          lote: record.batch_number || '—',
          veterinario: record.veterinarian || '—',
          observacoes: record.notes || '—',
        })),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack || onClose}>
              <ArrowLeft size={16} />
            </Button>
            <Syringe className="h-5 w-5" />
            Vacinas - {petName}
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
                <Label htmlFor="vaccine_name">Nome da Vacina *</Label>
                <Input
                  id="vaccine_name"
                  value={vaccineName}
                  onChange={(e) => setVaccineName(e.target.value)}
                  placeholder="Ex: V10, Antirrábica..."
                  spellCheck={true}
                  lang="pt-BR"
                />
              </div>
              <div>
                <Label htmlFor="application_date">Data de Aplicação *</Label>
                <Input
                  id="application_date"
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="next_dose_date">Próxima Dose</Label>
                <Input
                  id="next_dose_date"
                  type="date"
                  value={nextDoseDate}
                  onChange={(e) => setNextDoseDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="batch_number">Lote</Label>
                <Input
                  id="batch_number"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="Número do lote"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="veterinarian">Veterinário</Label>
              <Input
                id="veterinarian"
                value={veterinarian}
                onChange={(e) => setVeterinarian(e.target.value)}
                placeholder="Nome do veterinário"
                spellCheck={true}
                lang="pt-BR"
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
            <h3 className="font-semibold mb-3">Histórico de Vacinação</h3>
            <div className="space-y-2">
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma vacina registrada</p>
              ) : (
                records.map((record) => {
                  const isNextDoseUpcoming = record.next_dose_date && new Date(record.next_dose_date) > new Date();
                  return (
                    <div key={record.id} className="p-3 bg-card border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{record.vaccine_name}</h4>
                            {record.batch_number && (
                              <span className="text-xs px-2 py-0.5 bg-muted rounded">
                                Lote: {record.batch_number}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Aplicada em: {format(new Date(record.application_date), 'dd/MM/yyyy')}
                          </p>
                          {record.next_dose_date && (
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                Próxima dose: {format(new Date(record.next_dose_date), 'dd/MM/yyyy')}
                              </p>
                              {isNextDoseUpcoming && (
                                <Badge variant="outline" className="text-[10px] ml-1">Pendente</Badge>
                              )}
                            </div>
                          )}
                          {record.veterinarian && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Vet: {record.veterinarian}
                            </p>
                          )}
                          {record.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{record.notes}</p>
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
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <PetAdminHistorySection
            petId={petId}
            module="vacina"
            title="Histórico Detalhado de Vacinas"
            refreshKey={historyRefresh}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
