import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, ChevronDown, ChevronUp, Printer } from 'lucide-react';
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

// Fields that are internal/technical and should be hidden from the user
const HIDDEN_FIELDS = new Set([
  'atendimento', 'salvo_em', 'pet_name', 'pet_id', 'user_id',
  'appointment_id', 'request_id', 'registro_id',
]);

// Values considered empty / not filled
const isEmptyValue = (v: unknown): boolean => {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === '' || s === '—' || s === '-' || s === 'nao' || s === 'não' || s === 'n/a';
  }
  if (Array.isArray(v)) return v.length === 0;
  return false;
};

// Try to format ISO date strings to Brazilian format
const tryFormatDate = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    try {
      const d = parseISO(value);
      if (isValid(d)) return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch { /* fallback */ }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    try {
      const d = parseISO(value);
      if (isValid(d)) return format(d, 'dd/MM/yyyy', { locale: ptBR });
    } catch { /* fallback */ }
  }
  return value;
};

// Format any value to a readable string
const formatValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    const filtered = value.filter((item) => item != null && String(item).trim() !== '');
    // Capitalize first letter of each item
    return filtered.length > 0 
      ? filtered.map(item => {
          const str = String(item);
          return str.charAt(0).toUpperCase() + str.slice(1);
        }).join(' · ') 
      : '';
  }
  if (typeof value === 'string') return tryFormatDate(value);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => !isEmptyValue(v))
      .map(([k, v]) => {
        const keyLabel = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const valStr = typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : String(v);
        return `${keyLabel}: ${valStr}`;
      });
    return entries.join(', ');
  }
  return String(value);
};

// Sort details entries according to form order (for modules with defined order)
const sortDetailsByOrder = (
  details: Record<string, unknown>,
  module: string
): Array<[string, unknown]> => {
  const entries = Object.entries(details);
  
  const fieldOrder = FIELD_ORDERS[module];
  if (fieldOrder) {
    // Create a map for quick lookup
    const orderMap = new Map(fieldOrder.map((key, index) => [key, index]));
    
    return entries.sort(([keyA], [keyB]) => {
      const orderA = orderMap.get(keyA) ?? Infinity;
      const orderB = orderMap.get(keyB) ?? Infinity;
      return orderA - orderB;
    });
  }
  
  // For modules without defined order, keep original order
  return entries;
};

