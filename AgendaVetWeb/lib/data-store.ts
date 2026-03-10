'use client'

import useSWR, { mutate } from 'swr'
import type { Pet, Owner, Appointment, MedicalRecord, AgentSettings } from './types'
import { supabase } from './supabase/client'
import { useAuthStore } from './auth-store'

// AI Agent Settings (kept in-memory for now or could be moved to a settings table)
let agentSettingsStore: AgentSettings = {
  model: 'anthropic/claude-opus-4.5',
  temperature: 0.7,
  systemPrompt: `You are a helpful veterinary assistant for AgendaVet. You help staff with:
- Looking up patient and owner information
- Scheduling appointments
- Answering common veterinary questions
- Providing reminders about vaccinations and follow-ups

Always be professional, empathetic, and accurate in your responses.`,
}

// Mappers
const mapSupabasePet = (p: any): Pet => ({
  id: p.id,
  name: p.name,
  species: (p.type || 'other') as Pet['species'],
  breed: p.breed || '',
  dateOfBirth: p.age || '',
  weight: parseFloat(p.weight) || 0,
  ownerId: p.user_id,
  notes: p.notes || '',
  imageUrl: p.imageUrl,
  createdAt: p.created_at,
})

const mapSupabaseOwner = (p: any): Owner => {
  const parts = (p.full_name || '').split(' ')
  return {
    id: p.id,
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    email: p.email || '',
    phone: p.phone || '',
    address: p.address || '',
    petIds: [],
    createdAt: p.created_at,
  }
}

const mapSupabaseAppointment = (a: any): Appointment => {
  // Use scheduled_date if available, otherwise preferred_date
  const date = a.scheduled_date || a.preferred_date || ''
  const time = a.scheduled_time || a.preferred_time || ''

  return {
    id: a.id,
    petId: a.pet_id,
    ownerId: a.user_id,
    date,
    time,
    type: (a.reason?.toLowerCase() === 'vaccination' ? 'vaccination' :
      a.reason?.toLowerCase() === 'surgery' ? 'surgery' : 'checkup') as Appointment['type'],
    status: (a.status === 'confirmed' ? 'confirmed' :
      a.status === 'completed' ? 'completed' :
        a.status === 'cancelled' ? 'cancelled' : 'scheduled') as Appointment['status'],
    notes: a.notes || '',
    veterinarian: a.veterinarian || 'Não definido',
    createdAt: a.created_at,
  }
}

// Fetchers
const petsFetcher = async () => {
  const { data, error } = await supabase.from('pets').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapSupabasePet)
}

const ownersFetcher = async () => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapSupabaseOwner)
}

const appointmentsFetcher = async () => {
  const { data, error } = await supabase.from('appointment_requests').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapSupabaseAppointment)
}

