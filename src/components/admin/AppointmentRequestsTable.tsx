import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sparkles, Eye, Check, X, Search, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ManageRequestDialog } from './ManageRequestDialog';
import { PetHistoryDialog } from './PetHistoryDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { AppointmentStatus, APPOINTMENT_STATUS } from '@/types/appointment';

interface AppointmentRequest {
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
  created_at: string;
  pet: {
    id: string;
    name: string;
    type: string;
    breed: string | null;
    age: string | null;
    weight: string | null;
  };
  profile: {
    full_name: string | null;
    phone: string | null;
  };
}

interface AppointmentRequestsTableProps {
  onUpdate: () => void;
}

export const AppointmentRequestsTable = ({ onUpdate }: AppointmentRequestsTableProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pet history
  const [historyPet, setHistoryPet] = useState<AppointmentRequest['pet'] | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointment_requests')
      .select(`
        *,
        pet:pets(id, name, type, breed, age, weight),
        profile:profiles!appointment_requests_user_id_fkey(full_name, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações.",
        variant: "destructive"
      });
    } else {
      setRequests(data as unknown as AppointmentRequest[]);
    }
    setLoading(false);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      if (!matchesStatus) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        req.profile?.full_name?.toLowerCase().includes(term) ||
        req.pet?.name?.toLowerCase().includes(term) ||
        req.reason?.toLowerCase().includes(term) ||
        req.profile?.phone?.includes(term)
      );
    });
  }, [requests, searchTerm, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('appointment_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o status.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: `Status atualizado para ${getStatusLabel(status)}.` });
      fetchRequests();
      onUpdate();
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING: return 'Pendente';
      case APPOINTMENT_STATUS.CONFIRMED: return 'Confirmado';
      case APPOINTMENT_STATUS.REMINDER_SENT: return 'Lembrete Enviado';
      case APPOINTMENT_STATUS.CHECKED_IN: return 'Check-in';
      case APPOINTMENT_STATUS.IN_PROGRESS: return 'Em Atendimento';
      case APPOINTMENT_STATUS.COMPLETED: return 'Concluído';
      case APPOINTMENT_STATUS.CANCELLED: return 'Cancelado';
      case APPOINTMENT_STATUS.NO_SHOW: return 'Não Compareceu';
      default: return status;
    }
  };

  const handleManage = (request: AppointmentRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRequest(null);
    fetchRequests();
    onUpdate();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, pet ou motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(APPOINTMENT_STATUS).map(([key, value]) => (
              <SelectItem key={value} value={value}>
                {getStatusLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma solicitação encontrada.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Pet</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data Preferida</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.profile?.full_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{request.profile?.phone || 'Sem telefone'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.pet?.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{request.pet?.type} - {request.pet?.breed || 'SRD'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                  <TableCell>
                    <div>
                      <p>{format(new Date(request.preferred_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                      <p className="text-sm text-muted-foreground">{request.preferred_time}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={request.status as AppointmentStatus} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleManage(request)} title="Gerenciar">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setHistoryPet(request.pet)} title="Histórico do pet">
                        <History className="h-4 w-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button size="sm" variant="default" onClick={() => updateStatus(request.id, 'confirmed')}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateStatus(request.id, 'cancelled')}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedRequest && (
        <ManageRequestDialog
          request={selectedRequest}
          open={dialogOpen}
          onClose={handleDialogClose}
        />
      )}

      {historyPet && (
        <PetHistoryDialog
          petId={historyPet.id}
          petInfo={historyPet}
          open={!!historyPet}
          onClose={() => setHistoryPet(null)}
        />
      )}
    </>
  );
};
