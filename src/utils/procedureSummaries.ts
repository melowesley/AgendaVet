/**
 * Funções utilitárias para gerar resumos ordenados de cada tipo de procedimento.
 * Cada função retorna apenas os campos preenchidos, seguindo a ordem exata da ficha.
 */

// ─── RETORNO ────────────────────────────────────────────────────────────────────
export interface RetornoData {
  motivo_retorno: string;
  evolucao_quadro: string;
  descricao_evolucao: string;
  peso_atual: string;
  temperatura: string;
  fc: string;
  fr: string;
  exame_fisico_resumido: string;
  exames_complementares: string;
  conduta: string;
  proximo_retorno: string;
  observacoes: string;
}

export const generateRetornoSummary = (data: RetornoData): Record<string, unknown> => {
  const summary: Record<string, unknown> = {};
  
  if (data.motivo_retorno?.trim()) summary.motivo_retorno = data.motivo_retorno.trim();
  if (data.evolucao_quadro?.trim()) summary.evolucao_quadro = data.evolucao_quadro.trim();
  if (data.descricao_evolucao?.trim()) summary.descricao_evolucao = data.descricao_evolucao.trim();
  if (data.peso_atual?.trim()) summary.peso_atual = data.peso_atual.trim();
  if (data.temperatura?.trim()) summary.temperatura = data.temperatura.trim();
  if (data.fc?.trim()) summary.fc = data.fc.trim();
  if (data.fr?.trim()) summary.fr = data.fr.trim();
  if (data.exame_fisico_resumido?.trim()) summary.exame_fisico_resumido = data.exame_fisico_resumido.trim();
  if (data.exames_complementares?.trim()) summary.exames_complementares = data.exames_complementares.trim();
  if (data.conduta?.trim()) summary.conduta = data.conduta.trim();
  if (data.proximo_retorno?.trim()) summary.proximo_retorno = data.proximo_retorno.trim();
  if (data.observacoes?.trim()) summary.observacoes = data.observacoes.trim();
  
  return summary;
};

// ─── CIRURGIA ────────────────────────────────────────────────────────────────────
export interface CirurgiaData {
  procedimento_realizado: string;
  tecnica_cirurgica: string;
  tipo_anestesia: string;
  protocolo_anestesico: string;
  duracao_minutos: string;
  materiais_sutura: string[];
  intercorrencias: string;
  pos_operatorio_imediato: string;
  prescricao_pos_op: string;
  retorno_previsto: string;
}

export const generateCirurgiaSummary = (data: CirurgiaData): Record<string, unknown> => {
  const summary: Record<string, unknown> = {};
  
  if (data.procedimento_realizado?.trim()) summary.procedimento_realizado = data.procedimento_realizado.trim();
  if (data.tecnica_cirurgica?.trim()) summary.tecnica_cirurgica = data.tecnica_cirurgica.trim();
  if (data.tipo_anestesia?.trim()) summary.tipo_anestesia = data.tipo_anestesia.trim();
  if (data.protocolo_anestesico?.trim()) summary.protocolo_anestesico = data.protocolo_anestesico.trim();
  if (data.duracao_minutos?.trim()) summary.duracao_minutos = data.duracao_minutos.trim();
  if (Array.isArray(data.materiais_sutura) && data.materiais_sutura.length > 0) {
    summary.materiais_sutura = data.materiais_sutura;
  }
  if (data.intercorrencias?.trim()) summary.intercorrencias = data.intercorrencias.trim();
  if (data.pos_operatorio_imediato?.trim()) summary.pos_operatorio_imediato = data.pos_operatorio_imediato.trim();
  if (data.prescricao_pos_op?.trim()) summary.prescricao_pos_op = data.prescricao_pos_op.trim();
  if (data.retorno_previsto?.trim()) summary.retorno_previsto = data.retorno_previsto.trim();
  
  return summary;
};

// ─── AVALIAÇÃO CIRÚRGICA ─────────────────────────────────────────────────────────
export interface AvaliacaoData {
  procedimento_proposto: string;
  risco_asa: string;
  exames_pre_operatorios: string[];
  jejum_confirmado: boolean;
  peso_atual: string;
  temperatura: string;
  fc: string;
  fr: string;
  observacoes: string;
}

