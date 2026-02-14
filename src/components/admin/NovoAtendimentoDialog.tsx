import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { AttendanceTypeDialog } from './AttendanceTypeDialog';

interface Service {
  id: string;
  name: string;
}

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  user_id: string;
}

interface OwnerProfile {
  full_name: string | null;
  phone: string | null;
}

interface NovoAtendimentoDialogProps {
  open: boolean;
  onClose: () => void;
  pet: Pet;
  owner: OwnerProfile | null;
  onSaved?: () => void;
}

export const NovoAtendimentoDialog = ({ open, onClose, pet, owner, onSaved }: NovoAtendimentoDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [showAttendanceType, setShowAttendanceType] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<AppointmentRequest | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    preferred_date: today,
    preferred_time: '09:00',
    reason: '',
    service_id: '',
  });

  useEffect(() => {
    if (open) {
      (async () => {
        const { data } = await supabase
          .from('services')
          .select('id, name')
          .eq('active', true)
          .order('name');
        setServices((data as Service[]) || []);
      })();
    }
  }, [open]);

  const handleCreateAndStart = async () => {
    if (!form.reason.trim()) {
      toast({ title: 'Informe o motivo do atendimento', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { data: inserted, error } = await supabase
      .from('appointment_requests')
      .insert({
        user_id: pet.user_id,
        pet_id: pet.id,
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time,
        reason: form.reason.trim(),
        status: 'confirmed',
        scheduled_date: form.preferred_date,
        scheduled_time: form.preferred_time,
        service_id: form.service_id || null,
      })
      .select('id, reason, preferred_date, preferred_time, scheduled_date, scheduled_time, status, notes, admin_notes, veterinarian, created_at, service_id, user_id')
      .single();

    if (error) {
      toast({ title: 'Erro ao criar atendimento', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    const request: AppointmentRequest = {
      ...inserted,
      pet: { id: pet.id, name: pet.name, type: pet.type, breed: pet.breed },
      profile: owner ? { full_name: owner.full_name, phone: owner.phone } : { full_name: null, phone: null },
    };
    setCreatedRequest(request);
    setShowAttendanceType(true);
    onSaved?.();
    setSaving(false);
  };

  const handleCloseAttendance = () => {
    setShowAttendanceType(false);
    setCreatedRequest(null);
    onClose();
  };

  if (showAttendanceType && createdRequest) {
    return (
      <AttendanceTypeDialog
        open={true}
        onClose={handleCloseAttendance}
        request={createdRequest}
      />
    );
  }

  return (
    <Dialog open={open && !showAttendanceType} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Atendimento — {pet.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={form.preferred_date}
              onChange={(e) => setForm((p) => ({ ...p, preferred_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Horário</Label>
            <Input
              type="time"
              value={form.preferred_time}
              onChange={(e) => setForm((p) => ({ ...p, preferred_time: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Serviço (opcional)</Label>
            <Select value={form.service_id || 'none'} onValueChange={(v) => setForm((p) => ({ ...p, service_id: v === 'none' ? '' : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Motivo / Queixa</Label>
            <Input
              placeholder="Motivo do atendimento"
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCreateAndStart} disabled={saving}>
            {saving ? 'Criando...' : 'Criar e iniciar atendimento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
