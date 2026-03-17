/**
 * AgentVet Clinical Copilot - Tools
 * 
 * Definições das ferramentas que a IA pode usar para acessar dados do sistema.
 * Estas tools são executadas no servidor e retornam dados estruturados para o modelo.
 */

import { supabase } from '../supabase';
import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

const gemini = google('gemini-1.5-pro');

// Esquemas de validação para parâmetros das tools
const PetIdSchema = z.object({
  petId: z.string().uuid(),
});

const MedicationCalculationSchema = z.object({
  medication: z.string(),
  weight: z.number().positive(),
  species: z.enum(['canine', 'feline', 'avian', 'reptile', 'rodent', 'other']),
  condition: z.string().optional(),
  age: z.string().optional(),
  calculatorEngine: z.enum(['gemini', 'deepseek']).default('deepseek'),
});

const SearchSchema = z.object({
  query: z.string(),
  species: z.string().optional(),
  limit: z.number().default(5),
});

/**
 * Tool: get_pet_info
 * Retorna informações básicas do pet
 */
export async function getPetInfo({ petId }: z.infer<typeof PetIdSchema>) {
  const { data: pet, error } = await supabase
    .from('pets')
    .select(`
      id,
      name,
      type,
      breed,
      age,
      weight,
      notes,
      user_id,
      created_at,
      profiles:user_id (full_name, phone, email)
    `)
    .eq('id', petId)
    .single();

  if (error || !pet) {
    return { error: 'Pet não encontrado', details: error?.message };
  }

  return {
    id: pet.id,
    name: pet.name,
    species: pet.type,
    breed: pet.breed,
    age: pet.age,
    weight: pet.weight,
    notes: pet.notes,
    owner: pet.profiles,
  };
}

/**
 * Tool: get_medical_history
 * Retorna histórico médico completo do pet
 */
export async function getMedicalHistory({ petId }: z.infer<typeof PetIdSchema>) {
  const [observations, exams, vaccines, prescriptions] = await Promise.all([
    // Observações clínicas
    supabase
      .from('pet_observations')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false }),

    // Exames
    supabase
      .from('pet_exams')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false }),

    // Vacinas
    supabase
      .from('pet_vaccines')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false }),

    // Prescrições/Medicações
    supabase
      .from('pet_prescriptions')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false }),
  ]);

  // Formata histórico
  const history = {
    observations: observations.data || [],
    exams: exams.data || [],
    vaccines: vaccines.data || [],
    prescriptions: prescriptions.data || [],
  };

  // Gera resumo textual
  const summary = generateMedicalSummary(history);

  return {
    ...history,
    summary,
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Tool: get_vaccination_status
 * Retorna status vacinal do pet
 */
export async function getVaccinationStatus({ petId }: z.infer<typeof PetIdSchema>) {
  const { data: vaccines, error } = await supabase
    .from('pet_vaccines')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: 'Erro ao buscar vacinas', details: error.message };
  }

  const vaccineList = vaccines || [];

  // Analisa vacinas principais
  const coreVaccines = ['V8', 'V10', 'V10+Giardia', 'Gripe Canina', 'Raiva', 'Leishmaniose'];
  const lastVaccines: Record<string, { date: string; nextDose?: string }> = {};

  vaccineList.forEach((v: any) => {
    const name = v.vaccine_name || v.name || 'Desconhecida';
    const normalizedName = coreVaccines.find(cv =>
      name.toLowerCase().includes(cv.toLowerCase())
    ) || name;

    if (!lastVaccines[normalizedName]) {
      lastVaccines[normalizedName] = {
        date: v.created_at,
        nextDose: v.next_dose_date,
      };
    }
  });

  // Verifica vacinas pendentes
  const pending: string[] = [];
  const today = new Date();

  Object.entries(lastVaccines).forEach(([name, info]) => {
    if (info.nextDose && new Date(info.nextDose) < today) {
      pending.push(name);
    }
  });

  return {
    totalVaccines: vaccineList.length,
    lastVaccines,
    pendingVaccines: pending,
    isUpToDate: pending.length === 0,
    nextDue: Object.entries(lastVaccines)
      .filter(([_, info]) => info.nextDose)
      .map(([name, info]) => ({ name, nextDose: info.nextDose }))
      .sort((a, b) => new Date(a.nextDose!).getTime() - new Date(b.nextDose!).getTime()),
  };
}

/**
 * Tool: get_current_medications
 * Retorna medicações atuais do pet
 */
export async function getCurrentMedications({ petId }: z.infer<typeof PetIdSchema>) {
  const { data: prescriptions, error } = await supabase
    .from('pet_prescriptions')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: 'Erro ao buscar prescrições', details: error.message };
  }

  const meds = prescriptions || [];

  // Filtra medicações provavelmente ativas (últimos 30 dias ou sem data de término)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const currentMeds = meds.filter((p: any) => {
    const createdDate = new Date(p.created_at);
    const endDate = p.end_date ? new Date(p.end_date) : null;

    // Considera ativa se criada nos últimos 30 dias e sem data de término ou término futuro
    return createdDate > thirtyDaysAgo && (!endDate || endDate > new Date());
  });

  return {
    currentMedications: currentMeds.map((m: any) => ({
      medication: m.medication || m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      startDate: m.created_at,
      endDate: m.end_date,
      notes: m.notes,
    })),
    totalPrescriptions: meds.length,
    recentPrescriptions: meds.slice(0, 5).map((m: any) => ({
      medication: m.medication || m.name,
      date: m.created_at,
    })),
  };
}

/**
 * Tool: get_recent_exams
 * Retorna exames laboratoriais recentes
 */
