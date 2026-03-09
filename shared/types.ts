/**
 * Tipos compartilhados entre todas as plataformas AgendaVet
 * Web, Mobile Veterinário e Mobile Tutor
 */

// ============= TIPOS BASE =============

export interface Pet {
  id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed: string
  age: number
  weight: number
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface Owner {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  petId: string
  ownerId: string
  date: string
  time: string
  type: 'checkup' | 'vaccination' | 'surgery' | 'dental' | 'emergency' | 'grooming' | 'followup'
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MedicalRecord {
  id: string
  petId: string
  type: 'vaccination' | 'diagnosis' | 'prescription' | 'surgery' | 'lab_result' | 'treatment'
  title: string
  description: string
  date: string
  veterinarian: string
  attachments?: string[]
  createdAt: string
  updatedAt: string
}

// ============= TIPOS DO VET COPILOT =============

export interface VetCopilotMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  model?: string
  petId?: string
  conversationId?: string
}

export interface VetCopilotConversation {
  id: string
  title: string
  petId?: string
  messages: VetCopilotMessage[]
  createdAt: string
  updatedAt: string
}

export interface AIModel {
  id: string
  name: string
  provider: string
  tier: 'free' | 'premium'
  specialty: string
  description: string
}

export interface VetModelSpecialization {
  id: string
  name: string
  provider: string
  modelId: string
  specialty: string
  description: string
  useCases: string[]
  strengths: string[]
  costTier: 'free' | 'premium'
  recommendedFor: string[]
}

// ============= TIPOS DE NOTIFICAÇÕES =============

export interface Notification {
  id: string
  userId: string
  type: 'appointment' | 'vaccine' | 'treatment' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: string
  data?: any
}

// ============= TIPOS DE CLÍNICA =============

export interface Clinic {
  id: string
  name: string
  email: string
  phone: string
  address: string
  logo?: string
  settings: ClinicSettings
}

export interface ClinicSettings {
  timezone: string
  workingHours: WorkingHours[]
  appointmentTypes: AppointmentType[]
  vaccinationSchedule: VaccinationSchedule[]
}

export interface WorkingHours {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday
  open: string
  close: string
  closed: boolean
}

export interface AppointmentType {
  id: string
  name: string
  duration: number // minutes
  price: number
  color: string
  requiresVet: boolean
}

export interface VaccinationSchedule {
  species: 'dog' | 'cat'
  vaccines: VaccineSchedule[]
}

export interface VaccineSchedule {
  name: string
  age: number // weeks
  booster: number // weeks
  description: string
}

// ============= RESPOSTAS API =============

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ============= UTILITÁRIOS =============

export type SortOrder = 'asc' | 'desc'
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in'

export interface Filter<T> {
  field: keyof T
  operator: FilterOperator
  value: any
}

export interface Sort<T> {
  field: keyof T
  order: SortOrder
}

export interface QueryOptions<T> {
  filters?: Filter<T>[]
  sort?: Sort<T>
  limit?: number
  offset?: number
}
