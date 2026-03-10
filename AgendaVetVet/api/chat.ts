/**
 * Assistente IA - Vercel Serverless Function para AgendaVetVet
 * 
 * Endpoint: /api/chat
 */

import { streamText, convertToModelMessages, UIMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import {
    getPetInfo,
    getMedicalHistory,
    getVaccinationStatus,
    getCurrentMedications,
    getRecentExams,
    calculateMedicationDosage,
    searchClinicalKnowledge
} from '../lib/vet-copilot/tools'
import { VET_COPILOT_SYSTEM_PROMPT, generatePetContext } from '../lib/vet-copilot/system-prompt'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    const startTime = Date.now()

    try {
        // 0. Validação de Variáveis de Ambiente
        const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

        if (!deepseekKey || !geminiKey) {
            return Response.json({
                error: 'Configuration Error',
                message: 'Missing API Keys',
                debug: {
                    hasDeepseek: !!deepseekKey,
                    hasGemini: !!geminiKey,
                    envKeys: Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('API'))
                }
            }, { status: 500 });
        }

        const body = await req.json()
        const {
            messages,
            temperature,
            systemPrompt,
            mode = 'admin',
            petId,
        }: {
            messages: UIMessage[]
            temperature?: number
            systemPrompt?: string
            mode?: 'admin' | 'clinical'
            petId?: string
        } = body

        if (!messages || !Array.isArray(messages)) {
            return Response.json({ error: 'Messages array is required' }, { status: 400 })
        }

        // Provedores
        const deepseekProvider = createOpenAI({
            apiKey: deepseekKey,
            baseURL: 'https://api.deepseek.com',
        });
        const googleProvider = createGoogleGenerativeAI({
            apiKey: geminiKey
        });

        // Preparar mensagens
        let modelMessages;
        try {
            modelMessages = await convertToModelMessages(messages);
        } catch (msgError) {
            return Response.json({
                error: 'Format Error',
                message: msgError instanceof Error ? msgError.message : String(msgError)
            }, { status: 400 });
        }

        // 1. Orquestrador: Classificação de Intenção
        let detectedMode = mode;
        if (mode === 'admin') {
            try {
                const lastMessage = messages[messages.length - 1];
                const content = lastMessage?.parts
                    ? lastMessage.parts
                        .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
                        .map((p: any) => p.text)
                        .join(' ')
                    : ((lastMessage as any)?.content || (lastMessage as any)?.text || '');

                const normalizedContent = content.toLowerCase();
                const clinicalKeywords = ['peso', 'sintoma', 'remédio', 'medicação', 'dose', 'dosagem', 'exame', 'vacina', 'histórico', 'médico', 'clínico', 'doença', 'tratamento'];
                if (clinicalKeywords.some(kw => normalizedContent.includes(kw))) {
                    detectedMode = 'clinical';
                }
            } catch (err) {
                console.warn('[Orchestrator] Intent classification failed', err);
            }
        }

        // Determina o modelo
        let modelInstance;
        let calculatorEngine: 'gemini' | 'deepseek' = 'deepseek';

        if (detectedMode === 'clinical') {
            modelInstance = deepseekProvider('deepseek-chat');
            calculatorEngine = 'gemini';
        } else {
            modelInstance = googleProvider('gemini-2.5-pro');
            calculatorEngine = 'deepseek';
        }

        // Modo Clinical
        if (detectedMode === 'clinical') {
            let petContext = ''
            if (petId && supabaseUrl && supabaseServiceKey) {
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
                    console.warn('Context load failed', ctxError)
                }
            }

            const clinicalSystemPrompt = `${VET_COPILOT_SYSTEM_PROMPT}\n\nVocê é o Subagente Clínico Especializado (DeepSeek). Seu foco é precisão técnica.\n\n${petContext}`

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
                    description: 'Calcula dose de medicação',
                    inputSchema: z.object({
                        medication: z.string(),
                        weight: z.number().positive(),
                        species: z.enum(['canine', 'feline', 'avian', 'reptile', 'rodent', 'other']),
                    }),
                    async execute(params: any) { return await calculateMedicationDosage({ ...params, calculatorEngine }) },
                },
                search_clinical_knowledge: {
                    description: 'Busca em base de conhecimento veterinário',
                    inputSchema: z.object({
                        query: z.string(),
                        limit: z.number().default(5),
                    }),
                    async execute(params: any) { return await searchClinicalKnowledge(params) },
                },
            }

            const result = streamText({
                model: modelInstance,
                system: clinicalSystemPrompt,
                messages: modelMessages,
                temperature: temperature ?? 0.3,
                tools: tools,
                toolChoice: 'auto',
            })

            return result.toUIMessageStreamResponse()
        }

        // Modo Admin
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
            error: 'Server Error',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 })
    }
}

export async function GET() {
    return Response.json({ status: 'OK', version: '2.5.1' })
}
