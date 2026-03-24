/**
 * KIMI Brain - Sistema de Orquestração de Agentes
 * 
 * O KIMI atua como "Cérebro" central que interpreta comandos do usuário
 * e delega tarefas para outros agents (Gemini, Deepseek, etc.)
 * 
 * Comandos suportados:
 * - "KIMI melhore o diálogo da gemini" → Delega para agente de refinamento
 * - "KIMI execute análise clínica" → Ativa modo clínico com Deepseek
 * - "KIMI resuma dados" → Usa Gemini para processamento
 * - "KIMI configure temperatura 0.5" → Ajusta configurações
 */

import { generateText, streamText, tool } from 'ai'
import { z } from 'zod'

// Tipos de comandos que o KIMI pode interpretar
export type KimiCommandType = 
  | 'DELEGATE_TO_GEMINI'      // Delegar tarefa para Gemini
  | 'DELEGATE_TO_DEEPSEEK'    // Delegar tarefa para Deepseek
  | 'IMPROVE_DIALOG'          // Melhorar diálogo/resposta
  | 'CLINICAL_MODE'           // Ativar modo clínico
  | 'ADMIN_MODE'              // Ativar modo administrativo
  | 'UPDATE_SETTINGS'         // Atualizar configurações
  | 'GENERAL_CHAT'            // Conversa geral com KIMI

// Estrutura de um comando interpretado
export interface ParsedCommand {
  type: KimiCommandType
  targetModel?: 'gemini' | 'deepseek' | 'kimi'
  action: string
  context?: string
  parameters?: Record<string, any>
  originalMessage: string
}

// Palavras-chave para detecção de comandos
const COMMAND_PATTERNS = {
  DELEGATE_TO_GEMINI: [
    /\bkimi\b.*\b(?:use|chame|delegue|mande|peça|peça para|coloque|ativa)\b.*\b(?:gemini|gemini pro|google)\b/i,
    /\bkimi\b.*\b(?:gemini|gemini pro|google)\b.*\b(?:para|pra|que|pra fazer|para fazer)\b/i,
    /\b(?:use|com|via|pelo|no|na)\s+gemini\b/i,
  ],
  DELEGATE_TO_DEEPSEEK: [
    /\bkimi\b.*\b(?:use|chame|delegue|mande|peça|peça para|coloque|ativa)\b.*\b(?:deepseek|deep seek)\b/i,
    /\bkimi\b.*\b(?:deepseek|deep seek)\b.*\b(?:para|pra|que|pra fazer|para fazer)\b/i,
    /\b(?:use|com|via|pelo|no|na)\s+deepseek\b/i,
  ],
  IMPROVE_DIALOG: [
    /\bkimi\b.*\b(?:melhore|melhorar|aprimore|aprimorar|refine|otimize|corrija)\b.*\b(?:diálogo|resposta|texto|frase|mensagem)\b/i,
    /\bkimi\b.*\b(?:isso|aquilo|a resposta|o texto|a mensagem)\b.*\b(?:está ruim|pode melhorar|melhore)\b/i,
    /\bkimi\b.*\b(?:reescreva|reformula|ajuste)\b/i,
  ],
  CLINICAL_MODE: [
    /\bkimi\b.*\b(?:modo clínico|clínica|paciente|veterinário|vet|copilot)\b/i,
    /\bkimi\b.*\b(?:análise|consulta|diagnóstico|exame)\b.*\b(?:paciente|pet|animal)\b/i,
  ],
  ADMIN_MODE: [
    /\bkimi\b.*\b(?:modo admin|administrativo|gestão|clínica|dados|relatório)\b/i,
  ],
  UPDATE_SETTINGS: [
    /\bkimi\b.*\b(?:configure|ajuste|mude|altere|defina|sete|coloque)\b.*\b(?:temperatura|modelo|configuração|settings)\b/i,
  ],
}

/**
 * Analisa a mensagem do usuário e extrai o comando para o KIMI
 */
export function parseKimiCommand(message: string): ParsedCommand {
  // Verifica se a mensagem começa com "KIMI" ou contém "KIMI" no início
  const hasKimiPrefix = /^\s*kimi\b/i.test(message) || /\bkimi\b/i.test(message.substring(0, 20))
  
  if (!hasKimiPrefix) {
    return {
      type: 'GENERAL_CHAT',
      action: 'conversar',
      originalMessage: message,
    }
  }

  // Verifica padrões de comando
  for (const [commandType, patterns] of Object.entries(COMMAND_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return extractCommandDetails(commandType as KimiCommandType, message)
      }
    }
  }

  // Fallback: conversa geral com KIMI
  return {
    type: 'GENERAL_CHAT',
    action: 'conversar',
    originalMessage: message,
    context: message.replace(/\bkimi\b/gi, '').trim(),
  }
}

/**
 * Extrai detalhes específicos do comando
 */
