/**
 * AgentVet Clinical Copilot - Types
 * 
 * Tipagens específicas para o sistema Vet Copilot
 */

import { Pet, Owner } from '@/lib/types';

// Estado do Copilot
export interface VetCopilotState {
  isOpen: boolean;
  selectedPetId: string | null;
  consultationMode: 'floating' | 'sidebar' | 'fullscreen';
  isLoading: boolean;
  error: string | null;
}

// Contexto clínico do pet
export interface PetClinicalContext {
  pet: Pet & {
    lastWeight?: number;
    lastWeightDate?: string;
  };
  owner: Owner;
  medicalHistory: MedicalHistorySummary;
  currentMedications: MedicationInfo[];
  vaccinationStatus: VaccinationStatus;
  recentExams: ExamInfo[];
  alerts: ClinicalAlert[];
}

// Resumo do histórico médico
export interface MedicalHistorySummary {
  totalObservations: number;
  totalExams: number;
  totalVaccines: number;
  totalPrescriptions: number;
  chronicConditions: string[];
  recentSurgeries: string[];
  allergies: string[];
  lastVisit: string;
  summary: string;
}

// Informação de medicação
export interface MedicationInfo {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  veterinarian: string;
  notes?: string;
  isActive: boolean;
}

// Status vacinal
export interface VaccinationStatus {
  totalVaccines: number;
  lastVaccines: Record<string, { date: string; nextDose?: string }>;
  pendingVaccines: string[];
  isUpToDate: boolean;
  nextDue: { name: string; nextDose?: string }[];
}

// Informação de exame
export interface ExamInfo {
  id: string;
  type: string;
  name: string;
  date: string;
  results?: string;
  notes?: string;
  veterinarian?: string;
  attachments?: string[];
}

// Alerta clínico
export interface ClinicalAlert {
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  date: string;
  source: 'medication' | 'exam' | 'observation' | 'vaccine';
}

// Configurações do Copilot
export interface VetCopilotSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  enableTools: boolean;
  autoLoadPetContext: boolean;
  showSuggestions: boolean;
  disclaimerMode: 'always' | 'medical_only' | 'none';
}

// Sugestão contextual
export interface ContextualSuggestion {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: 'summarize_history' | 'suggest_exams' | 'check_interactions' | 'calculate_dose' | 'custom';
  prompt?: string;
}

// Interação com o copilot
export interface CopilotInteraction {
  id: string;
  veterinarianId: string;
  petId?: string;
  consultationId?: string;
  query: string;
  response: string;
  toolsUsed: string[];
  timestamp: Date;
  rating?: number;
  feedback?: string;
  duration: number; // ms
}

// Resultado de cálculo de dose
export interface DosageCalculation {
  medication: string;
  species: string;
  weight: number;
  calculated: boolean;
  dosage?: {
    standard: number;
    range: string;
    unit: string;
    calculatedDose: string;
    doseRange: string;
    frequency: string;
  };
  notes?: string;
  considerations: string[];
  warnings: string[];
  message?: string;
  recommendation?: string;
}

// Parâmetros das tools
export interface ToolParams {
  get_pet_info: { petId: string };
  get_medical_history: { petId: string };
  get_vaccination_status: { petId: string };
  get_current_medications: { petId: string };
  get_recent_exams: { petId: string };
  calculate_medication_dosage: {
    medication: string;
    weight: number;
    species: 'canine' | 'feline' | 'avian' | 'reptile' | 'rodent' | 'other';
    condition?: string;
    age?: string;
  };
  search_clinical_knowledge: {
    query: string;
    species?: string;
    limit?: number;
  };
}

// Respostas das tools
export interface ToolResponses {
  get_pet_info: {
    id: string;
    name: string;
    species: string;
    breed: string;
    age?: string;
    weight?: string;
    notes?: string;
    owner?: any;
    error?: string;
    details?: string;
  };
  get_medical_history: {
    observations: any[];
    exams: any[];
    vaccines: any[];
    prescriptions: any[];
    summary: string;
    lastUpdate: string;
  };
  get_vaccination_status: {
    totalVaccines: number;
    lastVaccines: Record<string, { date: string; nextDose?: string }>;
    pendingVaccines: string[];
    isUpToDate: boolean;
    nextDue: { name: string; nextDose?: string }[];
  };
  get_current_medications: {
    currentMedications: any[];
    totalPrescriptions: number;
    recentPrescriptions: any[];
  };
  get_recent_exams: {
    recentExams: any[];
    totalExams: number;
    lastExamDate?: string;
  };
  calculate_medication_dosage: DosageCalculation;
  search_clinical_knowledge: {
    query: string;
    species?: string;
    results: any[];
    note: string;
  };
}

// Modos de visualização
export type CopilotViewMode = 'compact' | 'expanded' | 'fullscreen';

// Tipo de mensagem
export type CopilotMessageType = 
  | 'user'
  | 'assistant'
  | 'system'
  | 'tool_call'
  | 'tool_result'
  | 'error';

// Mensagem do copilot
export interface CopilotMessage {
  id: string;
  type: CopilotMessageType;
  content: string;
  timestamp: Date;
  metadata?: {
    toolCalls?: string[];
    petId?: string;
    duration?: number;
    model?: string;
  };
}

// Props dos componentes
export interface VetCopilotChatProps {
  petId?: string;
  mode?: CopilotViewMode;
  className?: string;
}

export interface ClinicalContextPanelProps {
  context: PetClinicalContext | null;
  isLoading: boolean;
}

export interface DosageCalculatorProps {
  petWeight: number;
  species: string;
  onCalculate: (result: DosageCalculation) => void;
}
