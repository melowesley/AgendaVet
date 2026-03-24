import React from "react"
export interface Pet {
  id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'reptile' | 'other'
  breed: string
  gender?: 'Macho' | 'Fêmea'
  dateOfBirth: string
  weight: number
  ownerId?: string // Legacy link to user_id (for tutores with login)
  profileId: string // New primary link to profile (tutor)
  notes: string
  imageUrl?: string
  createdAt: string
}

export interface Owner {
  id: string // This is the profile.id (UUID)
  userId?: string // Optional link to auth.users (for login)
  firstName: string
  lastName: string
  fullName: string
  gender?: 'Masculino' | 'Feminino' | 'Outro'
  age?: number
  email: string
  phone: string
  whatsapp?: string
  address: string
  petIds: string[]
  createdAt: string
}

export interface Appointment {
  id: string
  petId: string
  ownerId: string
  date: string
  time: string
  type: 'checkup' | 'vaccination' | 'surgery' | 'grooming' | 'emergency' | 'follow-up'
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  notes: string
  veterinarian: string
  createdAt: string
}

export interface MedicalRecord {
  id: string
  petId: string
  appointmentId?: string
  date: string
  type: 'vaccination' | 'prescription' | 'diagnosis' | 'procedure' | 'lab-result' | 'note' | 'peso' | 'cirurgia' | 'internacao' | 'banho-tosa' | 'obito' | 'documento' | 'fotos' | 'video' | 'retorno' | 'outros' | 'consulta' | 'exame' | 'procedimento' | 'receita' | 'vacina' | 'observacao'
  title: string
  description: string
  veterinarian: string
  attachments?: string[]
  createdAt: string
}

export interface AgentSettings {
  model: string
  temperature: number
  systemPrompt: string
}

export type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}
