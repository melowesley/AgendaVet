/**
 * Utilitários compartilhados entre todas as plataformas AgendaVet
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ============= UTILITÁRIOS DE CLASSE CSS =============

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============= FORMATAÇÃO =============

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('pt-BR')
    case 'long':
      return dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    case 'time':
      return dateObj.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    default:
      return dateObj.toLocaleDateString('pt-BR')
  }
}

export function formatPhone(phone: string): string {
  // Remove tudo que não é dígito
  const cleaned = phone.replace(/\D/g, '')
  
  // Formato brasileiro: (XX) XXXXX-XXXX
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  
  // Formato antigo: (XX) XXXX-XXXX
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  return phone
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return cpf
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(1)} kg`
}

export function formatAge(age: number, species: 'dog' | 'cat' | 'other' = 'dog'): string {
  if (species === 'dog' || species === 'cat') {
    const years = Math.floor(age / 12)
    const months = age % 12
    
    if (years === 0) {
      return `${months} ${months === 1 ? 'mês' : 'meses'}`
    } else if (months === 0) {
      return `${years} ${years === 1 ? 'ano' : 'anos'}`
    } else {
      return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`
    }
  }
  
  return `${age} meses`
}

// ============= VALIDAÇÃO =============

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/
  return phoneRegex.test(formatPhone(phone))
}

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  
  // Algoritmo de validação de CPF
  let sum = 0
  let remainder
  
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleaned.substring(i - 1, i)) * (11 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false
  
  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleaned.substring(i - 1, i)) * (12 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false
  
  return true
}

// ============= CORES E STATUS =============

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const getSpeciesColor = (species: string): string => {
  switch (species) {
    case 'dog':
      return 'bg-amber-100 text-amber-800'
    case 'cat':
      return 'bg-purple-100 text-purple-800'
    case 'bird':
      return 'bg-sky-100 text-sky-800'
    case 'rabbit':
      return 'bg-pink-100 text-pink-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const getAppointmentTypeColor = (type: string): string => {
  switch (type) {
    case 'checkup':
      return 'bg-blue-100 text-blue-800'
    case 'vaccination':
      return 'bg-green-100 text-green-800'
    case 'surgery':
      return 'bg-red-100 text-red-800'
    case 'dental':
      return 'bg-purple-100 text-purple-800'
    case 'emergency':
      return 'bg-orange-100 text-orange-800'
    case 'grooming':
      return 'bg-pink-100 text-pink-800'
    case 'followup':
      return 'bg-indigo-100 text-indigo-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// ============= UTILITÁRIOS DE DATA =============

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = addDays(new Date(), 1)
  return date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
}

export function getDaysUntil(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  const diffTime = targetDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// ============= UTILITÁRIOS DE STORAGE =============

export function storageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  let storage
  try {
    storage = window[type]
    const x = '__storage_test__'
    storage.setItem(x, x)
    storage.removeItem(x)
    return true
  } catch (e) {
    return false
  }
}

export function setStorageItem(key: string, value: any, type: 'localStorage' | 'sessionStorage' = 'localStorage'): void {
  if (storageAvailable(type)) {
    window[type].setItem(key, JSON.stringify(value))
  }
}

export function getStorageItem(key: string, defaultValue: any = null, type: 'localStorage' | 'sessionStorage' = 'localStorage'): any {
  if (storageAvailable(type)) {
    const item = window[type].getItem(key)
    return item ? JSON.parse(item) : defaultValue
  }
  return defaultValue
}

export function removeStorageItem(key: string, type: 'localStorage' | 'sessionStorage' = 'localStorage'): void {
  if (storageAvailable(type)) {
    window[type].removeItem(key)
  }
}

// ============= UTILITÁRIOS DE API =============

export function createApiUrl(path: string, params?: Record<string, any>): string {
  const url = new URL(path, process.env.NEXT_PUBLIC_SUPABASE_URL || window.location.origin)
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }
  
  return url.toString()
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const response = await fetch(url, { ...defaultOptions, ...options })
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// ============= UTILITÁRIOS DE VETERINÁRIA =============

export function calculateNextVaccination(lastVaccination: Date, vaccineType: string): Date {
  // Intervalos típicos de vacinação em semanas
  const intervals: Record<string, number> = {
    'rabies': 52, // 1 ano
    'dhpp': 52, // 1 ano
    'leptospirosis': 52, // 1 ano
    'influenza': 26, // 6 meses
    'bordetella': 26, // 6 meses
    'fvrcp': 52, // 1 ano (gatos)
    'felv': 52, // 1 ano (gatos)
  }
  
  const weeks = intervals[vaccineType.toLowerCase()] || 52
  return addWeeks(lastVaccination, weeks)
}

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + (weeks * 7))
  return result
}

export function getVaccinationStatus(lastVaccination: Date, vaccineType: string): {
  status: 'up-to-date' | 'due-soon' | 'overdue'
  daysUntil: number
  nextDate: Date
} {
  const nextDate = calculateNextVaccination(lastVaccination, vaccineType)
  const daysUntil = getDaysUntil(nextDate)
  
  let status: 'up-to-date' | 'due-soon' | 'overdue'
  
  if (daysUntil < 0) {
    status = 'overdue'
  } else if (daysUntil <= 14) {
    status = 'due-soon'
  } else {
    status = 'up-to-date'
  }
  
  return {
    status,
    daysUntil,
    nextDate
  }
}

// ============= DEBUG =============

export function debugLog(message: string, data?: any, level: 'info' | 'warn' | 'error' = 'info'): void {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    console.log(prefix, message, data || '')
  }
}

export function debugError(error: Error, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${context || 'Unknown context'}:`, error)
    console.error('Stack:', error.stack)
  }
}
