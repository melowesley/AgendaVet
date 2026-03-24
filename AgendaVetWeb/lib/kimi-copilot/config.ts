/**
 * KIMI Copilot - Integração com AgendaVet SaaS
 * 
 * O KIMI atua como o Copilot Central do sistema, coordenando:
 * - Vet Copilot (assistente clínico individual por veterinário)
 * - Admin Copilot (automação administrativa)
 * - Multi-agent orchestration (delegação para Gemini/Deepseek)
 * 
 * Esta configuração estende o KIMI Brain para operar como
 * o "AI Control Brain" descrito na arquitetura AgentVet.
 */

import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

// Provider KIMI
export const kimiProvider = createOpenAI({
  apiKey: process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY || '',
  baseURL: 'https://api.moonshot.cn/v1',
})

// Modelos KIMI disponíveis para o Copilot
export const KIMI_COPILOT_MODELS = {
  // KIMI K2.5 - Modelo principal do Copilot (melhor equilíbrio)
  'kimi-k2.5': 'kimi-k2-5-071616',
  // KIMI K2 - Versão padrão
  'kimi-k2': 'kimi-k2-071616',
  // KIMI K1.5 - Especialista em reasoning
  'kimi-k1.5': 'kimi-k1-5-071616',
} as const

// Modos de operação do KIMI Copilot
export type KimiCopilotMode = 
  | 'saas_admin'      // Administração do SaaS AgendaVet
  | 'clinical_orchestrator'  // Orquestra veterinários
  | 'vet_copilot'     // Modo clínico individual
  | 'multi_tenant'    // Gestão multi-clínica
  | 'agent_control'   // Controle de agentes

// Perfis de veterinários no sistema
export interface VetProfile {
  id: string
  name: string
  clinicId: string
  specialty?: string
  languageStyle: 'formal' | 'friendly' | 'technical'
  preferredModel: string
  toolsEnabled: string[]
  customPrompt?: string
}

// Configuração do KIMI como Copilot SaaS
export interface KimiCopilotConfig {
  mode: KimiCopilotMode
  defaultModel: keyof typeof KIMI_COPILOT_MODELS
  vetProfiles: Map<string, VetProfile>
  features: {
    clinicalAssistance: boolean
    adminAutomation: boolean
    multiAgentOrchestration: boolean
    proactiveAlerts: boolean
    ragEnabled: boolean
  }
}

// Configuração padrão para AgendaVet SaaS
export const DEFAULT_SAAS_CONFIG: KimiCopilotConfig = {
  mode: 'saas_admin',
  defaultModel: 'kimi-k2.5',
  vetProfiles: new Map(),
  features: {
    clinicalAssistance: true,
    adminAutomation: true,
    multiAgentOrchestration: true,
    proactiveAlerts: true,
    ragEnabled: false, // Fase 2
  },
}

/**
 * System Prompt para KIMI como Copilot SaaS do AgendaVet
 */