export async function getRecentExams({ petId }: z.infer<typeof PetIdSchema>) {
  const { data: exams, error } = await supabase
    .from('pet_exams')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return { error: 'Erro ao buscar exames', details: error.message };
  }

  return {
    recentExams: (exams || []).map((e: any) => ({
      id: e.id,
      type: e.exam_type,
      name: e.name,
      date: e.exam_date || e.created_at,
      results: e.results,
      notes: e.notes,
      veterinarian: e.veterinarian,
    })),
    totalExams: exams?.length || 0,
    lastExamDate: exams?.[0]?.exam_date || exams?.[0]?.created_at,
  };
}

/**
 * Tool: calculate_medication_dosage
 * Calcula dose de medicação com base no peso e espécie
 */
export async function calculateMedicationDosage({
  medication,
  weight,
  species,
  condition,
  age,
  calculatorEngine = 'deepseek',
}: z.infer<typeof MedicationCalculationSchema>) {
  try {
    const model = calculatorEngine === 'deepseek' ? deepseek('deepseek-chat') : gemini;

    const { text } = await generateText({
      model,
      system: 'Você é um farmacologista veterinário especialista. Calcule a dosagem precisa de medicamentos baseando-se em peso, espécie e condições clínicas. Sempre forneça a dose em mg e a frequência (SID, BID, etc). Inclua avisos de segurança.',
      prompt: `Calcule a dose para:
      Medicamento: ${medication}
      Peso: ${weight}kg
      Espécie: ${species}
      Condição: ${condition || 'Nenhuma'}
      Idade: ${age || 'Não informada'}
      
      Retorne um JSON estruturado com: calculated (boolean), dosage (objeto com calculatedDose, range, unit, frequency), notes (string), considerations (array), warnings (array).`,
    });

    // Tenta extrair JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      medication,
      calculated: true,
      engineUsed: calculatorEngine,
      textResponse: text,
      warnings: ['⚠️ Verifique sempre as doses em fontes oficiais antes da administração.'],
    };
  } catch (error) {
    console.error(`${calculatorEngine} Calculation Error:`, error);
    return {
      error: `Falha no cálculo via ${calculatorEngine}`,
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Tool: search_clinical_knowledge
 * Busca em base de conhecimento (placeholder para futura implementação RAG)
 */
export async function searchClinicalKnowledge({
  query,
  species,
  limit,
}: z.infer<typeof SearchSchema>) {
  // TODO: Implementar RAG com embeddings quando tivermos base de conhecimento
  // Por enquanto, retorna placeholder com recomendação de diretrizes

  const guidelines = [
    {
      title: 'WSAVA Guidelines',
      url: 'https://wsava.org/resources/global-guidelines/',
      description: 'Diretrizes globais de vacinação e cuidados',
    },
    {
      title: 'AAHA Guidelines',
      url: 'https://www.aaha.org/practice-resources/',
      description: 'Diretrizes da American Animal Hospital Association',
    },
    {
      title: 'VIN - Veterinary Information Network',
      url: 'https://www.vin.com/',
      description: 'Base de conhecimento veterinário colaborativa',
    },
  ];

  return {
    query,
    species,
    results: [
      {
        type: 'guideline',
        content: `Para consultas sobre "${query}"${species ? ` em ${species}` : ''}, consulte as seguintes fontes:`,
        sources: guidelines,
      },
    ],
    note: 'Busca em base de conhecimento veterinário será implementada na Fase 2 (RAG).',
  };
}

// Helper functions

function generateMedicalSummary(history: {
  observations: any[];
  exams: any[];
  vaccines: any[];
  prescriptions: any[];
}): string {
  const parts: string[] = [];

  if (history.observations.length > 0) {
    parts.push(`📋 ${history.observations.length} observações clínicas registradas`);
    const recentObs = history.observations.slice(0, 3);
    recentObs.forEach((obs, i) => {
      parts.push(`   ${i + 1}. ${new Date(obs.created_at).toLocaleDateString()}: ${obs.observation?.substring(0, 100)}...`);
    });
  }

  if (history.exams.length > 0) {
    parts.push(`\n🧪 ${history.exams.length} exames registrados`);
    parts.push(`   Último: ${history.exams[0]?.exam_type || 'Não especificado'} (${new Date(history.exams[0]?.created_at).toLocaleDateString()})`);
  }

  if (history.vaccines.length > 0) {
    parts.push(`\n💉 ${history.vaccines.length} vacinas aplicadas`);
  }

  if (history.prescriptions.length > 0) {
    parts.push(`\n💊 ${history.prescriptions.length} prescrições registradas`);
  }

  return parts.join('\n') || 'Nenhum histórico médico registrado.';
}

function extractFrequency(notes?: string): string {
  if (!notes) return 'Consultar protocolo';

  const patterns = [
    /SID|q\.?24h/i,
    /BID|q\.?12h/i,
    /TID|q\.?8h/i,
    /QID|q\.?6h/i,
    /a cada (\d+)h/i,
  ];

  for (const pattern of patterns) {
    const match = notes.match(pattern);
    if (match) return match[0];
  }

  return 'Consultar notas específicas';
}

// Exporta todas as tools para uso na API
export const vetCopilotTools = {
  get_pet_info: getPetInfo,
  get_medical_history: getMedicalHistory,
  get_vaccination_status: getVaccinationStatus,
  get_current_medications: getCurrentMedications,
  get_recent_exams: getRecentExams,
  calculate_medication_dosage: calculateMedicationDosage,
  search_clinical_knowledge: searchClinicalKnowledge,
};

export type VetCopilotTools = typeof vetCopilotTools;
