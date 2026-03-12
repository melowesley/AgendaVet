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

    // 2. Determina o modelo e motor de cálculo
    const isDeepseekAvailable = !!(process.env.DEEPSEEK_API_KEY || process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY);
    let modelInstance;
    let calculatorEngine: 'gemini' | 'deepseek' = 'deepseek';

    // Prioriza o modelo solicitado pelo cliente (Web ou Mobile)
    const requestedModel = model?.toLowerCase();

    if (requestedModel === 'deepseek' && isDeepseekAvailable) {
      modelInstance = deepseekProvider('deepseek-chat');
      calculatorEngine = 'gemini';
    } else if (requestedModel === 'gemini') {
      modelInstance = googleProvider('gemini-1.5-pro');
      calculatorEngine = 'deepseek';
    } else if (detectedMode === 'clinical' && isDeepseekAvailable) {
      // Fallback padrão para modo clínico
      modelInstance = deepseekProvider('deepseek-chat');
      calculatorEngine = 'gemini';
    } else {
      // Fallback absoluto
      modelInstance = googleProvider('gemini-1.5-pro');
      calculatorEngine = 'deepseek';
    }

    // 3. Preparar Mensagens
    let modelMessages;
    try {
      modelMessages = await convertToModelMessages(messages);
    } catch (msgError) {
      console.error('[Chat API] Message conversion error:', msgError);
      return Response.json({ error: 'Failed to convert messages' }, { status: 400 });
    }

    // 4. Execução do Stream
    try {
      if (detectedMode === 'clinical') {
        let petContext = '';
        if (petId) {
          try {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            const { data: pet } = await supabase
              .from('pets')
              .select('*, profiles:user_id (full_name, phone, email)')
              .eq('id', petId)
              .single();

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
              });
            }
          } catch (ctxError) {
            console.warn('[Chat API] Failed to load pet context:', ctxError);
          }
        }

        const clinicalSystemPrompt = `${VET_COPILOT_SYSTEM_PROMPT}\n\nVocê é o Subagente Clínico Especializado na AgendaVet. Foco em precisão técnica e ferramentas.\n\n${petContext}`;

        return streamText({
          model: modelInstance,
          system: clinicalSystemPrompt,
          messages: modelMessages,
          temperature: temperature ?? 0.3,
          tools: {
            get_pet_info: {
              description: 'Busca informações básicas do pet',
              inputSchema: z.object({ petId: z.string().uuid() }),
              async execute({ petId }: { petId: string }) { return await getPetInfo({ petId }) },
            },
            get_medical_history: {
              description: 'Busca histórico médico completo',
              inputSchema: z.object({ petId: z.string().uuid() }),
              async execute({ petId }: { petId: string }) { return await getMedicalHistory({ petId }) },
            },
            get_vaccination_status: {
              description: 'Verifica status vacinal',
              inputSchema: z.object({ petId: z.string().uuid() }),
              async execute({ petId }: { petId: string }) { return await getVaccinationStatus({ petId }) },
            },
            get_current_medications: {
              description: 'Lista medicações atuais',
              inputSchema: z.object({ petId: z.string().uuid() }),
              async execute({ petId }: { petId: string }) { return await getCurrentMedications({ petId }) },
            },
            get_recent_exams: {
              description: 'Busca exames recentes',
              inputSchema: z.object({ petId: z.string().uuid() }),
              async execute({ petId }: { petId: string }) { return await getRecentExams({ petId }) },
            },
            calculate_medication_dosage: {
              description: 'Calcula dose de medicação',
              inputSchema: z.object({
                medication: z.string(),
                weight: z.number().positive(),
                species: z.enum(['canine', 'feline', 'avian', 'reptile', 'rodent', 'other']),
                condition: z.string().optional(),
                age: z.string().optional(),
              }),
              async execute(params: any) { return await calculateMedicationDosage({ ...params, calculatorEngine }) },
            },
            search_clinical_knowledge: {
              description: 'Busca em base de conhecimento veterinário',
              inputSchema: z.object({ query: z.string(), species: z.string().optional() }),
              async execute(params: any) { return await searchClinicalKnowledge(params) },
            },
          },
          toolChoice: 'auto',
          onFinish: () => console.log(`[Clinical Mode] Done in ${Date.now() - startTime}ms`),
        }).toUIMessageStreamResponse();
      }

      // Modo Admin (Fallback or Direct)
      return streamText({
        model: modelInstance,
        system: (systemPrompt || 'You are a helpful veterinary assistant for AgendaVet.').replace(/VetCRM/g, 'AgendaVet'),
        messages: modelMessages,
        temperature: temperature ?? 0.7,
        onFinish: () => console.log(`[Admin Mode] Done in ${Date.now() - startTime}ms`),
      }).toUIMessageStreamResponse();

    } catch (streamError) {
      console.error('[Chat API] Stream Error:', streamError);
      return Response.json({
        error: 'Stream error',
        message: streamError instanceof Error ? streamError.message : String(streamError)
      }, { status: 500 });
    }
  } catch (fatalError) {
    console.error('[Chat API] Fatal Error:', fatalError);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handler para métodos não suportados
export async function GET() {
  return Response.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}