export const KIMI_SAAS_COPILOT_PROMPT = `Você é o KIMI Copilot - o assistente inteligente central do AgendaVet SaaS.

🎯 MISSÃO PRINCIPAL
Você é o "cérebro" que coordena toda a inteligência artificial do sistema AgendaVet, conectando veterinários, clínicas e pacientes.

🎭 MODOS DE OPERAÇÃO

1. **Modo SaaS Admin** (você está aqui agora)
   - Gerencia configurações de múltiplas clínicas
   - Orquestra agentes por veterinário
   - Executa automações administrativas
   - Gera relatórios de uso da IA

2. **Modo Clinical Orchestrator**
   - Coordena Vet Copilots individuais
   - Distribui tarefas entre agents
   - Sincroniza dados entre clínicas
   - Gerencia filas de processamento

3. **Modo Vet Copilot Individual**
   - Atua como assistente clínico pessoal
   - Acessa histórico do paciente selecionado
   - Executa tools médicas
   - Adapta linguagem ao veterinário

🔧 TOOLS DE ORQUESTRAÇÃO DISPONÍVEIS

- \`delegate_to_vet_copilot\` - Delega para copiloto de veterinário específico
- \`delegate_to_gemini\` - Usa Gemini para tarefas criativas/NLP
- \`delegate_to_deepseek\` - Usa DeepSeek para raciocínio/análise
- \`update_vet_profile\` - Atualiza configuração de veterinário
- \`deploy_prompt_version\` - Deploya nova versão de prompt
- \`list_active_agents\` - Lista agents ativos
- \`switch_clinic_context\` - Alterna contexto entre clínicas
- \`generate_saas_report\` - Gera relatórios de uso

📊 CONTEXTO SAAS
- Você gerencia múltiplas clínicas veterinárias
- Cada clínica tem N veterinários
- Cada veterinário tem seu próprio Vet Copilot configurável
- Dados isolados por clínica (RLS)
- Versionamento de prompts por clínica

🗣️ COMUNICAÇÃO
- Identifique-se como "KIMI Copilot"
- Use tom profissional mas acessível
- Português do Brasil
- Seja proativo nas sugestões

🔄 INTEGRAÇÃO COM AGENTVET
O KIMI Copilot implementa o "AI Control Brain" da arquitetura AgentVet:
- Controla múltiplos Vet Copilots
- Gerencia prompts versionados
- Orquestra tools clínicas
- Mantém memória por sessão/clínica

Comandos administrativos que você entende:
- "/agents list" - Lista veterinários/agents
- "/agent update [vet_id]" - Atualiza config
- "/deploy prompt v[N]" - Deploya versão
- "/clinic switch [id]" - Troca clínica
- "/report usage" - Gera relatório

Você está pronto para operar o AgendaVet como um sistema operacional assistido por IA.`

/**
 * Schema para tool de delegação para Vet Copilot individual
 */
export const delegateToVetCopilotSchema = z.object({
  veterinarianId: z.string().describe('ID do veterinário destino'),
  petId: z.string().optional().describe('ID do paciente, se aplicável'),
  task: z.string().describe('Tarefa clínica a ser executada'),
  context: z.string().optional().describe('Contexto adicional'),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
})

/**
 * Schema para atualização de perfil de veterinário
 */
export const updateVetProfileSchema = z.object({
  vetId: z.string(),
  updates: z.object({
    languageStyle: z.enum(['formal', 'friendly', 'technical']).optional(),
    preferredModel: z.string().optional(),
    toolsEnabled: z.array(z.string()).optional(),
    customPrompt: z.string().optional(),
  }),
  scope: z.enum(['this_vet', 'all_vets_in_clinic', 'all_vets']).default('this_vet'),
})

/**
 * Schema para deploy de versão de prompt
 */
export const deployPromptSchema = z.object({
  version: z.string(),
  target: z.union([
    z.object({ vetId: z.string() }),
    z.object({ clinicId: z.string() }),
    z.literal('all'),
  ]),
  promptText: z.string().optional(), // Se não informado, busca do versionamento
})

/**
 * Schema para geração de relatórios SaaS
 */
export const generateSaasReportSchema = z.object({
  reportType: z.enum([
    'usage_stats',
    'clinical_interactions',
    'model_performance',
    'vet_productivity',
    'clinic_overview',
  ]),
  clinicId: z.string().optional(),
  dateRange: z.object({
    start: z.string(), // ISO date
    end: z.string(),
  }).optional(),
  format: z.enum(['json', 'markdown', 'csv']).default('json'),
})

/**
 * Função para criar instância do KIMI Copilot
 */
export function createKimiCopilot(config: Partial<KimiCopilotConfig> = {}) {
  const fullConfig = { ...DEFAULT_SAAS_CONFIG, ...config }
  
  return {
    config: fullConfig,
    
    // Muda modo de operação
    setMode(mode: KimiCopilotMode) {
      this.config.mode = mode
      console.log(`[KIMI Copilot] Modo alterado para: ${mode}`)
    },
    
    // Registra veterinário no sistema
    registerVet(vet: VetProfile) {
      this.config.vetProfiles.set(vet.id, vet)
      console.log(`[KIMI Copilot] Veterinário registrado: ${vet.name}`)
    },
    
    // Obtém modelo KIMI configurado
    getModel() {
      const modelId = KIMI_COPILOT_MODELS[this.config.defaultModel]
      return kimiProvider(modelId)
    },
    
    // Verifica feature flag
    hasFeature(feature: keyof typeof fullConfig.features) {
      return fullConfig.features[feature]
    },
  }
}

// Exporta instância singleton para uso no sistema
export const kimiCopilot = createKimiCopilot()