// Action badge label and color
const actionConfig = (action: string): { label: string; color: string } => {
  switch (action) {
    case 'create':    return { label: 'Novo',          color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    case 'update':    return { label: 'Atualizado',    color: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 'delete':    return { label: 'Excluído',      color: 'bg-red-100 text-red-700 border-red-200' };
    case 'procedure': return { label: 'Procedimento',  color: 'bg-violet-100 text-violet-700 border-violet-200' };
    default:          return { label: action,           color: 'bg-gray-100 text-gray-700 border-gray-200' };
  }
};

// Module display names
const MODULE_LABELS: Record<string, string> = {
  consulta:            'Consulta',
  avaliacao_cirurgica: 'Avaliação Cirúrgica',
  cirurgia:            'Cirurgia',
  retorno:             'Retorno',
  peso:                'Peso',
  patologia:           'Patologia',
  documento:           'Documento',
  exame:               'Exame',
  fotos:               'Fotos',
  vacina:              'Vacina',
  receita:             'Receita',
  observacoes:         'Observações',
  video:               'Gravação',
  internacao:          'Internação',
  diagnostico:         'Diagnóstico',
  banho_tosa:          'Banho e Tosa',
  obito:               'Óbito',
};

// Ordem dos campos para cada módulo (seguindo a ordem da ficha)
const FIELD_ORDERS: Record<string, string[]> = {
  consulta: [
    // Anamnese
    'queixa_principal',
    'medicamentos',
    'sistema_gastrintestinal',
    'sistema_genitourinario',
    'sistema_cardiorespiratório',
    'sistema_neurologico',
    'sistema_musculoesqueletico',
    'sistema_ototegumentar',
    'sistema_ototegumentar_obs',
    // Manejo
    'alimentacao',
    'vacinacao',
    'ambiente',
    'comportamento',
    'ectoparasitas',
    'vermifugo',
    'banho',
    'acesso_rua',
    'contactantes',
    // Exame Físico
    'mucosas',
    'linfonodos',
    'hidratacao',
    'pulso',
    'temperatura',
    'tpc',
    'fc',
    'fr',
    'campos_pulmonares',
    'bulhas_cardiacas',
    'ritmo_cardiaco',
    'palpacao_abdominal',
  ],
  retorno: [
    'motivo_retorno',
    'evolucao_quadro',
    'descricao_evolucao',
    'peso_atual',
    'temperatura',
    'fc',
    'fr',
    'exame_fisico_resumido',
    'exames_complementares',
    'conduta',
    'proximo_retorno',
    'observacoes',
  ],
  cirurgia: [
    'procedimento_realizado',
    'tecnica_cirurgica',
    'tipo_anestesia',
    'protocolo_anestesico',
    'duracao_minutos',
    'materiais_sutura',
    'intercorrencias',
    'pos_operatorio_imediato',
    'prescricao_pos_op',
    'retorno_previsto',
  ],
  avaliacao_cirurgica: [
    'procedimento_proposto',
    'risco_asa',
    'peso_atual',
    'temperatura',
    'fc',
    'fr',
    'exames_pre_operatorios',
    'jejum_confirmado',
    'observacoes',
  ],
  peso: [
    'peso_kg',
    'data',
    'observacoes',
  ],
  exame: [
    'tipo_exame',
    'data_exame',
    'resultados',
    'veterinario',
  ],
  vacina: [
    'vacina',
    'aplicacao',
    'proxima_dose',
    'lote',
  ],
  receita: [
    'medicamento',
    'dosagem',
    'frequencia',
    'duracao',
    'data_receita',
  ],
  patologia: [
    'nome',
    'data_diagnostico',
    'status',
    'descricao',
    'tratamento',
  ],
};

// Full label map for details keys
const DETAIL_LABELS: Record<string, string> = {
  // Genérico
  data:                    'Data',
  status:                  'Status',
  observacoes:             'Observações',
  observacao:              'Observação',
  descricao:               'Descrição',
  veterinario:             'Veterinário',
  responsavel:             'Responsável',
  motivo:                  'Motivo',
  titulo:                  'Título',
  categoria:               'Categoria',
  url:                     'Link',
  tags:                    'Tags',
  local:                   'Local',
  // Consulta - Anamnese
  queixa_principal:        'Queixa Principal',
  medicamentos:            'Medicamentos em Uso',
  sistema_gastrintestinal:  'Sistema Gastrintestinal (SGI)',
  sistema_genitourinario:  'Sistema Genitourinário (SGU)',
  sistema_cardiorespiratório: 'Sistema Cardiorrespiratório (SCR)',
  sistema_neurologico:     'Sistema Neurológico (SN)',
  sistema_musculoesqueletico: 'Sistema Musculoesquelético (SME)',
  sistema_ototegumentar:   'Sistema Oto-tegumentar (SOT)',
  sistema_ototegumentar_obs: 'Obs. SOT',
  // Consulta - Manejo
  alimentacao:             'Alimentação',
  vacinacao:               'Vacinação',
  ambiente:                'Ambiente',
  comportamento:           'Comportamento',
  ectoparasitas:           'Ectoparasitas',
  vermifugo:               'Vermífugo',
  banho:                   'Banho',
  acesso_rua:              'Acesso à Rua',
  contactantes:            'Contactantes',
  // Consulta - Exame Físico
  mucosas:                 'Mucosas',
  linfonodos:              'Linfonodos',
  hidratacao:              'Hidratação',
  pulso:                   'Pulso',
  temperatura:             'Temperatura',
  tpc:                     'TPC',
  fc:                      'FC (bpm)',
  fr:                      'FR (mrpm)',
  campos_pulmonares:       'Campos Pulmonares',
  bulhas_cardiacas:        'Bulhas Cardíacas',
  ritmo_cardiaco:          'Ritmo Cardíaco',
  palpacao_abdominal:      'Palpação Abdominal',
  sistemas_alterados:      'Sistemas com Alterações',
  // Retorno
  motivo_retorno:          'Motivo do Retorno',
  evolucao_quadro:         'Evolução do Quadro',
  descricao_evolucao:      'Descrição da Evolução',
  exame_fisico_resumido:   'Exame Físico',
  exames_complementares:   'Exames Complementares',
  conduta:                 'Conduta',
  proximo_retorno:         'Próximo Retorno',
  // Peso
  peso_kg:                 'Peso (kg)',
  peso_atual:              'Peso Atual',
  // Exame
  tipo_exame:              'Tipo de Exame',
  data_exame:              'Data do Exame',
  resultado:               'Resultado',
  resultados:              'Resultados',
  arquivo:                 'Arquivo',
  // Vacina
  vacina:                  'Vacina',
  nome_vacina:             'Vacina',
  aplicacao:               'Data de Aplicação',
  data_aplicacao:          'Data de Aplicação',
  proxima_dose:            'Próxima Dose',
  lote:                    'Lote',
  // Receita
  medicamento:             'Medicamento',
  dosagem:                 'Dosagem',
  frequencia:              'Frequência',
  duracao:                 'Duração',
  data_receita:            'Data da Receita',
  data_prescricao:         'Data da Prescrição',
  // Documento
  tipo_documento:          'Tipo de Documento',
  // Patologia / Diagnóstico
  nome:                    'Nome',
  nome_patologia:          'Patologia',
  data_diagnostico:        'Data do Diagnóstico',
  diagnostico:             'Diagnóstico',
  tratamento:              'Tratamento',
  gravidade:               'Gravidade',
  cid:                     'CID',
  // Internação
  admissao:                'Admissão',
  alta:                    'Alta',
  motivo_internacao:       'Motivo da Internação',
  data_entrada:            'Data de Entrada',
  data_saida:              'Data de Alta',
  // Cirurgia
  procedimento_realizado:  'Procedimento Realizado',
  tipo_anestesia:          'Tipo de Anestesia',
  duracao_minutos:         'Duração (min)',
  intercorrencias:         'Intercorrências',
  retorno_previsto:        'Retorno Previsto',
  // Avaliação Cirúrgica
  procedimento_proposto:   'Procedimento Proposto',
  risco_asa:               'Risco ASA',
  exames_pre_operatorios:  'Exames Pré-operatórios',
  jejum_confirmado:        'Jejum Confirmado',
  // Banho e Tosa
  servicos:                'Serviços',
  pelagem:                 'Pelagem',
  temperamento:            'Temperamento',
  observacoes_pele:        'Obs. de Pele',
  // Óbito
  data_obito:              'Data do Óbito',
  hora_obito:              'Hora do Óbito',
  tipo_causa:              'Tipo de Causa',
  causa:                   'Causa',
};

export const PetAdminHistorySection = ({
  petId,
  module,
  title,
  refreshKey = 0,
}: PetAdminHistorySectionProps) => {
  const [history, setHistory] = useState<PetAdminHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const sectionTitle = title ?? `Histórico de ${MODULE_LABELS[module] ?? module}`;
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('pet_admin_history')
        .select('id, module, action, title, details, created_at')
        .eq('pet_id', petId)
        .eq('module', module)
        .neq('action', 'delete') // Não mostrar registros excluídos
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setHistory(data as PetAdminHistoryRow[]);
      setLoading(false);
    };

    if (petId) loadHistory();
  }, [petId, module, refreshKey]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Build visible detail entries for a history row (ordered)
  const getVisibleDetails = (details: Record<string, unknown> | null) => {
    if (!details) return [];
    
    // Filter and sort entries
    const sortedEntries = sortDetailsByOrder(details, module)
      .filter(([key]) => !HIDDEN_FIELDS.has(key))
      .map(([key, value]) => {
        const formatted = formatValue(value);
        return {
          key,
          label: DETAIL_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          value: formatted,
        };
      })
      .filter(({ value }) => !isEmptyValue(value) && value !== '');
    
    return sortedEntries;
  };

  // Print summary function
  const handlePrintSummary = (entry: PetAdminHistoryRow) => {
    if (typeof window === 'undefined') return;
    
    const details = entry.details as Record<string, unknown> | null;
    if (!details) return;
    
    const visibleDetails = getVisibleDetails(details);
    const dateStr = format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Resumo - ${entry.title}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 12px;
              line-height: 1.6;
              color: #1f2937;
              margin: 0;
              padding: 20px;
            }
            @page { size: A4; margin: 15mm; }
            @media print {
              body { padding: 0; }
            }
            .header {
              border-bottom: 2px solid #1f2937;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 18px;
              font-weight: 700;
              margin: 0 0 5px;
            }
            .date {
              color: #6b7280;
              font-size: 11px;
            }
            .details {
              margin-top: 15px;
            }
            .detail-item {
              margin-bottom: 10px;
              page-break-inside: avoid;
            }
            .detail-label {
              font-weight: 600;
              color: #374151;
              margin-bottom: 3px;
            }
            .detail-value {
              color: #1f2937;
              padding-left: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${entry.title}</h1>
            <div class="date">${dateStr}</div>
          </div>
          <div class="details">
            ${visibleDetails.map(({ label, value }) => `
              <div class="detail-item">
                <div class="detail-label">${label}:</div>
                <div class="detail-value">${value}</div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('about:blank', '_blank');
    if (!printWindow) return;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Derive a clean display title from the raw stored title
  const cleanTitle = (raw: string) =>
    raw
      .replace(/ - .*$/, '')        // remove " - petName" suffix
      .replace(/ salva?$/i, '')     // remove trailing " salva"
      .replace(/ registrada?$/i, '') // remove trailing " registrada"
      .replace(/ atualizada?$/i, '') // remove trailing " atualizada"
      .trim();

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 shrink-0">
          <History className="h-3.5 w-3.5 text-primary" />
        </span>
        {sectionTitle}
      </h3>

      <ScrollArea className="max-h-80 pr-1">
        {loading ? (
          <div className="text-sm text-muted-foreground py-6 text-center animate-pulse">
            Carregando histórico...
          </div>
        ) : history.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Nenhum registro salvo ainda.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => {
              const cfg = actionConfig(entry.action);
              const visibleDetails = getVisibleDetails(entry.details);
              const isExpanded = expandedIds.has(entry.id);
              const hasDetails = visibleDetails.length > 0;

              return (
                <div
                  key={entry.id}
                  className="border border-border/60 rounded-xl overflow-hidden bg-card"
                >
                  {/* Header row — always visible */}
                  <button
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-left ${hasDetails ? 'hover:bg-muted/40 cursor-pointer' : 'cursor-default'}`}
                    onClick={() => hasDetails && toggleExpand(entry.id)}
                    disabled={!hasDetails}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-sm font-medium text-foreground truncate">
                        {cleanTitle(entry.title)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(entry.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      {hasDetails && (
                        isExpanded
                          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expandable detail section */}
                  {hasDetails && isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/40 bg-muted/20">
                      <div className="mt-3 flex justify-end mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintSummary(entry);
                          }}
                          className="h-7 text-xs"
                        >
                          <Printer className="h-3 w-3 mr-1.5" />
                          Imprimir Resumo
                        </Button>
                      </div>
                      <dl className="space-y-1.5">
                        {visibleDetails.map(({ key, label, value }) => (
                          <div key={key} className="flex gap-2 text-xs">
                            <dt className="font-semibold text-foreground shrink-0 min-w-[130px]">
                              {label}:
                            </dt>
                            <dd className="text-muted-foreground break-words">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              );
            })}          </div>
        )}
      </ScrollArea>
    </div>
  );
};
