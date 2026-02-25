import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, PageDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ClipboardList, Save, Trash2, Pill, ArrowLeft, FileDown,
  ScrollText, ShieldAlert, ChevronRight, Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { logPetAdminHistory } from './petAdminHistory';
import { PetAdminHistorySection } from './PetAdminHistorySection';
import { generateReceitaSummary } from '@/utils/procedureSummaries';
import { buildReceitaSimplesPdfHtml, buildReceitaControladaPdfHtml } from './exportReceitaPdf';
import { RichTextEditor } from './RichTextEditor';
import { ReceitaPreviewDialog } from './ReceitaPreviewDialog';

type ReceiptType = null | 'simples' | 'controlado';

interface ReceitaDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
  petId: string;
  petName: string;
}

export const ReceitaDialog = ({ open, onClose, onBack, onSuccess, petId, petName }: ReceitaDialogProps) => {
  const { toast } = useToast();
  const [receiptType, setReceiptType] = useState<ReceiptType>(null);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Prescription[]>([]);
  const [petDetails, setPetDetails] = useState<PetDetails | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // ── Preview dialog ─────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // ── Campos compartilhados ──────────────────────────────────────
  const [prescriptionDate, setPrescriptionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [petSex, setPetSex] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petAge, setPetAge] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [tutorAddress, setTutorAddress] = useState('');

  // ── Campos do Receituário Simples ──────────────────────────────
  const [clinicName, setClinicName] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [simpleCrmv, setSimpleCrmv] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [simplesPrescrição, setSimplesPrescrição] = useState('');

  // ── Campos do Receituário Controlado ──────────────────────────
  const [emitterName, setEmitterName] = useState('');
  const [crmv, setCrmv] = useState('');
  const [emitterPhone, setEmitterPhone] = useState('');
  const [emitterAddress, setEmitterAddress] = useState('');
  const [emitterCity, setEmitterCity] = useState('');
  const [emitterState, setEmitterState] = useState('');
  const [prescription, setPrescription] = useState('');

  // ── Efeitos ────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      loadRecords();
      loadPetAndOwner();
    }
  }, [open, petId]);
  useEffect(() => {
    if (!open) setReceiptType(null);
  }, [open]);

  const loadPetAndOwner = async () => {
    const { data: petData } = await supabase
      .from('pets')
      .select('breed, age, type, user_id')
      .eq('id', petId)
      .single();

    if (petData) {
      const pd = petData as PetDetails;
      setPetDetails(pd);
      setPetBreed(pd.breed || '');
      setPetAge(pd.age || '');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone, address')
        .eq('user_id', pd.user_id)
        .single();

      if (profileData) {
        setTutorName(profileData.full_name || '');
        setTutorPhone(profileData.phone || '');
        setTutorAddress((profileData as Record<string, unknown>).address as string || '');
      }
    }
  };

  const loadRecords = async () => {
    const { data } = await supabase
      .from('pet_prescriptions')
      .select('*')
      .eq('pet_id', petId)
      .order('prescription_date', { ascending: false });
    if (data) setRecords(data);
  };

  // ── Salvar Receituário Simples ─────────────────────────────────
  const handleSaveSimples = async () => {
    if (!simplesPrescrição || !prescriptionDate) {
      toast({ title: 'Erro', description: 'Prescrição e data são obrigatórios', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user?.id) {
      toast({ title: 'Erro', description: 'Não foi possível obter dados do usuário.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const extraNotes = JSON.stringify({
      __type: 'simples',
      clinicName,
      crmv: simpleCrmv,
      tutorName,
      tutorAddress,
      tutorPhone,
      petBreed,
      petAge,
      petSex,
      prescription: simplesPrescrição,
    } satisfies StoredSimples);

    const { error } = await supabase.from('pet_prescriptions').insert({
      pet_id: petId,
      user_id: userData.user.id,
      medication_name: 'Receita Simples',
      dosage: null,
      frequency: null,
      duration: null,
      prescription_date: prescriptionDate,
      veterinarian: veterinarian || null,
      notes: extraNotes,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logPetAdminHistory({
        petId,
        module: 'receita',
        action: 'create',
        title: 'Receituário Simples',
        details: { tipo: 'simples', veterinario: veterinarian, data: prescriptionDate },
        sourceTable: 'pet_prescriptions',
      });
      setHistoryRefresh((p) => p + 1);
      onSuccess?.();
      toast({ title: 'Sucesso', description: 'Receita salva com sucesso!' });      loadRecords();
    }
    setLoading(false);
  };

  // ── Salvar Receituário Controlado ──────────────────────────────
  const handleSaveControlado = async () => {
    if (!emitterName || !crmv || !prescription || !prescriptionDate) {
      toast({ title: 'Erro', description: 'Nome do veterinário, CRMV, prescrição e data são obrigatórios', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user?.id) {
      toast({ title: 'Erro', description: 'Não foi possível obter dados do usuário.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const extraNotes = JSON.stringify({
      __type: 'controlado',
      emitterName,
      crmv,
      emitterPhone,
      emitterAddress,
      emitterCity,
      emitterState,
      prescription,
      tutorName,
      tutorAddress,
      petBreed,
      petAge,
      petSex,
    } satisfies StoredControlado);

    const { error } = await supabase.from('pet_prescriptions').insert({
      pet_id: petId,
      user_id: userData.user.id,
      medication_name: 'Receita de Controle Especial',
      dosage: null,
      frequency: null,
      duration: null,
      prescription_date: prescriptionDate,
      veterinarian: emitterName,
      notes: extraNotes,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logPetAdminHistory({
        petId,
        module: 'receita',
        action: 'create',
        title: 'Receituário de Controle Especial',
        details: { tipo: 'controlado', veterinario: emitterName, crmv, data: prescriptionDate },
        sourceTable: 'pet_prescriptions',
      });
      setHistoryRefresh((p) => p + 1);
      onSuccess?.();
      toast({ title: 'Sucesso', description: 'Receita controlada salva com sucesso!' });
      loadRecords();
    }
    setLoading(false);
  };

  // ── Excluir ────────────────────────────────────────────────────
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
      setHistoryRefresh((p) => p + 1);
      onSuccess?.();      toast({ title: 'Sucesso', description: 'Receita excluída' });
      loadRecords();
    }
  };

  // ── Abrir preview da receita salva ────────────────────────────
  const handleViewRecord = (record: Prescription) => {
    const parsed = parseNotes(record.notes);
    const species = speciesLabel(petDetails?.type || '');

    if (!parsed) {
      toast({ title: 'Aviso', description: 'Dados insuficientes para visualizar esta receita.', variant: 'destructive' });
      return;
    }

    let html = '';
    if (parsed.__type === 'simples') {
      html = buildReceitaSimplesPdfHtml({
        petName,
        petSpecies: species,
        petBreed: parsed.petBreed,
        petAge: parsed.petAge,
        petSex: parsed.petSex,
        ownerName: parsed.tutorName,
        ownerAddress: parsed.tutorAddress,
        ownerPhone: parsed.tutorPhone,
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        veterinarian: record.veterinarian || '',
        crmv: parsed.crmv,
        clinicName: parsed.clinicName,
        notes: parsed.prescription,
        prescriptionDate: record.prescription_date,
      });
      setPreviewTitle('Receituário Simples');
    } else {
      html = buildReceitaControladaPdfHtml({
        petName,
        petSpecies: species,
        petBreed: parsed.petBreed,
        petAge: parsed.petAge,
        petSex: parsed.petSex,
        ownerName: parsed.tutorName,
        ownerAddress: parsed.tutorAddress,
        emitterName: parsed.emitterName,
        crmv: parsed.crmv,
        emitterPhone: parsed.emitterPhone,
        emitterAddress: parsed.emitterAddress,
        emitterCity: parsed.emitterCity,
        emitterState: parsed.emitterState,
        prescription: parsed.prescription,
        prescriptionDate: record.prescription_date,
      });
      setPreviewTitle('Receituário de Controle Especial');
    }
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  // ── Preview + Imprimir ────────────────────────────────────────
  const handleExportSimplesPdf = () => {
    const html = buildReceitaSimplesPdfHtml({
      petName,
      petSpecies: speciesLabel(petDetails?.type || ''),
      petBreed,
      petAge,
      petSex,
      ownerName: tutorName,
      ownerAddress: tutorAddress,
      ownerPhone: tutorPhone,
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      veterinarian,
      crmv: simpleCrmv,
      clinicName,
      notes: simplesPrescrição,
      prescriptionDate,
    });
    setPreviewTitle('Receituário Simples');
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  const handleExportControladoPdf = () => {
    const html = buildReceitaControladaPdfHtml({
      petName,
      petSpecies: speciesLabel(petDetails?.type || ''),
      petBreed,
      petAge,
      petSex,
      ownerName: tutorName,
      ownerAddress: tutorAddress,
      emitterName,
      crmv,
      emitterPhone,
      emitterAddress,
      emitterCity,
      emitterState,
      prescription,
      prescriptionDate,
    });
    setPreviewTitle('Receituário de Controle Especial');
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  // ── Tipo de receita no histórico ───────────────────────────────
  const getReceiptTypeLabel = (record: Prescription): 'Simples' | 'Controlado' => {
    const parsed = parseNotes(record.notes);
    return parsed?.__type === 'controlado' ? 'Controlado' : 'Simples';
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <PageDialogContent className="p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={receiptType ? () => setReceiptType(null) : (onBack || onClose)}
            >              <ArrowLeft size={16} />
            </Button>
            <ClipboardList className="h-5 w-5" />
            {receiptType === 'simples'
              ? `Receituário Simples — ${petName}`
              : receiptType === 'controlado'
              ? `Receituário Controlado — ${petName}`
              : `Receitas — ${petName}`}
          </DialogTitle>
        </DialogHeader>

        {/* ── Tela de seleção ─────────────────────────────────── */}
        {receiptType === null && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() => setReceiptType('simples')}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                  <ScrollText className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-base text-slate-800 dark:text-foreground">RECEITUÁRIO SIMPLES</p>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1">Prescrição comum de medicamentos</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </button>
              <button
                onClick={() => setReceiptType('controlado')}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                  <ShieldAlert className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-base text-slate-800 dark:text-foreground">RECEITUÁRIO CONTROLADO</p>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1">Controle especial — 2 vias (Farmácia / Paciente)</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
              </button>
            </div>

            {/* Histórico */}
            <div>
              <h3 className="font-semibold mb-3">Histórico de Receitas</h3>
              <div className="space-y-3">
                {records.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma receita registrada</p>
                ) : (
                  records.map((record) => {
                    const typeLabel = getReceiptTypeLabel(record);
                    return (
                      <div
                        key={record.id}
                        className="p-4 bg-card border rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => handleViewRecord(record)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleViewRecord(record)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Pill className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold truncate">{record.medication_name}</h4>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(record.prescription_date), 'dd/MM/yyyy')}
                                </p>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  typeLabel === 'Controlado'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                }`}>
                                  {typeLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <Eye size={12} /> visualizar
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {record.dosage && (
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
                        )}
                        {record.veterinarian && (
                          <p className="text-xs text-muted-foreground mt-2">Veterinário: {record.veterinarian}</p>
                        )}
                      </div>
                    );
                  })
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
        )}

        {/* ── Formulário: Receituário Simples ──────────────────── */}
        {receiptType === 'simples' && (
          <div className="space-y-5">
            {/* Dados da Clínica / Veterinário */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
              <h3 className="text-sm font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wide">Dados da Clínica / Veterinário</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Nome da Clínica / Hospital</Label>
                  <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="AgendaVet" spellCheck={false} />
                </div>
                <div>
                  <Label>Veterinário Responsável</Label>
                  <Input value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} placeholder="Nome do veterinário" spellCheck={false} />
                </div>
                <div>
                  <Label>CRMV</Label>
                  <Input value={simpleCrmv} onChange={(e) => setSimpleCrmv(e.target.value)} placeholder="Ex: 12345/SP" />
                </div>
              </div>
            </div>

            {/* Dados do Paciente */}
            <div className="p-4 bg-muted/50 border rounded-lg space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Dados do Paciente</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tutor (Proprietário)</Label>
                  <Input value={tutorName} onChange={(e) => setTutorName(e.target.value)} placeholder="Nome do tutor" spellCheck={false} />
                </div>
                <div>
                  <Label>Telefone do Tutor</Label>
                  <Input value={tutorPhone} onChange={(e) => setTutorPhone(e.target.value)} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div>
                <Label>Endereço do Tutor</Label>
                <Input value={tutorAddress} onChange={(e) => setTutorAddress(e.target.value)} placeholder="Rua, Nº, Bairro, Cidade" spellCheck={false} />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Animal</Label>
                  <Input value={petName} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Espécie</Label>
                  <Input value={speciesLabel(petDetails?.type || '')} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Raça</Label>
                  <Input value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder="Raça" spellCheck={false} />
                </div>
                <div>
                  <Label>Idade</Label>
                  <Input value={petAge} onChange={(e) => setPetAge(e.target.value)} placeholder="Ex: 3 anos" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Sexo</Label>
                  <select value={petSex} onChange={(e) => setPetSex(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Selecione</option>
                    <option value="M">Macho</option>
                    <option value="F">Fêmea</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Prescrição */}
            <div className="p-4 bg-muted/50 border rounded-lg space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Prescrição</h3>
              <div>
                <Label>Prescrição *</Label>
                <RichTextEditor
                  value={simplesPrescrição}
                  onChange={setSimplesPrescrição}
                  placeholder="Descreva o(s) medicamento(s), dosagem, posologia e instruções de uso..."
                  minHeight="140px"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data da Receita *</Label>
                  <Input type="date" value={prescriptionDate} onChange={(e) => setPrescriptionDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <Button onClick={handleSaveSimples} disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Receita'}
              </Button>
              <Button variant="outline" onClick={handleExportSimplesPdf}>
                <FileDown className="h-4 w-4 mr-2" />
                Imprimir PDF (2 vias)
              </Button>
            </div>
          </div>
        )}

        {/* ── Formulário: Receituário Controlado ──────────────── */}
        {receiptType === 'controlado' && (
          <div className="space-y-5">
            {/* Identificação do Emitente */}
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg space-y-3">
              <h3 className="text-sm font-bold text-red-800 dark:text-red-400 uppercase tracking-wide">
                Identificação do Emitente
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome do Veterinário *</Label>
                  <Input value={emitterName} onChange={(e) => setEmitterName(e.target.value)} placeholder="Nome completo do veterinário" spellCheck={false} />
                </div>
                <div>
                  <Label>CRMV *</Label>
                  <Input value={crmv} onChange={(e) => setCrmv(e.target.value)} placeholder="Ex: 12345/SP" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefone</Label>
                  <Input value={emitterPhone} onChange={(e) => setEmitterPhone(e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input value={emitterAddress} onChange={(e) => setEmitterAddress(e.target.value)} placeholder="Rua, Nº, Bairro" spellCheck={false} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>Cidade</Label>
                  <Input value={emitterCity} onChange={(e) => setEmitterCity(e.target.value)} placeholder="Cidade" spellCheck={false} />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input value={emitterState} onChange={(e) => setEmitterState(e.target.value)} placeholder="SP" maxLength={2} />
                </div>
              </div>
            </div>

            {/* Dados do Paciente */}
            <div className="p-4 bg-muted/50 border rounded-lg space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Dados do Paciente</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tutor (Proprietário)</Label>
                  <Input value={tutorName} onChange={(e) => setTutorName(e.target.value)} placeholder="Nome do tutor" spellCheck={false} />
                </div>
                <div>
                  <Label>Endereço do Tutor</Label>
                  <Input value={tutorAddress} onChange={(e) => setTutorAddress(e.target.value)} placeholder="Endereço completo" spellCheck={false} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Animal</Label>
                  <Input value={petName} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Espécie</Label>
                  <Input value={speciesLabel(petDetails?.type || '')} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Raça</Label>
                  <Input value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder="Raça" spellCheck={false} />
                </div>
                <div>
                  <Label>Idade</Label>
                  <Input value={petAge} onChange={(e) => setPetAge(e.target.value)} placeholder="Ex: 3 anos" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Sexo</Label>
                  <select value={petSex} onChange={(e) => setPetSex(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Selecione</option>
                    <option value="M">Macho</option>
                    <option value="F">Fêmea</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Prescrição e Data */}
            <div className="p-4 bg-muted/50 border rounded-lg space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Prescrição</h3>
              <div>
                <Label>Prescrição *</Label>
                <RichTextEditor
                  value={prescription}
                  onChange={setPrescription}
                  placeholder="Descreva o(s) medicamento(s), dosagem, posologia e instruções completas..."
                  minHeight="140px"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data da Receita *</Label>
                  <Input type="date" value={prescriptionDate} onChange={(e) => setPrescriptionDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <Button onClick={handleSaveControlado} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Receita Controlada'}
              </Button>
              <Button variant="outline" onClick={handleExportControladoPdf}>
                <FileDown className="h-4 w-4 mr-2" />
                Imprimir PDF (2 vias)
              </Button>
            </div>
          </div>
        )}
      </PageDialogContent>

      {/* ── Dialog de preview / impressão ─────────────────────── */}
      <ReceitaPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        html={previewHtml}
        title={previewTitle}
      />    </Dialog>
  );
};
