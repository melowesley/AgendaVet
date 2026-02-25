import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, PageDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ScissorsLineDashed, Save, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { logPetAdminHistory } from './petAdminHistory';
import { PetAdminHistorySection } from './PetAdminHistorySection';

interface BanhoTosaDialogProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
  petId: string;
  petName: string;
}

const SERVICOS_BANHO_TOSA = [
  'Banho',
  'Tosa higiênica',
  'Tosa completa',
  'Tosa na máquina',
  'Tosa na tesoura',
  'Hidratação',
  'Desembaraçamento',
  'Limpeza de ouvidos',
  'Corte de unhas',
  'Escovação dental',
  'Perfume',
];

export const BanhoTosaDialog = ({ open, onClose, onBack, onSuccess, petId, petName }: BanhoTosaDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [serviceDate, setServiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [pelagem, setPelagem] = useState('');
  const [temperamento, setTemperamento] = useState('');
  const [observacoesPele, setObservacoesPele] = useState('');
  const [notes, setNotes] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const handleSave = async () => {
    if (selectedServices.length === 0) {
      toast({ title: 'Erro', description: 'Selecione ao menos um serviço', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user?.id) {
      toast({ title: 'Erro', description: 'Não foi possível obter dados do usuário.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const title = `Banho e Tosa: ${selectedServices.join(', ')}`;

    await logPetAdminHistory({
      petId,
      module: 'banho_tosa',
      action: 'create',
      title,
      details: {
        servicos: selectedServices,
        data: serviceDate,
        pelagem: pelagem || '—',
        temperamento: temperamento || '—',
        observacoes_pele: observacoesPele || '—',
        observacoes: notes || '—',
        responsavel: responsavel || '—',
      },
    });

    // Também salvar como observação para ter registro na tabela
    await supabase.from('pet_observations').insert({
      pet_id: petId,
      user_id: userData.user.id,
      title: 'Ficha de Banho e Tosa',
      observation: `Serviços: ${selectedServices.join(', ')}${pelagem ? `\nPelagem: ${pelagem}` : ''}${temperamento ? `\nTemperamento: ${temperamento}` : ''}${observacoesPele ? `\nObs. Pele: ${observacoesPele}` : ''}${notes ? `\nObs: ${notes}` : ''}`,
      observation_date: serviceDate,
      category: 'banho_tosa',
    });

    setHistoryRefresh(prev => prev + 1);
    onSuccess?.();
    toast({ title: 'Sucesso', description: 'Banho e Tosa registrado!' });
    resetForm();
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedServices([]);
    setPelagem('');
    setTemperamento('');
    setObservacoesPele('');
    setNotes('');
    setResponsavel('');
    setServiceDate(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <PageDialogContent className="p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack || onClose}>
              <ArrowLeft size={16} />
            </Button>
            <ScissorsLineDashed className="h-5 w-5" />
            Banho e Tosa - {petName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bt-date">Data *</Label>
                <Input id="bt-date" type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="bt-resp">Responsável</Label>
                <Input id="bt-resp" value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Nome do tosador/banhista" spellCheck lang="pt-BR" />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Serviços Realizados *</Label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICOS_BANHO_TOSA.map(service => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={`svc-${service}`}
                      checked={selectedServices.includes(service)}
                      onCheckedChange={() => toggleService(service)}
                    />
                    <label htmlFor={`svc-${service}`} className="text-sm cursor-pointer">{service}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bt-pelagem">Condição da Pelagem</Label>
                <Select value={pelagem} onValueChange={setPelagem}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="seca">Seca</SelectItem>
                    <SelectItem value="oleosa">Oleosa</SelectItem>
                    <SelectItem value="embaracada">Embaraçada</SelectItem>
                    <SelectItem value="opaca">Opaca</SelectItem>
                    <SelectItem value="brilhante">Brilhante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bt-temp">Temperamento</Label>
                <Select value={temperamento} onValueChange={setTemperamento}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calmo">Calmo</SelectItem>
                    <SelectItem value="agitado">Agitado</SelectItem>
                    <SelectItem value="agressivo">Agressivo</SelectItem>
                    <SelectItem value="medroso">Medroso</SelectItem>
                    <SelectItem value="cooperativo">Cooperativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="bt-pele">Observações sobre a Pele</Label>
              <Textarea id="bt-pele" value={observacoesPele} onChange={e => setObservacoesPele(e.target.value)} placeholder="Lesões, irritações, parasitas..." rows={2} spellCheck lang="pt-BR" />
            </div>

            <div>
              <Label htmlFor="bt-notes">Observações Gerais</Label>
              <Textarea id="bt-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações adicionais..." rows={2} spellCheck lang="pt-BR" />
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Registrar Banho e Tosa'}
            </Button>
          </div>

          <PetAdminHistorySection petId={petId} module="banho_tosa" title="Histórico de Banho e Tosa" refreshKey={historyRefresh} />
        </div>
      </PageDialogContent>
    </Dialog>
  );
};
