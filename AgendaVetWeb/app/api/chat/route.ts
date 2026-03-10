/**
 * Assistente IA - API Route Híbrida
 * 
 * Endpoint: POST /api/chat
 * 
 * Suporta dois modos:
 * - 'admin': Assistente administrativo geral (Anthropic Claude)
 * - 'clinical': Vet Copilot com tools clínicas (Google Gemini)
 */

import { streamText, convertToModelMessages, UIMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import {
  getPetInfo,
  getMedicalHistory,
  getVaccinationStatus,
  getCurrentMedications,
  getRecentExams,
  calculateMedicationDosage,
  searchClinicalKnowledge
} from '@/lib/vet-copilot/tools'
import { VET_COPILOT_SYSTEM_PROMPT, generatePetContext } from '@/lib/vet-copilot/system-prompt'
import { createClient } from '@supabase/supabase-js'

// Provedores de modelos
const deepseekProvider = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

// Configuração explícita do Google para aceitar prefixos Expo
import { createGoogleGenerativeAI } from '@ai-sdk/google'
const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
})


// Inicializa cliente Supabase para server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    const body = await req.json()
    const {
      messages,
      model,
      temperature,
      systemPrompt,
      mode = 'admin', // 'admin' | 'clinical'
      petId,
    }: {
      messages: UIMessage[]
      model?: string
      temperature?: number
      systemPrompt?: string
      mode?: 'admin' | 'clinical'
      petId?: string
    } = body

    // Validações básicas
    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // 1. Orquestrador: Classificação de Intenção
    let detectedMode = mode;

    if (mode === 'admin') {
      try {
        const lastMessage = messages[messages.length - 1];
        const content = lastMessage.parts
          ? (lastMessage as any).parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ')
          : (lastMessage as any).content || (lastMessage as any).text || '';

        const clinicalKeywords = ['peso', 'sintoma', 'remédio', 'medicação', 'dose', 'dosagem', 'exame', 'vacina', 'histórico', 'médico', 'clínico', 'doença', 'tratamento'];
        const isLikelyClinical = clinicalKeywords.some(kw => content.toLowerCase().includes(kw));

        if (isLikelyClinical) {
          detectedMode = 'clinical';
          console.log('[Orchestrator] Detected CLINICAL intent via keywords');
        }
      } catch (err) {
        console.warn('[Orchestrator] Intent classification failed:', err);
      }
    }

    // Determina o modelo e motor de cálculo baseado no modo (detectado ou solicitado)
    let modelInstance;
    let calculatorEngine: 'gemini' | 'deepseek' = 'deepseek';

    // Fallback: Se DeepSeek não estiver configurado, usa Gemini para tudo
    const isDeepseekAvailable = !!(process.env.DEEPSEEK_API_KEY || process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY);

    if (detectedMode === 'clinical' && isDeepseekAvailable) {
      modelInstance = deepseekProvider('deepseek-chat');
      calculatorEngine = 'gemini';
    } else {
      // Usa Gemini 1.5 Pro por padrão (mais estável e disponível)
      modelInstance = googleProvider('gemini-1.5-pro');
      calculatorEngine = 'deepseek';
    }


    // Modo Clinical: Vet Copilot com tools e cérebro DeepSeek
    if (detectedMode === 'clinical') {
      try {
        const temp = temperature ?? 0.3

        // Contexto do pet (se fornecido)
        let petContext = ''
        if (petId) {
          try {
            const supabase = createClient(supabaseUrl, supabaseServiceKey)

            const { data: pet } = await supabase
              .from('pets')
              .select('*, profiles:user_id (full_name, phone, email)')
              .eq('id', petId)
              .single()

            if (pet) {
              petContext = generatePetContext({
                pet: {
                  id: pet.id,
                  name: pet.name,
                  species: pet.type || 'unknown',
                  breed: pet.breed || '',
                  dateOfBirth: pet.age,
                  weight: parseFloat(pet.weight) || 0,
                },
                owner: pet.profiles ? {
                  firstName: (pet.profiles.full_name || '').split(' ')[0],
                  lastName: (pet.profiles.full_name || '').split(' ').slice(1).join(' '),
                  phone: pet.profiles.phone || '',
                } : undefined,
              })
            }
          } catch (error) {
            console.warn('Failed to load pet context:', error)
          }
        }

        const clinicalSystemPrompt = `${VET_COPILOT_SYSTEM_PROMPT}\n\nVocê é o Subagente Clínico Especializado alimentado pelo DeepSeek no sistema AgendaVet. Seu foco é precisão técnica, lógica médica e uso de ferramentas clínicas.\n\n${petContext}`

        // Define as tools disponíveis para o modelo
        const tools = {
          get_pet_info: {
            description: 'Busca informações básicas do pet (nome, espécie, raça, peso, tutor)',
            inputSchema: z.object({
              petId: z.string().uuid().describe('ID do pet no sistema'),
            }),
            async execute({ petId }: { petId: string }) {
              return await getPetInfo({ petId })
            },
          },

          get_medical_history: {
            description: 'Busca histórico médico completo do pet (observações, exames, vacinas, prescrições)',
            inputSchema: z.object({
              petId: z.string().uuid().describe('ID do pet no sistema'),
            }),
            async execute({ petId }: { petId: string }) {
              return await getMedicalHistory({ petId })
            },
          },

          get_vaccination_status: {
            description: 'Verifica status vacinal do pet e vacinas pendentes',
            inputSchema: z.object({
              petId: z.string().uuid().describe('ID do pet no sistema'),
            }),
            async execute({ petId }: { petId: string }) {
              return await getVaccinationStatus({ petId })
            },
          },

          get_current_medications: {
            description: 'Lista medicações atualmente em uso pelo pet',
            inputSchema: z.object({
              petId: z.string().uuid().describe('ID do pet no sistema'),
            }),
            async execute({ petId }: { petId: string }) {
              return await getCurrentMedications({ petId })
            },
          },

          get_recent_exams: {
            description: 'Busca exames laboratoriais e de imagem recentes do pet',
            inputSchema: z.object({
              petId: z.string().uuid().describe('ID do pet no sistema'),
            }),
            async execute({ petId }: { petId: string }) {
              return await getRecentExams({ petId })
            },
          },

          calculate_medication_dosage: {
            description: 'Calcula dose de medicação baseada no peso e espécie do animal. Inclui considerações de segurança.',
            inputSchema: z.object({
              medication: z.string().describe('Nome do medicamento (ex: Meloxicam, Carprofeno, Amoxicilina)'),
              weight: z.number().positive().describe('Peso atual do animal em kg'),
              species: z.enum(['canine', 'feline', 'avian', 'reptile', 'rodent', 'other'])
                .describe('Espécie do animal'),
              condition: z.string().optional().describe('Condição especial do paciente (ex: renal, hepático, geriátrico)'),
              age: z.string().optional().describe('Idade ou faixa etária (ex: 3 anos, filhote, idoso)'),
            }),
            async execute(params: {
              medication: string;
              weight: number;
              species: 'canine' | 'feline' | 'avian' | 'reptile' | 'rodent' | 'other';
              condition?: string;
              age?: string;
            }) {
              return await calculateMedicationDosage({ ...params, calculatorEngine })
            },
          },

          search_clinical_knowledge: {
            description: 'Busca informações em base de conhecimento veterinário. Retorna diretrizes e fontes relevantes.',
            inputSchema: z.object({
              query: z.string().describe('Termo de busca clínica'),
              species: z.string().optional().describe('Espécie animal (ex: canine, feline)'),
              limit: z.number().default(5).describe('Número máximo de resultados'),
            }),
            async execute(params: { query: string; species?: string; limit: number }) {
              return await searchClinicalKnowledge({ ...params, limit: params.limit || 5 })
            },
          },
        }

        const result = streamText({
          model: modelInstance,
          system: clinicalSystemPrompt,
          messages: await convertToModelMessages(messages),
          temperature: temp,
          tools: tools,
          toolChoice: 'auto',
          onFinish: ({ usage }) => {
            const duration = Date.now() - startTime
            console.log(`[Clinical Mode] Request completed in ${duration}ms`)
          },
        })

        return result.toUIMessageStreamResponse()
      } catch (clinicalError) {
        console.error('[Chat API] Clinical Mode Error:', clinicalError)
        // Fallback para modo admin se o clínico falhar drasticamente
        detectedMode = 'admin'
        modelInstance = googleProvider('gemini-1.5-pro')
      }
    }

    // Modo Admin: Assistente geral com Gemini 2.5 Pro
    let modelMessages;
    try {
      modelMessages = await convertToModelMessages(messages);
    } catch (msgError) {
      console.error('[Chat API] Message conversion error:', msgError);
      return Response.json({
        error: 'Failed to convert messages format',
        details: msgError instanceof Error ? msgError.message : String(msgError)
      }, { status: 400 });
    }

    const result = streamText({
      model: modelInstance,
      system: systemPrompt || 'You are a helpful veterinary administrative assistant for AgendaVet powered by Gemini. You manage schedules, pricing, and general questions.',
      messages: modelMessages,
      temperature: temperature ?? 0.7,
    })


    return result.toUIMessageStreamResponse()

  } catch (error) {
    console.error('[Chat API] Error:', error)

    return Response.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Handler para métodos não suportados
export async function GET() {
  return Response.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}
