import { streamText, convertToModelMessages } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createServiceSupabaseClient } from '@/lib/supabase/service'
import type { Database } from '@/lib/supabase/types'

// Configuração manual da chave para não depender do ambiente automático
const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || 
          process.env.EXPO_PUBLIC_GEMINI_API_KEY || 
          process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
          "AIzaSyCFLleAhxnfG39Wos7mC8icoPc8gLp-mjo" // Sua chave do teste anterior como garantia
});

const googleModel = googleProvider('gemini-3-flash-preview');

export async function POST(req: Request) {
  // ... resto do código igual ao anterior
  const startTime = Date.now()

  try {
    const body = await req.json()
    const { messages, mode = 'admin', petId } = body

    console.log("[DEBUG] Dados recebidos no body:", { mode, petId });
    console.log(">>>> [REQUISIÇÃO RECEBIDA] PetID:", petId);

    // Converte as mensagens para o padrão do SDK
    const modelMessages = await convertToModelMessages(messages);

    // Busca dados completos do prontuário se petId foi fornecido
    let fullMedicalContext = ''
    if (petId) {
      try {
        const supabase = createServiceSupabaseClient()
        
        // Busca multitarefa: dados básicos + histórico clínico completo
        const [
          petDataResult,
          anamnesisResult,
          examsResult,
          vaccinesResult,
          prescriptionsResult,
          hospitalizationsResult,
          pathologiesResult,
          observationsResult,
          weightRecordsResult
        ] = await Promise.all([
          // Dados básicos do pet
          supabase
            .from('pets')
            .select('*')
            .eq('id', petId)
            .single() as { data: any, error: any },
          
          // Anamnese (últimas 5)
          supabase
            .from('anamnesis')
            .select('*')
            .eq('pet_id', petId)
            .order('created_at', { ascending: false })
            .limit(5) as { data: any[], error: any },
          
          // Exames (últimos 5)
          supabase
            .from('pet_exams')
            .select('*')
            .eq('pet_id', petId)
            .order('exam_date', { ascending: false })
            .limit(5) as { data: any[], error: any },
          
          // Vacinas (últimas 10)
          supabase
            .from('pet_vaccines')
            .select('*')
            .eq('pet_id', petId)
            .order('application_date', { ascending: false })
            .limit(10) as { data: any[], error: any },
          
          // Prescrições (últimas 5)
          supabase
            .from('pet_prescriptions')
            .select('*')
            .eq('pet_id', petId)
            .order('prescription_date', { ascending: false })
            .limit(5) as { data: any[], error: any },
          
          // Hospitalizações (últimas 3)
          supabase
            .from('pet_hospitalizations')
            .select('*')
            .eq('pet_id', petId)
            .order('admission_date', { ascending: false })
            .limit(3) as { data: any[], error: any },
          
          // Patologias (últimas 5)
          supabase
            .from('pet_pathologies')
            .select('*')
            .eq('pet_id', petId)
            .order('diagnosis_date', { ascending: false })
            .limit(5) as { data: any[], error: any },
          
          // Observações (últimas 5)
          supabase
            .from('pet_observations')
            .select('*')
            .eq('pet_id', petId)
            .order('observation_date', { ascending: false })
            .limit(5) as { data: any[], error: any },
          
          // Registros de peso (últimos 5)
          supabase
            .from('pet_weight_records')
            .select('*')
            .eq('pet_id', petId)
            .order('date', { ascending: false })
            .limit(5) as { data: any[], error: any }
        ])
        
        console.log(">>>> [SUPABASE PET DATA]:", petDataResult.data);
        console.log(">>>> [SUPABASE PET ERROR]:", petDataResult.error);
        console.log(">>>> [SUPABASE ANAMNESIS]:", anamnesisResult.data?.length || 0, "registros");
        console.log(">>>> [SUPABASE EXAMS]:", examsResult.data?.length || 0, "registros");
        console.log(">>>> [SUPABASE VACCINES]:", vaccinesResult.data?.length || 0, "registros");
        
        // Monta o contexto médico completo
        if (petDataResult.data && !petDataResult.error) {
          const pet = petDataResult.data
          
          fullMedicalContext = `\n\n=== PRONTUÁRIO COMPLETO DO PACIENTE ===\n` +
            `📋 DADOS BÁSICOS:\n` +
            `- Nome: ${pet.name}\n` +
            `- Espécie: ${pet.type}\n` +
            `- Raça: ${pet.breed || 'Não informada'}\n` +
            `- Idade: ${pet.age || 'Não informada'}\n` +
            `- Peso atual: ${pet.weight || 'Não informado'}\n` +
            `- ID: ${pet.id}\n\n` +
            
            `🏥 ANAMNESE (Últimas ${anamnesisResult.data?.length || 0}):\n` +
            (anamnesisResult.data?.map((a: any, i: number) => 
              `${i+1}. ${new Date(a.created_at).toLocaleDateString('pt-BR')} - ${a.queixa_principal || 'Sem queixa'}\n` +
              `   Temperatura: ${a.temperatura || 'N/A'}°C | FC: ${a.fc || 'N/A'} bpm | FR: ${a.fr || 'N/A'} mpm\n` +
              `   Sistemas: ${Object.keys(a.sistema_cardiorespiratório || {}).length + Object.keys(a.sistema_gastrintestinal || {}).length + Object.keys(a.sistema_neurologico || {}).length} sistemas avaliados`
            ).join('\n') || 'Nenhuma anamnese registrada') + '\n\n' +
            
            `🔬 EXAMES (Últimos ${examsResult.data?.length || 0}):\n` +
            (examsResult.data?.map((e: any, i: number) => 
              `${i+1}. ${new Date(e.exam_date).toLocaleDateString('pt-BR')} - ${e.exam_type}\n` +
              `   Resultados: ${e.results?.substring(0, 100) || 'Pendente'}${e.results?.length > 100 ? '...' : ''}\n` +
              `   Veterinário: ${e.veterinarian || 'N/A'}`
            ).join('\n') || 'Nenhum exame registrado') + '\n\n' +
            
            `💉 VACINAS (Últimas ${vaccinesResult.data?.length || 0}):\n` +
            (vaccinesResult.data?.map((v: any, i: number) => 
              `${i+1}. ${new Date(v.application_date).toLocaleDateString('pt-BR')} - ${v.vaccine_name}\n` +
              `   Próxima dose: ${v.next_dose_date ? new Date(v.next_dose_date).toLocaleDateString('pt-BR') : 'N/A'}\n` +
              `   Lote: ${v.batch_number || 'N/A'} | Veterinário: ${v.veterinarian || 'N/A'}`
            ).join('\n') || 'Nenhuma vacina registrada') + '\n\n' +
            
            `💊 PRESCRIÇÕES (Últimas ${prescriptionsResult.data?.length || 0}):\n` +
            (prescriptionsResult.data?.map((p: any, i: number) => 
              `${i+1}. ${new Date(p.prescription_date).toLocaleDateString('pt-BR')} - ${p.medication_name}\n` +
              `   Dosagem: ${p.dosage || 'N/A'} | Frequência: ${p.frequency || 'N/A'}\n` +
              `   Duração: ${p.duration || 'N/A'} | Veterinário: ${p.veterinarian || 'N/A'}`
            ).join('\n') || 'Nenhuma prescrição registrada') + '\n\n' +
            
            `🏥 HOSPITALIZAÇÕES (Últimas ${hospitalizationsResult.data?.length || 0}):\n` +
            (hospitalizationsResult.data?.map((h: any, i: number) => 
              `${i+1}. ${new Date(h.admission_date).toLocaleDateString('pt-BR')} - ${h.reason}\n` +
              `   Status: ${h.status} | Alta: ${h.discharge_date ? new Date(h.discharge_date).toLocaleDateString('pt-BR') : 'Em andamento'}\n` +
              `   Diagnóstico: ${h.diagnosis?.substring(0, 100) || 'Pendente'}${h.diagnosis?.length > 100 ? '...' : ''}`
            ).join('\n') || 'Nenhuma hospitalização registrada') + '\n\n' +
            
            `🦠 PATOLOGIAS (Últimas ${pathologiesResult.data?.length || 0}):\n` +
            (pathologiesResult.data?.map((p: any, i: number) => 
              `${i+1}. ${new Date(p.diagnosis_date).toLocaleDateString('pt-BR')} - ${p.name}\n` +
              `   Status: ${p.status} | Tratamento: ${p.treatment?.substring(0, 100) || 'Pendente'}${p.treatment?.length > 100 ? '...' : ''}`
            ).join('\n') || 'Nenhuma patologia registrada') + '\n\n' +
            
            `📝 OBSERVAÇÕES (Últimas ${observationsResult.data?.length || 0}):\n` +
            (observationsResult.data?.map((o: any, i: number) => 
              `${i+1}. ${new Date(o.observation_date).toLocaleDateString('pt-BR')} - ${o.title || 'Observação'}\n` +
              `   Categoria: ${o.category || 'Geral'}\n` +
              `   ${o.observation?.substring(0, 150) || 'Sem detalhes'}${o.observation?.length > 150 ? '...' : ''}`
            ).join('\n') || 'Nenhuma observação registrada') + '\n\n' +
            
            `⚖️ REGISTROS DE PESO (Últimos ${weightRecordsResult.data?.length || 0}):\n` +
            (weightRecordsResult.data?.map((w: any, i: number) => 
              `${i+1}. ${new Date(w.date).toLocaleDateString('pt-BR')} - ${w.weight}kg\n` +
              `   Notas: ${w.notes || 'N/A'}`
            ).join('\n') || 'Nenhum registro de peso') + '\n\n' +
            
            `=== FIM DO PRONTUÁRIO ===\n`
            
          console.log(`[AgendaVet] Prontuário completo montado para ${pet.name}`)
        } else {
          console.warn(`[AgendaVet] Erro ao buscar dados do pet ${petId}:`, petDataResult.error?.message)
        }
      } catch (dbError) {
        console.warn(`[AgendaVet] Erro na conexão com o banco:`, dbError)
      }
    }

    console.log(`[AgendaVet] Iniciando chat no modo: ${mode} com Gemini 3-flash-preview${petId ? ' (com contexto do pet)' : ''}`);

    const baseSystemPrompt = 'Você é o assistente inteligente da AgendaVet. Ajude o veterinário com questões administrativas e clínicas. Abaixo estão todos os dados clínicos em tempo real do banco de dados do AgendaVet para este paciente. Use-os para responder com precisão e contexto completo.'
    const fullSystemPrompt = baseSystemPrompt + fullMedicalContext

    return streamText({
      model: googleModel,
      system: fullSystemPrompt,
      messages: modelMessages,
      onFinish: () => console.log(`✓ Resposta finalizada em ${Date.now() - startTime}ms`),
    }).toUIMessageStreamResponse();

  } catch (error: any) {
    console.error('❌ Erro na Rota de Chat:', error);
    return Response.json({ 
      error: 'Erro na comunicação com a IA',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: 'Método não permitido.' }, { status: 405 });
}