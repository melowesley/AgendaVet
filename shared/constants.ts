/**
 * Constantes compartilhadas do AgendaVet
 */

export const APP_CONFIG = {
  name: 'AgendaVet',
  version: '2.0.0',
  description: 'Sistema veterinário para gestão de fichas clínicas e portal do cliente',
  
  // URLs
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cahlaalebcwqgbbavrsf.supabase.co',
  
  // Timeouts
  apiTimeout: 30000, // 30 segundos
  requestTimeout: 10000, // 10 segundos
  
  // Paginação
  defaultPageSize: 20,
  maxPageSize: 100,
  
  // Upload
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  
  // Cache
  cacheTimeout: 5 * 60 * 1000, // 5 minutos
  
  // PWA
  pwaCacheName: 'agendavet-v1',
  offlinePages: ['/dashboard', '/pets', '/appointments'],
} as const

export const SPECIES = {
  DOG: { value: 'dog', label: 'Cachorro', emoji: '🐕' },
  CAT: { value: 'cat', label: 'Gato', emoji: '🐈' },
  BIRD: { value: 'bird', label: 'Pássaro', emoji: '🦜' },
  RABBIT: { value: 'rabbit', label: 'Coelho', emoji: '🐰' },
  OTHER: { value: 'other', label: 'Outro', emoji: '🐾' },
} as const

export const APPOINTMENT_TYPES = {
  CHECKUP: { value: 'checkup', label: 'Consulta', duration: 30, color: '#3B82F6' },
  VACCINATION: { value: 'vaccination', label: 'Vacinação', duration: 15, color: '#10B981' },
  SURGERY: { value: 'surgery', label: 'Cirurgia', duration: 120, color: '#EF4444' },
  DENTAL: { value: 'dental', label: 'Odontologia', duration: 60, color: '#8B5CF6' },
  EMERGENCY: { value: 'emergency', label: 'Emergência', duration: 45, color: '#F97316' },
  GROOMING: { value: 'grooming', label: 'Banho e Tosa', duration: 90, color: '#EC4899' },
  FOLLOWUP: { value: 'followup', label: 'Retorno', duration: 20, color: '#6366F1' },
} as const

export const APPOINTMENT_STATUS = {
  SCHEDULED: { value: 'scheduled', label: 'Agendado', color: '#3B82F6' },
  CONFIRMED: { value: 'confirmed', label: 'Confirmado', color: '#10B981' },
  IN_PROGRESS: { value: 'in_progress', label: 'Em Andamento', color: '#F59E0B' },
  COMPLETED: { value: 'completed', label: 'Concluído', color: '#6B7280' },
  CANCELLED: { value: 'cancelled', label: 'Cancelado', color: '#EF4444' },
} as const

export const MEDICAL_RECORD_TYPES = {
  VACCINATION: { value: 'vaccination', label: 'Vacinação', icon: '💉' },
  DIAGNOSIS: { value: 'diagnosis', label: 'Diagnóstico', icon: '🔍' },
  PRESCRIPTION: { value: 'prescription', label: 'Prescrição', icon: '💊' },
  SURGERY: { value: 'surgery', label: 'Cirurgia', icon: '🏥' },
  LAB_RESULT: { value: 'lab_result', label: 'Resultado de Exame', icon: '🧪' },
  TREATMENT: { value: 'treatment', label: 'Tratamento', icon: '🩺' },
} as const

export const AI_MODELS = {
  // Modelos Gratuitos
  DEEPSEEK_R1: { 
    value: 'deepseek-r1', 
    label: 'DeepSeek R1', 
    tier: 'free',
    specialty: 'Raciocínio Clínico',
    description: 'Diagnóstico diferencial e raciocínio lógico',
    icon: '🧠'
  },
  GEMINI_2_0_FLASH: { 
    value: 'gemini-2.0-flash', 
    label: 'Gemini 2.0 Flash', 
    tier: 'free',
    specialty: 'Emergências',
    description: 'Triagem rápida e decisões críticas',
    icon: '⚡'
  },
  GEMINI_2_5_FLASH: { 
    value: 'gemini-2.5-flash', 
    label: 'Gemini 2.5 Flash', 
    tier: 'free',
    specialty: 'Análise Laboratorial',
    description: 'Interpretação de exames e laboratório',
    icon: '🔄'
  },
  GEMINI_1_5_FLASH: { 
    value: 'gemini-1.5-flash', 
    label: 'Gemini 1.5 Flash', 
    tier: 'free',
    specialty: 'Medicina Preventiva',
    description: 'Vacinas e wellness',
    icon: '❤️'
  },
  
  // Modelos Premium
  GEMINI_2_5_PRO: { 
    value: 'gemini-2.5-pro', 
    label: 'Gemini 2.5 Pro', 
    tier: 'premium',
    specialty: 'Pesquisa Veterinária',
    description: 'Literatura científica e evidências',
    icon: '📚'
  },
  GEMINI_1_5_PRO: { 
    value: 'gemini-1.5-pro', 
    label: 'Gemini 1.5 Pro', 
    tier: 'premium',
    specialty: 'Terapia Intensiva',
    description: 'UTI e cuidados críticos',
    icon: '⚠️'
  },
  CLAUDE_SONNET: { 
    value: 'claude-sonnet', 
    label: 'Claude Sonnet', 
    tier: 'premium',
    specialty: 'Análise de Imagens',
    description: 'Radiografias e imagens médicas',
    icon: '📷'
  },
  GPT_4O: { 
    value: 'gpt-4o', 
    label: 'GPT-4o', 
    tier: 'premium',
    specialty: 'Planejamento Cirúrgico',
    description: 'Procedimentos cirúrgicos complexos',
    icon: '🚨'
  },
} as const