const medicalRecordsFetcher = async () => {
  // Combining different record types from Supabase
  const [exams, vaccines, observations, prescriptions] = await Promise.all([
    supabase.from('pet_exams').select('*'),
    supabase.from('pet_vaccines').select('*'),
    supabase.from('pet_observations').select('*'),
    supabase.from('pet_prescriptions').select('*'),
  ])

  const records: MedicalRecord[] = [
    ...(exams.data || []).map(e => ({
      id: e.id,
      petId: e.pet_id,
      date: e.exam_date,
      type: 'lab-result' as const,
      title: e.exam_type,
      description: e.results || '',
      veterinarian: e.veterinarian || '',
      createdAt: e.created_at,
    })),
    ...(vaccines.data || []).map(v => ({
      id: v.id,
      petId: v.pet_id,
      date: v.application_date,
      type: 'vaccination' as const,
      title: v.vaccine_name,
      description: v.notes || '',
      veterinarian: v.veterinarian || '',
      createdAt: v.created_at,
    })),
    ...(observations.data || []).map(o => ({
      id: o.id,
      petId: o.pet_id,
      date: o.observation_date,
      type: 'note' as const,
      title: o.title || 'Observação',
      description: o.observation,
      veterinarian: '',
      createdAt: o.created_at,
    })),
    ...(prescriptions.data || []).map(p => ({
      id: p.id,
      petId: p.pet_id,
      date: p.created_at, // Use creation date for prescriptions
      type: 'prescription' as const,
      title: 'Receita Médica',
      description: p.medication_name || '',
      veterinarian: p.veterinarian || '',
      createdAt: p.created_at,
    })),
  ]

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

const agentSettingsFetcher = () => Promise.resolve(agentSettingsStore)

// Hooks
export function usePets() {
  const { data, error, isLoading } = useSWR<Pet[]>('pets', petsFetcher)
  return { pets: data ?? [], error, isLoading }
}

export function usePet(id: string) {
  const { pets, error, isLoading } = usePets()
  const pet = pets.find((p) => p.id === id)
  return { pet, error, isLoading }
}

export function useOwners() {
  const { data, error, isLoading } = useSWR<Owner[]>('owners', ownersFetcher)
  return { owners: data ?? [], error, isLoading }
}

export function useOwner(id: string) {
  const { owners, error, isLoading } = useOwners()
  const owner = owners.find((o) => o.id === id)
  return { owner, error, isLoading }
}

export function useAppointments() {
  const { data, error, isLoading } = useSWR<Appointment[]>('appointments', appointmentsFetcher)
  return { appointments: data ?? [], error, isLoading }
}

export function useMedicalRecords(petId?: string) {
  const { data, error, isLoading } = useSWR<MedicalRecord[]>('medical-records', medicalRecordsFetcher)
  const records = petId ? (data ?? []).filter((r) => r.petId === petId) : data ?? []
  return { records, error, isLoading }
}

export function useAgentSettings() {
  const { data, error, isLoading } = useSWR<AgentSettings>('agent-settings', agentSettingsFetcher)
  return { settings: data ?? agentSettingsStore, error, isLoading }
}

// Mutations
export async function addPet(pet: Omit<Pet, 'id' | 'createdAt'>) {
  const { data, error } = await supabase.from('pets').insert([{
    name: pet.name,
    type: pet.species,
    breed: pet.breed,
    age: pet.dateOfBirth,
    weight: pet.weight.toString(),
    user_id: pet.ownerId,
    notes: pet.notes,
  }]).select().single()

  if (error) throw error
  const newPet = mapSupabasePet(data)
  mutate('pets')
  return newPet
}

export async function updatePet(id: string, updates: Partial<Pet>) {
  const supabaseUpdates: any = {}
  if (updates.name) supabaseUpdates.name = updates.name
  if (updates.species) supabaseUpdates.type = updates.species
  if (updates.breed) supabaseUpdates.breed = updates.breed
  if (updates.dateOfBirth) supabaseUpdates.age = updates.dateOfBirth
  if (updates.weight !== undefined) supabaseUpdates.weight = updates.weight.toString()
  if (updates.notes) supabaseUpdates.notes = updates.notes

  const { data, error } = await supabase.from('pets').update(supabaseUpdates).eq('id', id).select().single()
  if (error) throw error
  const updatedPet = mapSupabasePet(data)
  mutate('pets')
  return updatedPet
}

export async function deletePet(id: string) {
  const { error } = await supabase.from('pets').delete().eq('id', id)
  if (error) throw error
  mutate('pets')
  return true
}

export async function addOwner(owner: Omit<Owner, 'id' | 'createdAt' | 'petIds'>) {
  const user = useAuthStore.getState().user
  if (!user?.id) throw new Error('User not authenticated')

  const { data, error } = await supabase.from('profiles').insert([{
    full_name: `${owner.firstName} ${owner.lastName}`,
    phone: owner.phone,
    address: owner.address,
    user_id: user.id,
  }]).select().single()

  if (error) throw error
  const newOwner = mapSupabaseOwner(data)
  mutate('owners')
  return newOwner
}

export async function updateOwner(id: string, updates: Partial<Owner>) {
  const supabaseUpdates: any = {}
  if (updates.firstName || updates.lastName) {
    supabaseUpdates.full_name = `${updates.firstName || ''} ${updates.lastName || ''}`.trim()
  }
  if (updates.phone) supabaseUpdates.phone = updates.phone
  if (updates.address) supabaseUpdates.address = updates.address

  const { data, error } = await supabase.from('profiles').update(supabaseUpdates).eq('id', id).select().single()
  if (error) throw error
  const updatedOwner = mapSupabaseOwner(data)
  mutate('owners')
  return updatedOwner
}

export async function deleteOwner(id: string) {
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw error
  mutate('owners')
  return true
}

export async function addAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>) {
  const { data, error } = await supabase.from('appointment_requests').insert([{
    pet_id: appointment.petId,
    user_id: appointment.ownerId,
    preferred_date: appointment.date,
    preferred_time: appointment.time,
    reason: appointment.type || 'Consultation',
    notes: appointment.notes,
    status: appointment.status === 'scheduled' ? 'pending' : appointment.status,
    veterinarian: appointment.veterinarian,
  }]).select().single()

  if (error) throw error
  const newAppointment = mapSupabaseAppointment(data)
  mutate('appointments')
  return newAppointment
}

