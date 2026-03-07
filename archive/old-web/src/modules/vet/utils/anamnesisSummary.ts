import { AnamnesisData } from '@/modules/vet/components/anamnesisTypes';

/**
 * Gera um resumo ordenado da anamnese seguindo a ordem exata da ficha.
 * Apenas campos preenchidos são incluídos no resumo.
 */
export const generateAnamnesisSummary = (anamnesis: AnamnesisData): Record<string, unknown> => {
  const summary: Record<string, unknown> = {};

  // ─── ABA ANAMNESE ────────────────────────────────────────────────────────────────

  // 1. Queixa Principal
  if (anamnesis.queixa_principal?.trim()) {
    summary.queixa_principal = anamnesis.queixa_principal.trim();
  }

  // 2. Medicamentos em uso
  if (anamnesis.medicamentos?.trim()) {
    summary.medicamentos = anamnesis.medicamentos.trim();
  }

  // 3. Sistemas (apenas os que têm valores marcados)
  if (Array.isArray(anamnesis.sistema_gastrintestinal) && anamnesis.sistema_gastrintestinal.length > 0) {
    summary.sistema_gastrintestinal = anamnesis.sistema_gastrintestinal;
  }
  if (Array.isArray(anamnesis.sistema_genitourinario) && anamnesis.sistema_genitourinario.length > 0) {
    summary.sistema_genitourinario = anamnesis.sistema_genitourinario;
  }
  if (Array.isArray(anamnesis.sistema_cardiorespiratório) && anamnesis.sistema_cardiorespiratório.length > 0) {
    summary.sistema_cardiorespiratório = anamnesis.sistema_cardiorespiratório;
  }
  if (Array.isArray(anamnesis.sistema_neurologico) && anamnesis.sistema_neurologico.length > 0) {
    summary.sistema_neurologico = anamnesis.sistema_neurologico;
  }
  if (Array.isArray(anamnesis.sistema_musculoesqueletico) && anamnesis.sistema_musculoesqueletico.length > 0) {
    summary.sistema_musculoesqueletico = anamnesis.sistema_musculoesqueletico;
  }
  if (Array.isArray(anamnesis.sistema_ototegumentar) && anamnesis.sistema_ototegumentar.length > 0) {
    summary.sistema_ototegumentar = anamnesis.sistema_ototegumentar;
  }
  if (anamnesis.sistema_ototegumentar_obs?.trim()) {
    summary.sistema_ototegumentar_obs = anamnesis.sistema_ototegumentar_obs.trim();
  }

  // ─── ABA MANEJO ────────────────────────────────────────────────────────────────

  if (Array.isArray(anamnesis.alimentacao) && anamnesis.alimentacao.length > 0) {
    summary.alimentacao = anamnesis.alimentacao;
  }
  if (Array.isArray(anamnesis.vacinacao) && anamnesis.vacinacao.length > 0) {
    summary.vacinacao = anamnesis.vacinacao;
  }
  if (Array.isArray(anamnesis.ambiente) && anamnesis.ambiente.length > 0) {
    summary.ambiente = anamnesis.ambiente;
  }
  if (Array.isArray(anamnesis.comportamento) && anamnesis.comportamento.length > 0) {
    summary.comportamento = anamnesis.comportamento;
  }

  // Ectoparasitas (objeto)
  if (anamnesis.ectoparasitas && typeof anamnesis.ectoparasitas === 'object' && !Array.isArray(anamnesis.ectoparasitas)) {
    const ectoEntries = Object.entries(anamnesis.ectoparasitas).filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string' && v.trim() === '') return false;
      if (typeof v === 'boolean' && !v) return false;
      return true;
    });
    if (ectoEntries.length > 0) {
      summary.ectoparasitas = anamnesis.ectoparasitas;
    }
  }

  if (anamnesis.vermifugo?.trim()) {
    summary.vermifugo = anamnesis.vermifugo.trim();
  }

  // Banho (objeto)
  if (anamnesis.banho && typeof anamnesis.banho === 'object' && !Array.isArray(anamnesis.banho)) {
    const banhoEntries = Object.entries(anamnesis.banho).filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string' && v.trim() === '') return false;
      return true;
    });
    if (banhoEntries.length > 0) {
      summary.banho = anamnesis.banho;
    }
  }

  // Acesso à rua (objeto)
  if (anamnesis.acesso_rua && typeof anamnesis.acesso_rua === 'object' && !Array.isArray(anamnesis.acesso_rua)) {
    const acessoEntries = Object.entries(anamnesis.acesso_rua).filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string' && v.trim() === '') return false;
      return true;
    });
    if (acessoEntries.length > 0) {
      summary.acesso_rua = anamnesis.acesso_rua;
    }
  }

  // Contactantes (objeto)
  if (anamnesis.contactantes && typeof anamnesis.contactantes === 'object' && !Array.isArray(anamnesis.contactantes)) {
    const contactEntries = Object.entries(anamnesis.contactantes).filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string' && v.trim() === '') return false;
      if (typeof v === 'boolean' && !v) return false;
      return true;
    });
    if (contactEntries.length > 0) {
      summary.contactantes = anamnesis.contactantes;
    }
  }

  // ─── ABA EXAME FÍSICO ──────────────────────────────────────────────────────────

  if (Array.isArray(anamnesis.mucosas) && anamnesis.mucosas.length > 0) {
    summary.mucosas = anamnesis.mucosas;
  }
  if (Array.isArray(anamnesis.linfonodos) && anamnesis.linfonodos.length > 0) {
    summary.linfonodos = anamnesis.linfonodos;
  }
  if (anamnesis.hidratacao?.trim()) {
    summary.hidratacao = anamnesis.hidratacao.trim();
  }
  if (anamnesis.pulso?.trim()) {
    summary.pulso = anamnesis.pulso.trim();
  }
  if (anamnesis.temperatura?.trim()) {
    summary.temperatura = anamnesis.temperatura.trim();
  }
  if (anamnesis.tpc?.trim()) {
    summary.tpc = anamnesis.tpc.trim();
  }
  if (anamnesis.fc?.trim()) {
    summary.fc = anamnesis.fc.trim();
  }
  if (anamnesis.fr?.trim()) {
    summary.fr = anamnesis.fr.trim();
  }
  if (anamnesis.campos_pulmonares?.trim()) {
    summary.campos_pulmonares = anamnesis.campos_pulmonares.trim();
  }
  if (anamnesis.bulhas_cardiacas?.trim()) {
    summary.bulhas_cardiacas = anamnesis.bulhas_cardiacas.trim();
  }
  if (anamnesis.ritmo_cardiaco?.trim()) {
    summary.ritmo_cardiaco = anamnesis.ritmo_cardiaco.trim();
  }
  if (anamnesis.palpacao_abdominal?.trim()) {
    summary.palpacao_abdominal = anamnesis.palpacao_abdominal.trim();
  }

  return summary;
};
