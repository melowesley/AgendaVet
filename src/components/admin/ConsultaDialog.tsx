import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, PageDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, FileDown } from 'lucide-react';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { useToast } from '@/hooks/use-toast';
import { TutorInfoSection } from './detail/TutorInfoSection';
import { AnamneseTab } from './detail/AnamneseTab';
import { ManejoTab } from './detail/ManejoTab';
import { ExameFisicoTab } from './detail/ExameFisicoTab';
import { AnamnesisData, EMPTY_ANAMNESIS } from './anamnesisTypes';
import { exportAppointmentPdf } from './exportAppointmentPdf';
import { PetAdminHistorySection } from './PetAdminHistorySection';
import { logPetAdminHistory } from './petAdminHistory';
import { generateAnamnesisSummary } from '@/utils/anamnesisSummary';

interface ConsultaDialogProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onSuccess?: () => void;
  request: AppointmentRequest;
}

export const ConsultaDialog = ({ open, onClose, onBack, onSuccess, request }: ConsultaDialogProps) => {
  const { toast } = useToast();
  const date = request.scheduled_date || request.preferred_date;
  const time = request.scheduled_time || request.preferred_time;
  const [anamnesis, setAnamnesis] = useState<AnamnesisData>(EMPTY_ANAMNESIS);
  const [anamnesisId, setAnamnesisId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    if (open && request.id) fetchAnamnesis();
  }, [open, request.id]);

  const fetchAnamnesis = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('anamnesis')
      .select('*')
      .eq('appointment_request_id', request.id)
      .maybeSingle();

    if (data) {
      setAnamnesisId(data.id);
      setAnamnesis({
        queixa_principal: data.queixa_principal || '',
        medicamentos: data.medicamentos || '',
        sistema_gastrintestinal: Array.isArray(data.sistema_gastrintestinal) ? data.sistema_gastrintestinal as string[] : [],
        sistema_genitourinario: Array.isArray(data.sistema_genitourinario) ? data.sistema_genitourinario as string[] : [],
        'sistema_cardiorespiratório': Array.isArray(data.sistema_cardiorespiratório) ? data.sistema_cardiorespiratório as string[] : [],
        sistema_neurologico: Array.isArray(data.sistema_neurologico) ? data.sistema_neurologico as string[] : [],
        sistema_musculoesqueletico: Array.isArray(data.sistema_musculoesqueletico) ? data.sistema_musculoesqueletico as string[] : [],
        sistema_ototegumentar: Array.isArray(data.sistema_ototegumentar) ? data.sistema_ototegumentar as string[] : [],
        sistema_ototegumentar_obs: data.sistema_ototegumentar_obs || '',
        alimentacao: Array.isArray(data.alimentacao) ? data.alimentacao as string[] : [],
        vacinacao: Array.isArray(data.vacinacao) ? data.vacinacao as string[] : [],
        ambiente: Array.isArray(data.ambiente) ? data.ambiente as string[] : [],
        comportamento: Array.isArray(data.comportamento) ? data.comportamento as string[] : [],
        ectoparasitas: (data.ectoparasitas && typeof data.ectoparasitas === 'object' && !Array.isArray(data.ectoparasitas)) ? data.ectoparasitas as Record<string, unknown> : {},
        vermifugo: data.vermifugo || '',
        banho: (data.banho && typeof data.banho === 'object' && !Array.isArray(data.banho)) ? data.banho as Record<string, unknown> : {},
        acesso_rua: (data.acesso_rua && typeof data.acesso_rua === 'object' && !Array.isArray(data.acesso_rua)) ? data.acesso_rua as Record<string, unknown> : {},
        contactantes: (data.contactantes && typeof data.contactantes === 'object' && !Array.isArray(data.contactantes)) ? data.contactantes as Record<string, unknown> : {},
        mucosas: Array.isArray(data.mucosas) ? data.mucosas as string[] : [],
        linfonodos: Array.isArray(data.linfonodos) ? data.linfonodos as string[] : [],
        hidratacao: data.hidratacao || '',
        pulso: data.pulso || '',
        temperatura: data.temperatura || '',
        tpc: data.tpc || '',
        fc: data.fc || '',
        fr: data.fr || '',
        campos_pulmonares: data.campos_pulmonares || '',
        bulhas_cardiacas: data.bulhas_cardiacas || '',
        ritmo_cardiaco: data.ritmo_cardiaco || '',
        palpacao_abdominal: data.palpacao_abdominal || '',
      });
    } else {
      setAnamnesisId(null);
      setAnamnesis(EMPTY_ANAMNESIS);
    }
    setLoading(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const payload = {
      queixa_principal: anamnesis.queixa_principal || null,
      medicamentos: anamnesis.medicamentos || null,
      sistema_gastrintestinal: anamnesis.sistema_gastrintestinal,
      sistema_genitourinario: anamnesis.sistema_genitourinario,
      'sistema_cardiorespiratório': anamnesis['sistema_cardiorespiratório'],
      sistema_neurologico: anamnesis.sistema_neurologico,
      sistema_musculoesqueletico: anamnesis.sistema_musculoesqueletico,
      sistema_ototegumentar: anamnesis.sistema_ototegumentar,
      sistema_ototegumentar_obs: anamnesis.sistema_ototegumentar_obs || null,
      alimentacao: anamnesis.alimentacao,
      vacinacao: anamnesis.vacinacao,
      ambiente: anamnesis.ambiente,
      comportamento: anamnesis.comportamento,
      ectoparasitas: anamnesis.ectoparasitas,
      vermifugo: anamnesis.vermifugo || null,
      banho: anamnesis.banho,
      acesso_rua: anamnesis.acesso_rua,
      contactantes: anamnesis.contactantes,
      mucosas: anamnesis.mucosas,
      linfonodos: anamnesis.linfonodos,
      hidratacao: anamnesis.hidratacao || null,
      pulso: anamnesis.pulso || null,
      temperatura: anamnesis.temperatura || null,
      tpc: anamnesis.tpc || null,
      fc: anamnesis.fc || null,
      fr: anamnesis.fr || null,
      campos_pulmonares: anamnesis.campos_pulmonares || null,
      bulhas_cardiacas: anamnesis.bulhas_cardiacas || null,
      ritmo_cardiaco: anamnesis.ritmo_cardiaco || null,
      palpacao_abdominal: anamnesis.palpacao_abdominal || null,
    };

    let error;
    if (anamnesisId) {
      ({ error } = await supabase.from('anamnesis').update(payload).eq('id', anamnesisId));
    } else {
      const { data: userData } = await supabase.auth.getUser();
      ({ error } = await supabase.from('anamnesis').insert({
        ...payload,
        appointment_request_id: request.id,
        pet_id: request.pet.id,
        user_id: userData.user?.id,
      }));
    }

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      // Mark appointment as completed
      await supabase
        .from('appointment_requests')
        .update({ status: 'completed', admin_notes: JSON.stringify({ tipo_atendimento: 'consulta', salvo_em: new Date().toISOString() }) })
        .eq('id', request.id);
      
      // Build a complete ordered summary following the form order
      const consultaSummary = generateAnamnesisSummary(anamnesis);

      await logPetAdminHistory({
        petId: request.pet.id,
        module: 'consulta',
        action: 'procedure',
        title: 'Ficha de Consulta',
        details: consultaSummary,
        sourceTable: 'anamnesis',
        sourceId: anamnesisId || request.id,
      });
      setHistoryRefresh((prev) => prev + 1);
      onSuccess?.();
      toast({ title: 'Ficha salva com sucesso!' });
      fetchAnamnesis();
    }
    setSaving(false);
  };

  const updateField = (field: keyof AnamnesisData, value: AnamnesisData[keyof AnamnesisData]) => {
    setAnamnesis(prev => ({ ...prev, [field]: value }));
  };

  const handleExportPdf = () => {
    exportAppointmentPdf({
      request,
      date,
      time,
      title: 'Ficha Clínica',
      sectionTitle: 'Anamnese e Exame Físico',
      sectionData: anamnesis,
      sectionType: 'anamnesis',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <PageDialogContent>
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
              <ArrowLeft size={16} />
            </Button>
            Consulta — Anamnese
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="">
          <div className="px-6 pb-6">
            <TutorInfoSection request={request} date={date} time={time} />
            <Separator className="my-4" />

            {loading ? (
              <div className="py-8 text-center text-muted-foreground animate-pulse">Carregando ficha...</div>
            ) : (
              <Tabs defaultValue="anamnese" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
                  <TabsTrigger value="manejo">Manejo</TabsTrigger>
                  <TabsTrigger value="exame">Exame Físico</TabsTrigger>
                </TabsList>

                <TabsContent value="anamnese">
                  <AnamneseTab anamnesis={anamnesis} onChange={updateField} />
                </TabsContent>
                <TabsContent value="manejo">
                  <ManejoTab anamnesis={anamnesis} onChange={updateField} />
                </TabsContent>
                <TabsContent value="exame">
                  <ExameFisicoTab anamnesis={anamnesis} onChange={updateField} />
                </TabsContent>
              </Tabs>
            )}

            {!loading && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="flex-1 gradient-primary text-primary-foreground"
                  size="lg"
                >
                  <Save size={18} className="mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Ficha Completa'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={handleExportPdf}
                >
                  <FileDown size={18} className="mr-2" />
                  Exportar PDF
                </Button>
              </div>
            )}

            <PetAdminHistorySection
              petId={request.pet.id}
              module="consulta"
              title="Histórico Detalhado da Consulta"
              refreshKey={historyRefresh}
            />
          </div>
        </ScrollArea>
      </PageDialogContent>
    </Dialog>
  );
};