export const generateAvaliacaoSummary = (data: AvaliacaoData): Record<string, unknown> => {
  const summary: Record<string, unknown> = {};
  
  if (data.procedimento_proposto?.trim()) summary.procedimento_proposto = data.procedimento_proposto.trim();
  if (data.risco_asa?.trim()) summary.risco_asa = data.risco_asa.trim();
  if (data.peso_atual?.trim()) summary.peso_atual = data.peso_atual.trim();
  if (data.temperatura?.trim()) summary.temperatura = data.temperatura.trim();
  if (data.fc?.trim()) summary.fc = data.fc.trim();
  if (data.fr?.trim()) summary.fr = data.fr.trim();
  if (Array.isArray(data.exames_pre_operatorios) && data.exames_pre_operatorios.length > 0) {
    summary.exames_pre_operatorios = data.exames_pre_operatorios;
  }
  if (data.jejum_confirmado) summary.jejum_confirmado = data.jejum_confirmado;
  if (data.observacoes?.trim()) summary.observacoes = data.observacoes.trim();
  
  return summary;
};

// ─── PESO ─────────────────────────────────────────────────────────────────────────
export const generatePesoSummary = (peso: string, data: string, observacoes?: string | null): Record<string, unknown> => {
  const summary: Record<string, unknown> = {};
  
  if (peso?.trim()) summary.peso_kg = peso.trim();
  if (data?.trim()) summary.data = data.trim();
  if (observacoes?.trim()) summary.observacoes = observacoes.trim();
  
  return summary;
};

// ─── EXAME ────────────────────────────────────────────────────────────────────────
export const generateExameSummary = (
  tipoExame: string,
  dataExame: string,
  resultados?: string | null,
  veterinario?: string | null
): Record<string, unknown> => {
  const summary: Record<string, unknown> = {};
  
  if (tipoExame?.trim()) summary.tipo_exame = tipoExame.trim();
  if (dataExame?.trim()) summary.data_exame = dataExame.trim();
  if (resultados?.trim()) summary.resultados = resultados.trim();
  if (veterinario?.trim()) summary.veterinario = veterinario.trim();
  
  return summary;
};

// ─── VACINA ────────────────────────────────────────────────────────────────────────
export const generateVacinaSummary = (
  vacina: string,
  aplicacao: string,
  proximaDose?: string | null,
  lote?: string | null
): Record<string, unknown> => {
  const summary: Record<string, unknown> = {};
  
  if (vacina?.trim()) summary.vacina = vacina.trim();
  if (aplicacao?.trim()) summary.aplicacao = aplicacao.trim();
  if (proximaDose?.trim()) summary.proxima_dose = proximaDose.trim();
  if (lote?.trim()) summary.lote = lote.trim();
  
  return summary;
};

// ─── RECEITA ─────────────────────────────────────────────────────────────────────
export const generateReceitaSummary = (
  medicamento: string,
  dosagem?: string | null,
  frequencia?: string | null,
  duracao?: string | null,
  dataReceita?: string | null
): Record<string, unknown> => {
  const summary: Record<string, unknown> = {};
  
  if (medicamento?.trim()) summary.medicamento = medicamento.trim();
  if (dosagem?.trim()) summary.dosagem = dosagem.trim();
  if (frequencia?.trim()) summary.frequencia = frequencia.trim();
  if (duracao?.trim()) summary.duracao = duracao.trim();
  if (dataReceita?.trim()) summary.data_receita = dataReceita.trim();
  
  return summary;
};

// ─── PATOLOGIA ────────────────────────────────────────────────────────────────────
export const generatePatologiaSummary = (
  nome: string,
  dataDiagnostico: string,
  status?: string | null,
  descricao?: string | null,
  tratamento?: string | null
): Record<string, unknown> => {
  const summary: Record<string, unknown> = {};
  
  if (nome?.trim()) summary.nome = nome.trim();
  if (dataDiagnostico?.trim()) summary.data_diagnostico = dataDiagnostico.trim();
  if (status?.trim()) summary.status = status.trim();
  if (descricao?.trim()) summary.descricao = descricao.trim();
  if (tratamento?.trim()) summary.tratamento = tratamento.trim();
  
  return summary;
};
