export interface AnamnesisData {
  id?: string;
  queixa_principal: string;
  medicamentos: string;
  sistema_gastrintestinal: string[];
  sistema_genitourinario: string[];
  sistema_cardiorespiratório: string[];
  sistema_neurologico: string[];
  sistema_musculoesqueletico: string[];
  sistema_ototegumentar: string[];
  sistema_ototegumentar_obs: string;
  alimentacao: string[];
  vacinacao: string[];
  ambiente: string[];
  comportamento: string[];
  ectoparasitas: Record<string, unknown>;
  vermifugo: string;
  banho: Record<string, unknown>;
  acesso_rua: Record<string, unknown>;
  contactantes: Record<string, unknown>;
  mucosas: string[];
  linfonodos: string[];
  hidratacao: string;
  pulso: string;
  temperatura: string;
  tpc: string;
  fc: string;
  fr: string;
  campos_pulmonares: string;
  bulhas_cardiacas: string;
  ritmo_cardiaco: string;
  palpacao_abdominal: string;
}

export const EMPTY_ANAMNESIS: AnamnesisData = {
  queixa_principal: '', medicamentos: '',
  sistema_gastrintestinal: [], sistema_genitourinario: [],
  'sistema_cardiorespiratório': [], sistema_neurologico: [],
  sistema_musculoesqueletico: [], sistema_ototegumentar: [],
  sistema_ototegumentar_obs: '',
  alimentacao: [], vacinacao: [], ambiente: [], comportamento: [],
  ectoparasitas: {}, vermifugo: '', banho: {}, acesso_rua: {}, contactantes: {},
  mucosas: [], linfonodos: [],
  hidratacao: '', pulso: '', temperatura: '', tpc: '', fc: '', fr: '',
  campos_pulmonares: '', bulhas_cardiacas: '', ritmo_cardiaco: '', palpacao_abdominal: '',
};
