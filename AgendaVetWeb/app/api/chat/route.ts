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
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
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

    // Validar estrutura das mensagens para evitar erro no convertToModelMessages
    if (!messages.every(msg => msg && typeof msg === 'object' && 'content' in msg && 'role' in msg)) {
      return Response.json(
        { error: 'Invalid message format. Each message must have content and role properties.' },
        { status: 400 }
      )
    }

    // Determina o modelo e provedor a ser usado
    let modelInstance;
    const modelRequested = model || (mode === 'clinical' ? 'gemini-1.5-pro' : 'gemini-1.5-flash');

    // Define qual será o motor de cálculo (o oposto do cérebro)
    let calculatorEngine: 'gemini' | 'deepseek' = 'deepseek';

    if (modelRequested.includes('deepseek')) {
      modelInstance = deepseekProvider('deepseek-chat');
      calculatorEngine = 'gemini'; // Se o cérebro é DeepSeek, cálculo é Gemini
    } else if (modelRequested.includes('gemini')) {
      modelInstance = google(modelRequested);
      calculatorEngine = 'deepseek'; // Se o cérebro é Gemini, cálculo é DeepSeek
    } else {
      // Fallback para gemini
      modelInstance = google('gemini-1.5-pro');
      calculatorEngine = 'deepseek';
    }

    // Modo Clinical: Vet Copilot com tools
    if (mode === 'clinical') {
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

      const clinicalSystemPrompt = `${VET_COPILOT_SYSTEM_PROMPT}\n\n${petContext}`

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

      try {
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
      } catch (conversionError) {
        console.error('[Chat API] Error converting messages in clinical mode:', conversionError)
        return Response.json(
          {
            error: 'Failed to process messages',
            message: conversionError instanceof Error ? conversionError.message : 'Unknown conversion error',
          },
          { status: 500 }
        )
      }
    }

    // Modo Admin: Assistente geral (padrão)
    try {
      const result = streamText({
        model: modelInstance,
        system: systemPrompt || 'You are a helpful veterinary assistant.',
        messages: await convertToModelMessages(messages),
        temperature: temperature ?? 0.7,
      })

      return result.toUIMessageStreamResponse()
    } catch (conversionError) {
      console.error('[Chat API] Error converting messages in admin mode:', conversionError)
      return Response.json(
        {
          error: 'Failed to process messages',
          message: conversionError instanceof Error ? conversionError.message : 'Unknown conversion error',
        },
        { status: 500 }
      )
    }

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
