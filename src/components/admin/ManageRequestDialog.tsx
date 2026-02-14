import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useScheduleOptimizer } from '@/hooks/useScheduleOptimizer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sparkles, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: number;
}

interface ManageRequestDialogProps {
  request: {
    id: string;
    reason: string;
    preferred_date: string;
    preferred_time: string;
    status: string;
    notes: string | null;
    admin_notes: string | null;
    scheduled_date: string | null;
    scheduled_time: string | null;
    veterinarian: string | null;
    service_id?: string | null;
    pet: {
      name: string;
      type: string;
      breed: string | null;
    };
    profile: {
      full_name: string | null;
      phone: string | null;
    };
  };
  open: boolean;
  onClose: () => void;
}

export const ManageRequestDialog = ({ request, open, onClose }: ManageRequestDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [formData, setFormData] = useState({
    status: request.status,
    scheduled_date: request.scheduled_date || request.preferred_date,
    scheduled_time: request.scheduled_time || request.preferred_time,
    veterinarian: request.veterinarian || '',
    admin_notes: request.admin_notes || '',
    service_id: request.service_id || ''
  });

  // Hook de encaixe inteligente — integra o scheduleOptimizer com o Supabase
  const {
    suggestions,
    loading: optimizerLoading,
    error: optimizerError,
    getSuggestions,
    clearSuggestions,
  } = useScheduleOptimizer();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('id, name, price')
      .eq('active', true)
      .order('name');
    
    if (data) {
      setServices(data);
    }
  };

  /**
   * Aciona o algoritmo de encaixe inteligente.
   * Requer que o serviço e a data já estejam selecionados no formulário.
   */
  const handleSuggestSlots = async () => {
    if (!formData.service_id || !formData.scheduled_date) {
      toast({
        title: 'Selecione serviço e data',
        description: 'Para gerar sugestões, preencha o serviço e a data de agendamento.',
        variant: 'destructive',
      });
      return;
    }
    setShowOptimizer(true);
    await getSuggestions({
      serviceId: formData.service_id,
      targetDate: formData.scheduled_date,
      excludeRequestId: request.id,
      preferences: {
        preferredDate: formData.scheduled_date,
        preferredVeterinarian: formData.veterinarian || undefined,
      },
    });
  };

  /**
   * Aplica o horário de uma sugestão diretamente no formulário.
   * O admin ainda pode ajustar antes de salvar.
   */
  const handleApplySuggestion = (datetime: string) => {
    // datetime vem no formato 'YYYY-MM-DDTHH:mm:00'
    const [datePart, timePart] = datetime.split('T');
    const time = timePart.slice(0, 5); // 'HH:mm'
    setFormData((prev) => ({
      ...prev,
      scheduled_date: datePart,
      scheduled_time: time,
    }));
    setShowOptimizer(false);
    clearSuggestions();
    toast({
      title: 'Horário aplicado',
      description: `Agendamento definido para ${format(new Date(datePart), 'dd/MM/yyyy', { locale: ptBR })} às ${time}.`,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('appointment_requests')
      .update({
        status: formData.status,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        veterinarian: formData.veterinarian || null,
        admin_notes: formData.admin_notes || null,
        service_id: formData.service_id || null
      })
      .eq('id', request.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a solicitação.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Solicitação atualizada com sucesso."
      });
      onClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Solicitação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold">Informações do Cliente</h4>
            <p><span className="text-muted-foreground">Nome:</span> {request.profile?.full_name || 'N/A'}</p>
            <p><span className="text-muted-foreground">Telefone:</span> {request.profile?.phone || 'N/A'}</p>
            <p><span className="text-muted-foreground">Pet:</span> {request.pet?.name} ({request.pet?.type} - {request.pet?.breed || 'SRD'})</p>
            <p><span className="text-muted-foreground">Motivo:</span> {request.reason}</p>
            <p><span className="text-muted-foreground">Data preferida:</span> {format(new Date(request.preferred_date), "dd/MM/yyyy", { locale: ptBR })} às {request.preferred_time}</p>
            {request.notes && (
              <p><span className="text-muted-foreground">Observações do cliente:</span> {request.notes}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select value={formData.service_id} onValueChange={(value) => setFormData({ ...formData, service_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - R$ {service.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Agendada</Label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Horário Agendado</Label>
              <Input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Veterinário</Label>
            <Input
              value={formData.veterinarian}
              onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
              placeholder="Nome do veterinário responsável"
            />
          </div>

          <div className="space-y-2">
            <Label>Notas Administrativas</Label>
            <Textarea
              value={formData.admin_notes}
              onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
              placeholder="Observações internas..."
              rows={3}
            />
          </div>

          {/* ── Painel de Encaixe Inteligente ──────────────────────────────── */}
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => {
                if (!showOptimizer) {
                  handleSuggestSlots();
                } else {
                  setShowOptimizer(false);
                  clearSuggestions();
                }
              }}
              className="w-full flex items-center justify-between px-4 py-3 bg-violet-50 hover:bg-violet-100 transition-colors text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-violet-700">
                <Sparkles className="h-4 w-4" />
                Encaixe Inteligente — sugerir melhores horários
              </span>
              {showOptimizer ? (
                <ChevronUp className="h-4 w-4 text-violet-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-violet-500" />
              )}
            </button>

            {showOptimizer && (
              <div className="p-4 space-y-3 bg-white">
                {/* Estado: carregando */}
                {optimizerLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando agenda e calculando melhores encaixes…
                  </div>
                )}

                {/* Estado: erro */}
                {optimizerError && !optimizerLoading && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {optimizerError}
                  </div>
                )}

                {/* Estado: sugestões disponíveis */}
                {suggestions && !optimizerLoading && (
                  <>
                    {suggestions.suggestions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum horário disponível encontrado para esta data.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Melhores sugestões de encaixe
                        </p>
                        {suggestions.suggestions.map((s, idx) => {
                          const [datePart, timePart] = s.datetime.split('T');
                          const time = timePart.slice(0, 5);
                          const dateFormatted = format(
                            new Date(datePart + 'T00:00:00'),
                            "dd/MM/yyyy",
                            { locale: ptBR },
                          );
                          return (
                            <div
                              key={idx}
                              className="flex items-start justify-between gap-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground">
                                    {dateFormatted} às {time}
                                  </span>
                                  {/* Badge de score */}
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                      s.efficiencyScore >= 80
                                        ? 'bg-green-100 text-green-700'
                                        : s.efficiencyScore >= 50
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    Score: {s.efficiencyScore}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                                  {s.reasoning}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="shrink-0 text-violet-700 border-violet-300 hover:bg-violet-50"
                                onClick={() => handleApplySuggestion(s.datetime)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Usar
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* Estado: aguardando acionamento (sem sugestões ainda) */}
                {!suggestions && !optimizerLoading && !optimizerError && (
                  <p className="text-xs text-muted-foreground">
                    Selecione um serviço e uma data, depois clique em "Encaixe Inteligente" para ver as sugestões.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