export async function updateAppointment(id: string, updates: Partial<Appointment>) {
  const supabaseUpdates: any = {}
  if (updates.date) supabaseUpdates.scheduled_date = updates.date
  if (updates.time) supabaseUpdates.scheduled_time = updates.time
  if (updates.type) supabaseUpdates.reason = updates.type
  if (updates.status) {
    supabaseUpdates.status = updates.status === 'scheduled' ? 'pending' : updates.status
  }
  if (updates.notes) supabaseUpdates.notes = updates.notes
  if (updates.veterinarian) supabaseUpdates.veterinarian = updates.veterinarian

  const { data, error } = await supabase.from('appointment_requests').update(supabaseUpdates).eq('id', id).select().single()
  if (error) throw error
  const updatedAppointment = mapSupabaseAppointment(data)
  mutate('appointments')
  return updatedAppointment
}


export async function deleteAppointment(id: string) {
  const { error } = await supabase.from('appointment_requests').delete().eq('id', id)
  if (error) throw error
  mutate('appointments')
  return true
}

export async function addMedicalRecord(record: Omit<MedicalRecord, 'id' | 'createdAt'>) {
  const user = useAuthStore.getState().user
  if (!user?.id) throw new Error('User not authenticated')

  if (record.type === 'vaccination') {
    const { data, error } = await supabase.from('pet_vaccines').insert([{
      pet_id: record.petId,
      vaccine_name: record.title,
      application_date: record.date,
      notes: record.description,
      veterinarian: record.veterinarian,
      user_id: user.id,
    }]).select().single()
    if (error) throw error
    mutate('medical-records')
    return { ...record, id: data.id, createdAt: data.created_at }
  } else if (record.type === 'lab-result') {
    const { data, error } = await supabase.from('pet_exams').insert([{
      pet_id: record.petId,
      exam_type: record.title,
      exam_date: record.date,
      results: record.description,
      veterinarian: record.veterinarian,
      user_id: user.id,
    }]).select().single()
    if (error) throw error
    mutate('medical-records')
    return { ...record, id: data.id, createdAt: data.created_at }
  } else {
    // Other types go to pet_observations
    const { data, error } = await supabase.from('pet_observations').insert([{
      pet_id: record.petId,
      title: record.title,
      observation: record.description,
      observation_date: record.date,
      user_id: user.id,
    }]).select().single()
    if (error) throw error
    mutate('medical-records')
    return { ...record, id: data.id, createdAt: data.created_at }
  }
}

export function updateAgentSettings(settings: Partial<AgentSettings>) {
  agentSettingsStore = { ...agentSettingsStore, ...settings }
  mutate('agent-settings')
  return agentSettingsStore
}

