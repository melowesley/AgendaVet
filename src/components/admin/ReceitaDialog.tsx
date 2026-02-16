import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Save, Trash2, Pill, ArrowLeft, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { exportPetRecordPdf } from './exportPetRecordPdf';
import { logPetAdminHistory } from './petAdminHistory';
import { PetAdminHistorySection } from './PetAdminHistorySection';

interface ReceitaDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  petId: string;
  petName: string;
}

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  prescription_date: string;
  veterinarian: string | null;
  notes: string | null;
}

export const ReceitaDialog = ({ open, onClose, onBack, petId, petName }: ReceitaDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Prescription[]>([]);
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [veterinarian, setVeterinarian] = useState('');
  const [notes, setNotes] = useState('');
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    if (open) loadRecords();
  }, [open, petId]);

  const loadRecords = async () => {
    const { data } = await supabase
      .from('pet_prescriptions')
      .select('*')
      .eq('pet_id', petId)
      .order('prescription_date', { ascending: false });
    
    if (data) setRecords(data);
  };

  const handleSave = async () => {
    if (!medicationName || !prescriptionDate) {
      toast({ title: 'Erro', description: 'Nome do medicamento e data são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !userData.user?.id) {
      toast({ title: 'Erro', description: 'Não foi possível obter dados do usuário. Faça login novamente.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('pet_prescriptions').insert({
      pet_id: petId,
      user_id: userData.user.id,
      medication_name: medicationName,
      dosage: dosage || null,
      frequency: frequency || null,
      duration: duration || null,
      prescription_date: prescriptionDate,
      veterinarian: veterinarian || null,
      notes: notes || null,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      setLoading(false);
    } else {
      await logPetAdminHistory({
        petId,
        module: 'receita',
        action: 'create',
        title: 'Receita registrada',
        details: {
          medicamento: medicationName,
          dosagem: dosage || '—',
          frequencia: frequency || '—',
          duracao: duration || '—',
          data_receita: prescriptionDate,
        },
        sourceTable: 'pet_prescriptions',
      });
      setHistoryRefresh((prev) => prev + 1);
      toast({ title: 'Sucesso', description: 'Receita registrada com sucesso!' });
      resetForm();
      loadRecords();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setMedicationName('');
    setDosage('');
    setFrequency('');
    setDuration('');
    setVeterinarian('');
    setNotes('');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pet_prescriptions').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logPetAdminHistory({
        petId,
        module: 'receita',
        action: 'delete',
        title: 'Receita excluída',
        details: { registro_id: id },
        sourceTable: 'pet_prescriptions',
        sourceId: id,
      });
      setHistoryRefresh((prev) => prev + 1);
      toast({ title: 'Sucesso', description: 'Receita excluída' });
      loadRecords();
    }
  };

  const handleExportPdf = () => {
    exportPetRecordPdf({
      title: 'Receitas',
      petName,
      sectionTitle: 'Prescricoes',
      sectionData: {
        registro_atual: {
          medicamento: medicationName || '—',
          data_receita: prescriptionDate || '—',
          dosagem: dosage || '—',
          frequencia: frequency || '—',
          duracao: duration || '—',
          veterinario: veterinarian || '—',
          observacoes: notes || '—',
        },
        historico: records.map((record) => ({
          medicamento: record.medication_name,
          data_receita: record.prescription_date,
          dosagem: record.dosage || '—',
          frequencia: record.frequency || '—',
          duracao: record.duration || '—',
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
            <ClipboardList className="h-5 w-5" />
            Receitas - {petName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="medication_name">Medicamento *</Label>
                <Input
                  id="medication_name"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  placeholder="Nome do medicamento"
                  spellCheck={true}
                  lang="pt-BR"
                />
              </div>
              <div>
                <Label htmlFor="prescription_date">Data da Receita *</Label>
                <Input
                  id="prescription_date"
                  type="date"
                  value={prescriptionDate}
                  onChange={(e) => setPrescriptionDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dosage">Dosagem</Label>
                <Input
                  id="dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="Ex: 10mg"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequência</Label>
                <Input
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="Ex: 2x ao dia"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duração</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex: 7 dias"
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
              <Label htmlFor="notes">Instruções/Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instruções de uso, observações..."
                rows={3}
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

          {/* Histórico */}
          <div>
            <h3 className="font-semibold mb-3">Histórico de Receitas</h3>
            <div className="space-y-3">
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma receita registrada</p>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="p-4 bg-card border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2">
                        <Pill className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-semibold">{record.medication_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(record.prescription_date), 'dd/MM/yyyy')}
                          </p>
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
                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                      {record.dosage && (
                        <div>
                          <span className="text-muted-foreground text-xs">Dosagem:</span>
                          <p className="font-medium">{record.dosage}</p>
                        </div>
                      )}
                      {record.frequency && (
                        <div>
                          <span className="text-muted-foreground text-xs">Frequência:</span>
                          <p className="font-medium">{record.frequency}</p>
                        </div>
                      )}
                      {record.duration && (
                        <div>
                          <span className="text-muted-foreground text-xs">Duração:</span>
                          <p className="font-medium">{record.duration}</p>
                        </div>
                      )}
                    </div>
                    {record.veterinarian && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Veterinário: {record.veterinarian}
                      </p>
                    )}
                    {record.notes && (
                      <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                        {record.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <PetAdminHistorySection
            petId={petId}
            module="receita"
            title="Histórico Detalhado de Receitas"
            refreshKey={historyRefresh}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
