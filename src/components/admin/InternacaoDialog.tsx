import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, PageDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2, Calendar, ArrowLeft, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { exportPetRecordPdf } from './exportPetRecordPdf';
import { logPetAdminHistory } from './petAdminHistory';
import { PetAdminHistorySection } from './PetAdminHistorySection';

interface InternacaoDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
  petId: string;
  petName: string;
}

interface Hospitalization {
  id: string;
  admission_date: string;
  discharge_date: string | null;
  reason: string;
  status: string;
  veterinarian: string | null;
  diagnosis: string | null;
  treatment: string | null;
  daily_notes: Record<string, unknown> | null;
  notes: string | null;
}

export const InternacaoDialog = ({ open, onClose, onBack, onSuccess, petId, petName }: InternacaoDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Hospitalization[]>([]);
  const [admissionDate, setAdmissionDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [dischargeDate, setDischargeDate] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('active');
  const [veterinarian, setVeterinarian] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    if (open) loadRecords();
  }, [open, petId]);

  const loadRecords = async () => {
    const { data } = await supabase
      .from('pet_hospitalizations')
      .select('*')
      .eq('pet_id', petId)
      .order('admission_date', { ascending: false });
    
    if (data) setRecords(data);
  };

  const handleSave = async () => {
    if (!reason || !admissionDate) {
      toast({ title: 'Erro', description: 'Motivo e data de admissão são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !userData.user?.id) {
      toast({ title: 'Erro', description: 'Não foi possível obter dados do usuário. Faça login novamente.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('pet_hospitalizations').insert({
      pet_id: petId,
      user_id: userData.user.id,
      admission_date: admissionDate,
      discharge_date: dischargeDate || null,
      reason,
      status,
      veterinarian: veterinarian || null,
      diagnosis: diagnosis || null,
      treatment: treatment || null,
      notes: notes || null,
      daily_notes: null,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      setLoading(false);
    } else {
      await logPetAdminHistory({
        petId,
        module: 'internacao',
        action: 'create',
        title: 'Ficha de Internação',        details: {
          admissao: admissionDate,
          alta: dischargeDate || '—',
          motivo: reason,
          status,
          veterinario: veterinarian || '—',
          diagnostico: diagnosis || '—',
        },
        sourceTable: 'pet_hospitalizations',
      });
      setHistoryRefresh((prev) => prev + 1);
      onSuccess?.();      toast({ title: 'Sucesso', description: 'Internação excluída' });
      loadRecords();
    }
  };

  const handleExportPdf = () => {
    exportPetRecordPdf({
      title: 'Internacoes',
      petName,
      sectionTitle: 'Dados de Internacao',
      sectionData: {
        registro_atual: {
          admissao: admissionDate || '—',
          alta: dischargeDate || '—',
          motivo: reason || '—',
          status: status || '—',
          veterinario: veterinarian || '—',
          diagnostico: diagnosis || '—',
          tratamento: treatment || '—',
          observacoes: notes || '—',
        },
        historico: records.map((record) => ({
          admissao: record.admission_date,
          alta: record.discharge_date || '—',
          motivo: record.reason,
          status: record.status,
          veterinario: record.veterinarian || '—',
          diagnostico: record.diagnosis || '—',
          tratamento: record.treatment || '—',
          observacoes: record.notes || '—',
        })),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <PageDialogContent className="p-6">        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack || onClose}>
              <ArrowLeft size={16} />
            </Button>
            <Plus className="h-5 w-5" />
            Internações - {petName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admission_date">Data/Hora de Admissão *</Label>
                <Input
                  id="admission_date"
                  type="datetime-local"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="discharge_date">Data/Hora de Alta</Label>
                <Input
                  id="discharge_date"
                  type="datetime-local"
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Motivo da Internação *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo da internação..."
                rows={2}
                spellCheck={true}
                lang="pt-BR"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Em Internação</SelectItem>
                    <SelectItem value="discharged">Alta</SelectItem>
                    <SelectItem value="transferred">Transferido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="veterinarian">Veterinário Responsável</Label>
                <Input
                  id="veterinarian"
                  value={veterinarian}
                  onChange={(e) => setVeterinarian(e.target.value)}
                  placeholder="Nome do veterinário"
                  spellCheck={true}
                  lang="pt-BR"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="diagnosis">Diagnóstico</Label>
              <Textarea
                id="diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Diagnóstico..."
                rows={2}
                spellCheck={true}
                lang="pt-BR"
              />
            </div>
            <div>
              <Label htmlFor="treatment">Tratamento</Label>
              <Textarea
                id="treatment"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                placeholder="Tratamento realizado..."
                rows={2}
                spellCheck={true}
                lang="pt-BR"
              />
            </div>
            <div>
              <Label htmlFor="notes">Observações Gerais</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações gerais..."
                rows={2}
                spellCheck={true}
                lang="pt-BR"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Informações'}              </Button>
              <Button variant="outline" onClick={handleExportPdf}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {/* Histórico */}
          <div>
            <h3 className="font-semibold mb-3">Histórico de Internações</h3>
            <div className="space-y-3">
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma internação registrada</p>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="p-4 bg-card border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">Internação</h4>
                          <Badge variant={record.status === 'active' ? 'destructive' : record.status === 'discharged' ? 'default' : 'secondary'}>
                            {record.status === 'active' ? 'Em Internação' : record.status === 'discharged' ? 'Alta' : 'Transferido'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Admissão: {format(new Date(record.admission_date), "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                        </div>
                        {record.discharge_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Alta: {format(new Date(record.discharge_date), "dd/MM/yyyy 'às' HH:mm")}
                            </span>
                          </div>
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
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Motivo:</strong> {record.reason}
                      </div>
                      {record.diagnosis && (
                        <div>
                          <strong>Diagnóstico:</strong> {record.diagnosis}
                        </div>
                      )}
                      {record.treatment && (
                        <div>
                          <strong>Tratamento:</strong> {record.treatment}
                        </div>
                      )}
                      {record.veterinarian && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Veterinário:</strong> {record.veterinarian}
                        </div>
                      )}
                      {record.notes && (
                        <div className="p-2 bg-muted/50 rounded text-xs mt-2">
                          {record.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <PetAdminHistorySection
            petId={petId}
            module="internacao"
            title="Histórico Detalhado de Internações"
            refreshKey={historyRefresh}
          />
        </div>
      </PageDialogContent>
    </Dialog>
  );
};
