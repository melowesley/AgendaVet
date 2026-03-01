import {
  Dialog,
  PageDialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Stethoscope, Calendar, Clock } from 'lucide-react';
import type { TimelineEntry } from '@/hooks/usePetTimeline';
import { getModuleLabel } from '@/hooks/usePetTimeline';

/**
 * Mapeamento de chaves técnicas para rótulos legíveis em PT-BR.
 * Cobertura: todos os módulos do sistema (consulta, documento, vacina, exame,
 * peso, patologia, observações, receita, internação, cirurgia, retorno,
 * avaliação cirúrgica, diagnóstico, banho/tosa, óbito, fotos, vídeo).
 */
const DETAIL_LABELS: Record<string, string> = {
  // ── Genéricos ──────────────────────────────────────────────────────────────
  motivo: 'Motivo',
  reason: 'Motivo',
  data: 'Data',
  status: 'Status',
  observacoes: 'Observações',
  notes: 'Observações',
  descricao: 'Descrição',
  description: 'Descrição',
  veterinario: 'Veterinário',
  veterinarian: 'Veterinário',
  responsavel: 'Responsável',

  // ── Consulta / Anamnese ────────────────────────────────────────────────────
  queixa_principal: 'Queixa Principal',
  medicamentos: 'Medicamentos em Uso',
  tipo_atendimento: 'Tipo de Atendimento',

  // ── Peso ───────────────────────────────────────────────────────────────────
  peso_kg: 'Peso (kg)',
  peso_atual: 'Peso Atual',

  // ── Exame ──────────────────────────────────────────────────────────────────
  tipo_exame: 'Tipo de Exame',
  data_exame: 'Data do Exame',
  resultado: 'Resultado',
  arquivo: 'Arquivo',

  // ── Vacina ─────────────────────────────────────────────────────────────────
  nome_vacina: 'Nome da Vacina',
  data_aplicacao: 'Data de Aplicação',
  proxima_dose: 'Próxima Dose',
  lote: 'Lote',

  // ── Receita ────────────────────────────────────────────────────────────────
  medicamento: 'Medicamento',
  dosagem: 'Dosagem',
  frequencia: 'Frequência',
  duracao: 'Duração',
  data_prescricao: 'Data da Prescrição',

  // ── Documento ─────────────────────────────────────────────────────────────
  titulo: 'Título',
  tipo_documento: 'Tipo de Documento',

  // ── Patologia ─────────────────────────────────────────────────────────────
  nome_patologia: 'Patologia',
  data_diagnostico: 'Data do Diagnóstico',
  diagnostico: 'Diagnóstico',
  tratamento: 'Tratamento',

  // ── Internação ────────────────────────────────────────────────────────────
  data_entrada: 'Data de Entrada',
  data_saida: 'Data de Alta',
  motivo_internacao: 'Motivo da Internação',

  // ── Cirurgia / Avaliação Cirúrgica ────────────────────────────────────────
  tipo_cirurgia: 'Tipo de Cirurgia',
  anestesia: 'Anestesia',
  complicacoes: 'Complicações',
  risco: 'Risco Anestésico',

  // ── Retorno ───────────────────────────────────────────────────────────────
  motivo_retorno: 'Motivo do Retorno',
  evolucao_quadro: 'Evolução do Quadro',
  descricao_evolucao: 'Descrição da Evolução',
  temperatura: 'Temperatura',
  fc: 'FC (bpm)',
  fr: 'FR (mrpm)',
  exame_fisico_resumido: 'Exame Físico Resumido',
  exames_complementares: 'Exames Complementares',
  conduta: 'Conduta',
  proximo_retorno: 'Próximo Retorno',

  // ── Diagnóstico ───────────────────────────────────────────────────────────
  nome_diagnostico: 'Diagnóstico',
  cid: 'CID',
  gravidade: 'Gravidade',

  // ── Banho e Tosa ──────────────────────────────────────────────────────────
  servicos: 'Serviços',
  pelagem: 'Pelagem',
  temperamento: 'Temperamento',
  local: 'Local',

  // ── Óbito ─────────────────────────────────────────────────────────────────
  data_obito: 'Data do Óbito',
  tipo_causa: 'Tipo de Causa',
  causa: 'Causa',

  // ── Fotos / Vídeo ─────────────────────────────────────────────────────────
  url: 'URL',
  tags: 'Tags',
};

const formatDetailValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const getDetailLabel = (key: string): string =>
  DETAIL_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

interface HistoryEntryDetailDialogProps {
  open: boolean;
  onClose: () => void;
  entry: TimelineEntry | null;
}

export function HistoryEntryDetailDialog({
  open,
  onClose,
  entry,
}: HistoryEntryDetailDialogProps) {
  if (!entry) return null;

  const details = entry.details as Record<string, unknown> | null;
  const detailEntries = details
    ? Object.entries(details).filter(
        ([key, value]) =>
          value !== null &&
          value !== undefined &&
          value !== '' &&
          !['appointment_id', 'source_id', 'source_table'].includes(key)
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <PageDialogContent className="p-6 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-semibold">{entry.title}</span>
            {entry.module && (
              <Badge variant="secondary" className="text-xs">
                {getModuleLabel(entry.module)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Data, Hora e Status - Sempre visível */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar size={14} />
              {format(new Date(entry.date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock size={14} />
              {entry.time}h
            </span>
            {entry.status && (
              <Badge 
                variant={
                  entry.status === 'completed' ? 'default' :
                  entry.status === 'confirmed' ? 'default' :
                  entry.status === 'pending' ? 'secondary' :
                  entry.status === 'cancelled' ? 'destructive' :
                  'outline'
                } 
                className="text-xs"
              >
                {entry.status === 'pending'
                  ? 'Pendente'
                  : entry.status === 'confirmed'
                    ? 'Confirmado'
                    : entry.status === 'completed'
                      ? 'Concluído'
                      : entry.status === 'cancelled'
                        ? 'Cancelado'
                        : entry.status}
              </Badge>
            )}
          </div>

          {/* Veterinário/Responsável - Se houver */}
          {entry.veterinarian && (
            <div className="flex items-center gap-2 text-sm p-3 bg-muted/30 rounded-lg">
              <Stethoscope size={16} className="text-primary shrink-0" />
              <span className="text-foreground">
                <strong className="font-medium">Responsável:</strong>{' '}
                <span className="text-muted-foreground">{entry.veterinarian}</span>
              </span>
            </div>
          )}

          {/* Descrição - Se houver */}
          {entry.description && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Descrição</p>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap border border-border/50">
                {entry.description}
              </p>
            </div>
          )}

          {/* Detalhes do procedimento - Se houver */}
          {detailEntries.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Detalhes do procedimento</p>
              <div className="space-y-2.5 bg-muted/30 p-4 rounded-lg border border-border/50">
                {detailEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-start gap-1 text-sm"
                  >
                    <span className="font-semibold text-foreground min-w-[140px] shrink-0">
                      {getDetailLabel(key)}:
                    </span>
                    <span className="text-muted-foreground break-words flex-1">
                      {formatDetailValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensagem quando não há detalhes */}
          {!entry.description && detailEntries.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground italic bg-muted/30 rounded-lg border border-border/50">
              Nenhum detalhe adicional registrado para este procedimento.
            </div>
          )}
        </div>
      </PageDialogContent>
    </Dialog>
  );
}