function extractCommandDetails(type: KimiCommandType, message: string): ParsedCommand {
  const baseCommand: ParsedCommand = {
    type,
    originalMessage: message,
    action: extractAction(message),
  }

  switch (type) {
    case 'DELEGATE_TO_GEMINI':
      return {
        ...baseCommand,
        targetModel: 'gemini',
        context: extractContext(message, 'gemini'),
      }
    
    case 'DELEGATE_TO_DEEPSEEK':
      return {
        ...baseCommand,
        targetModel: 'deepseek',
        context: extractContext(message, 'deepseek'),
      }
    
    case 'IMPROVE_DIALOG':
      // Detecta qual modelo melhorar
      const targetMatch = message.match(/\b(?:do|da|do|pelo|pela)\s+(gemini|deepseek)\b/i)
      return {
        ...baseCommand,
        targetModel: (targetMatch?.[1]?.toLowerCase() as 'gemini' | 'deepseek') || undefined,
        context: extractContext(message, 'melhore'),
        parameters: {
          improvementType: detectImprovementType(message),
        },
      }
    
    case 'UPDATE_SETTINGS':
      const tempMatch = message.match(/temperatura\s+(\d+(?:\.\d+)?)/i)
      const modelMatch = message.match(/modelo\s+(\S+)/i)
      return {
        ...baseCommand,
        parameters: {
          temperature: tempMatch ? parseFloat(tempMatch[1]) : undefined,
          model: modelMatch ? modelMatch[1] : undefined,
        },
      }
    
    default:
      return baseCommand
  }
}

/**
 * Extrai a ação principal da mensagem
 */
function extractAction(message: string): string {
  // Remove "KIMI" e palavras comuns
  const cleaned = message
    .replace(/^\s*kimi\b/gi, '')
    .replace(/\b(?:por favor|pfv|pls|please)\b/gi, '')
    .trim()
  
  // Pega as primeiras 3-5 palavras como ação
  const words = cleaned.split(/\s+/).filter(w => w.length > 0)
  return words.slice(0, 5).join(' ')
}

/**
 * Extrai o contexto da mensagem (o que vem depois da palavra-chave)
 */
function extractContext(message: string, keyword: string): string {
  const regex = new RegExp(`\\b${keyword}\\b(.+?)(?:\\.|$)`, 'i')
  const match = message.match(regex)
  return match ? match[1].trim() : message.replace(/\bkimi\b/gi, '').trim()
}

/**
 * Detecta o tipo de melhoria solicitada
 */
function detectImprovementType(message: string): string {
  if (/\b(?:formal|profissional|técnico)\b/i.test(message)) return 'formal'
  if (/\b(?:simples|simple|fácil|básico)\b/i.test(message)) return 'simple'
  if (/\b(?:amigável|amigavel|friendly|simpático|simpatico)\b/i.test(message)) return 'friendly'
  if (/\b(?:curto|curta|resumido|short|brief)\b/i.test(message)) return 'concise'
  if (/\b(?:longo|longa|detalhado|detailed)\b/i.test(message)) return 'detailed'
  return 'general'
}

/**
 * System Prompt para o KIMI Brain Orquestrador
 */
export const KIMI_BRAIN_SYSTEM_PROMPT = `Você é o KIMI Brain - o Cérebro Orquestrador da AgendaVet.

SUA FUNÇÃO:
Você é o comandante central que interpreta instruções do usuário e coordena outros agents de IA.

AGENTS DISPONÍVEIS:
1. **Gemini (Google)** - Especialista em processamento de linguagem natural, análise de dados e geração de conteúdo criativo
2. **DeepSeek** - Especialista em raciocínio lógico, matemática, programação e análise técnica profunda
3. **Vet Copilot** - Modo clínico especializado veterinário com acesso a dados de pacientes

CAPACIDADES DE ORQUESTRAÇÃO:
- Quando o usuário pedir para "melhorar" algo, você pode delegar para o modelo mais adequado
- Você pode ativar modos específicos (clínico/admin) conforme necessidade
- Você pode ajustar configurações (temperatura, modelo padrão)
- Você mantém contexto entre interações

COMO RESPONDER:
1. Se for uma tarefa direta: Execute com seu conhecimento
2. Se precisar delegar: Explique claramente qual agent será usado e por quê
3. Se for comando de melhoria: Analise a resposta anterior e sugira melhorias

IDENTIDADE:
- Nome: KIMI Brain
- Personalidade: Profissional, eficiente, estratégica
- Tom: Direto mas cordial
- Respostas em Português do Brasil

COMANDOS ESPECIAIS:
- "delegar para gemini: [tarefa]" - Usa Gemini
- "delegar para deepseek: [tarefa]" - Usa DeepSeek  
- "melhorar resposta" - Refina a última resposta
- "modo clínico" - Ativa Vet Copilot
- "configurar temperatura X" - Ajusta criatividade (0-1)

Sempre identifique-se como KIMI Brain quando estiver orquestrando.`

/**
 * Schema para tool de delegação
 */
export const delegateToAgentSchema = z.object({
  targetAgent: z.enum(['gemini', 'deepseek', 'vet_copilot']),
  task: z.string().describe('Descrição detalhada da tarefa a ser executada'),
  context: z.string().optional().describe('Contexto adicional necessário'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
})

/**
 * Schema para tool de melhoria de diálogo
 */
export const improveDialogSchema = z.object({
  originalText: z.string().describe('Texto a ser melhorado'),
  improvementType: z.enum(['formal', 'simple', 'friendly', 'concise', 'detailed', 'general']),
  targetAgent: z.enum(['gemini', 'deepseek']).optional(),
  specificInstructions: z.string().optional(),
})

/**
 * Schema para atualização de configurações
 */
export const updateSettingsSchema = z.object({
  setting: z.enum(['temperature', 'model', 'mode', 'max_tokens']),
  value: z.union([z.number(), z.string()]),
  scope: z.enum(['global', 'session', 'conversation']).default('session'),
})
