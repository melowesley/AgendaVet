import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [formData, setFormData] = useState({
    status: request.status,
    scheduled_date: request.scheduled_date || request.preferred_date,
    scheduled_time: request.scheduled_time || request.preferred_time,
    veterinarian: request.veterinarian || '',
    admin_notes: request.admin_notes || '',
    service_id: request.service_id || ''
  });

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
