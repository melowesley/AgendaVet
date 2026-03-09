/**
 * Assistente IA - API Route para AgendaVetVet (Expo Router)
 * 
 * Endpoint: /api/chat
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
} from '../../lib/vet-copilot/tools'
import { VET_COPILOT_SYSTEM_PROMPT, generatePetContext } from '../../lib/vet-copilot/system-prompt'

import { createClient } from '@supabase/supabase-js'

// Provedores de modelos
const deepseekProvider = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
})

// Inicializa cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL! || process.env.EXPO_PUBLIC_SUPABASE_URL!
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
            mode = 'admin',
            petId,
        }: {
            messages: UIMessage[]
            model?: string
            temperature?: number
            systemPrompt?: string
            mode?: 'admin' | 'clinical'
            petId?: string
        } = body

        if (!messages || !Array.isArray(messages)) {
            return Response.json({ error: 'Messages array is required' }, { status: 400 })
        }

        // Preparar mensagens com try-catch
        let modelMessages;
        try {
            modelMessages = await convertToModelMessages(messages);
        } catch (msgError) {
            console.error('[Chat API] Message conversion error:', msgError);
            return Response.json({ error: 'Failed to convert messages format' }, { status: 400 });
        }

        // 1. Orquestrador: Classificação de Intenção
        let detectedMode = mode;

        if (mode === 'admin') {
            try {
                const lastMessage = messages[messages.length - 1];
                const content = lastMessage.parts
                    ? lastMessage.parts.filter(p => p.type === 'text').map(p => (p as any).text).join(' ')
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

        if (detectedMode === 'clinical') {
            modelInstance = deepseekProvider('deepseek-chat');
            calculatorEngine = 'gemini';
        } else {
            modelInstance = google('gemini-2.5-pro');
            calculatorEngine = 'deepseek';
        }

        // Modo Clinical: Vet Copilot com tools e cérebro DeepSeek
        if (detectedMode === 'clinical') {

            const temp = temperature ?? 0.3
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
                } catch (ctxError) {
                    console.warn('Failed to load pet context:', ctxError)
                }
            }

            const clinicalSystemPrompt = `${VET_COPILOT_SYSTEM_PROMPT}\n\nVocê é o Subagente Clínico Especializado (DeepSeek). Seu foco é precisão técnica e uso de ferramentas médicas.\n\n${petContext}`

            const tools = {
                get_pet_info: {
                    description: 'Busca informações básicas do pet',
                    inputSchema: z.object({ petId: z.string().uuid() }),
                    async execute({ petId }: { petId: string }) { return await getPetInfo({ petId }) },
                },
                get_medical_history: {
                    description: 'Busca histórico médico completo do pet',
                    inputSchema: z.object({ petId: z.string().uuid() }),
                    async execute({ petId }: { petId: string }) { return await getMedicalHistory({ petId }) },
                },
                get_vaccination_status: {
                    description: 'Verifica status vacinal do pet',
                    inputSchema: z.object({ petId: z.string().uuid() }),
                    async execute({ petId }: { petId: string }) { return await getVaccinationStatus({ petId }) },
                },
                get_current_medications: {
                    description: 'Lista medicações atualmente em uso',
                    inputSchema: z.object({ petId: z.string().uuid() }),
                    async execute({ petId }: { petId: string }) { return await getCurrentMedications({ petId }) },
                },
                get_recent_exams: {
                    description: 'Busca exames laboratoriais recentes',
                    inputSchema: z.object({ petId: z.string().uuid() }),
                    async execute({ petId }: { petId: string }) { return await getRecentExams({ petId }) },
                },
                calculate_medication_dosage: {
                    description: 'Calcula dose de medicação baseada no peso e espécie',
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
                    inputSchema: z.object({
                        query: z.string(),
                        species: z.string().optional(),
                        limit: z.number().default(5),
                    }),
                    async execute(params: any) { return await searchClinicalKnowledge(params) },
                },
            }

            const result = streamText({
                model: modelInstance,
                system: clinicalSystemPrompt,
                messages: modelMessages,
                temperature: temp,
                tools: tools,
                toolChoice: 'auto',
                onFinish: () => {
                    console.log(`[Clinical Mode] Request completed in ${Date.now() - startTime}ms`)
                },
            })

            return result.toUIMessageStreamResponse()
        }

        const result = streamText({
            model: modelInstance,
            system: systemPrompt || 'You are a helpful veterinary administrative assistant (Gemini).',
            messages: modelMessages,
            temperature: temperature ?? 0.7,
        })

        return result.toUIMessageStreamResponse()

    } catch (error) {
        console.error('[Chat API] Fatal Error:', error)
        return Response.json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 })
    }
}

export async function GET() {
    return Response.json({ status: 'API is running. Use POST to chat.' })
}