export const VACCINATION_SCHEDULES = {
  DOG: [
    { name: 'V8', age: 6, booster: 21, description: 'Primeira dose - 6 semanas' },
    { name: 'V8', age: 9, booster: 21, description: 'Segunda dose - 9 semanas' },
    { name: 'V8', age: 12, booster: 21, description: 'Terceira dose - 12 semanas' },
    { name: 'V8', age: 16, booster: 365, description: 'Reforço anual - 16 semanas' },
    { name: 'Anti-rábica', age: 16, booster: 365, description: 'Primeira dose - 16 semanas' },
    { name: 'Anti-rábica', age: 20, booster: 365, description: 'Reforço anual - 20 semanas' },
  ],
  CAT: [
    { name: 'V3', age: 8, booster: 21, description: 'Primeira dose - 8 semanas' },
    { name: 'V3', age: 12, booster: 21, description: 'Segunda dose - 12 semanas' },
    { name: 'V3', age: 16, booster: 365, description: 'Reforço anual - 16 semanas' },
    { name: 'Anti-rábica', age: 16, booster: 365, description: 'Primeira dose - 16 semanas' },
    { name: 'Anti-rábica', age: 20, booster: 365, description: 'Reforço anual - 20 semanas' },
  ],
} as const

export const WORKING_HOURS_DEFAULT = [
  { day: 0, open: '09:00', close: '18:00', closed: true }, // Domingo
  { day: 1, open: '09:00', close: '18:00', closed: false }, // Segunda
  { day: 2, open: '09:00', close: '18:00', closed: false }, // Terça
  { day: 3, open: '09:00', close: '18:00', closed: false }, // Quarta
  { day: 4, open: '09:00', close: '18:00', closed: false }, // Quinta
  { day: 5, open: '09:00', close: '18:00', closed: false }, // Sexta
  { day: 6, open: '09:00', close: '12:00', closed: false }, // Sábado
] as const

export const NOTIFICATION_TYPES = {
  APPOINTMENT: { value: 'appointment', label: 'Agendamento', icon: '📅' },
  VACCINE: { value: 'vaccine', label: 'Vacinação', icon: '💉' },
  TREATMENT: { value: 'treatment', label: 'Tratamento', icon: '💊' },
  SYSTEM: { value: 'system', label: 'Sistema', icon: '⚙️' },
} as const

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Não autorizado. Faça login novamente.',
  FORBIDDEN: 'Acesso negado. Verifique suas permissões.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro no servidor. Tente novamente mais tarde.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique as informações.',
  TIMEOUT: 'Tempo esgotado. Tente novamente.',
  UNKNOWN_ERROR: 'Erro desconhecido. Contate o suporte.',
} as const

export const SUCCESS_MESSAGES = {
  SAVED: 'Salvo com sucesso!',
  UPDATED: 'Atualizado com sucesso!',
  DELETED: 'Excluído com sucesso!',
  CREATED: 'Criado com sucesso!',
  SENT: 'Enviado com sucesso!',
  UPLOADED: 'Arquivo enviado com sucesso!',
} as const

export const VALIDATION_RULES = {
  name: { required: true, minLength: 2, maxLength: 100 },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone: { required: true, pattern: /^\(\d{2}\) \d{4,5}-\d{4}$/ },
  cpf: { required: false, pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/ },
  weight: { required: true, min: 0.1, max: 200 },
  age: { required: true, min: 0, max: 30 },
} as const

export const EXPORT_FORMATS = {
  PDF: { value: 'pdf', label: 'PDF', mimeType: 'application/pdf' },
  EXCEL: { value: 'xlsx', label: 'Excel', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  CSV: { value: 'csv', label: 'CSV', mimeType: 'text/csv' },
} as const

export const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
] as const

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const ANIMATION_DURATIONS = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
} as const
