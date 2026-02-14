import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History } from 'lucide-react';

interface PetAdminHistoryRow {
  id: string;
  module: string;
  action: string;
  title: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface PetAdminHistorySectionProps {
  petId: string;
  module: string;
  title?: string;
  refreshKey?: number;
}

const actionLabel = (action: string) => {
  if (action === 'create') return 'Criado';
  if (action === 'update') return 'Atualizado';
  if (action === 'delete') return 'Excluído';
  if (action === 'procedure') return 'Procedimento';
  return action;
};

export const PetAdminHistorySection = ({ petId, module, title = 'Histórico Detalhado', refreshKey = 0 }: PetAdminHistorySectionProps) => {
  const [history, setHistory] = useState<PetAdminHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('pet_admin_history')
        .select('id, module, action, title, details, created_at')
        .eq('pet_id', petId)
        .eq('module', module)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setHistory(data as PetAdminHistoryRow[]);
      }
      setLoading(false);
    };

    if (petId) {
      loadHistory();
    }
  }, [petId, module, refreshKey]);

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <History className="h-4 w-4" />
        {title}
      </h3>
      <ScrollArea className="max-h-64 pr-2">
        {loading ? (
          <div className="text-sm text-muted-foreground py-4">Carregando histórico...</div>
        ) : history.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">Nenhuma ação registrada ainda.</div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-3 bg-card">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-medium">{entry.title}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {actionLabel(entry.action)}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">
                  {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                {entry.details && (
                  <div className="space-y-1">
                    {Object.entries(entry.details).map(([key, value]) => (
                      <p key={key} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{key.replace(/_/g, ' ')}:</span>{' '}
                        {Array.isArray(value)
                          ? value.join(', ')
                          : typeof value === 'object' && value !== null
                            ? JSON.stringify(value)
                            : String(value)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
