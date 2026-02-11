import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PawPrint, Calendar, Stethoscope, FileText } from 'lucide-react';

interface PetHistoryEntry {
  id: string;
  reason: string;
  status: string;
  preferred_date: string;
  preferred_time: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  veterinarian: string | null;
  admin_notes: string | null;
  notes: string | null;
  created_at: string;
  service: {
    name: string;
    price: number;
  } | null;
}

interface PetInfo {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
}

interface PetHistoryDialogProps {
  petId: string;
  petInfo: PetInfo;
  open: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  cancelled: 'destructive',
  completed: 'outline',
};

export const PetHistoryDialog = ({ petId, petInfo, open, onClose }: PetHistoryDialogProps) => {
  const [history, setHistory] = useState<PetHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && petId) {
      fetchHistory();
    }
  }, [open, petId]);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointment_requests')
      .select(`
        id, reason, status, preferred_date, preferred_time,
        scheduled_date, scheduled_time, veterinarian, admin_notes, notes, created_at,
        service:services(name, price)
      `)
      .eq('pet_id', petId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setHistory(data as unknown as PetHistoryEntry[]);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5" />
            Histórico — {petInfo.name}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
          <p><span className="text-muted-foreground">Tipo:</span> <span className="capitalize">{petInfo.type}</span></p>
          <p><span className="text-muted-foreground">Raça:</span> {petInfo.breed || 'SRD'}</p>
          {petInfo.age && <p><span className="text-muted-foreground">Idade:</span> {petInfo.age}</p>}
          {petInfo.weight && <p><span className="text-muted-foreground">Peso:</span> {petInfo.weight}</p>}
        </div>

        <ScrollArea className="max-h-[400px] pr-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma consulta encontrada.</p>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => {
                const date = entry.scheduled_date || entry.preferred_date;
                const time = entry.scheduled_time || entry.preferred_time;
                return (
                  <div key={entry.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{format(new Date(date), "dd/MM/yyyy", { locale: ptBR })}</span>
                        <span className="text-muted-foreground">às {time}</span>
                      </div>
                      <Badge variant={STATUS_VARIANTS[entry.status]}>
                        {STATUS_LABELS[entry.status] || entry.status}
                      </Badge>
                    </div>

                    <p className="text-sm"><span className="text-muted-foreground">Motivo:</span> {entry.reason}</p>

                    {entry.service && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Serviço:</span> {entry.service.name} — R$ {entry.service.price.toFixed(2)}
                      </p>
                    )}

                    {entry.veterinarian && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{entry.veterinarian}</span>
                      </div>
                    )}

                    {entry.admin_notes && (
                      <div className="flex items-start gap-1.5 text-sm">
                        <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{entry.admin_notes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
