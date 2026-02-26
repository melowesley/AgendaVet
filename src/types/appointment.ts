export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REMINDER_SENT: 'reminder_sent',
  CHECKED_IN: 'checked_in',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  RETURN_SCHEDULED: 'return_scheduled',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];

export type PetType = 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'other';

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  breed: string;
  age: string;
  weight: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
}

export interface Appointment {
  id: string;
  pet: Pet;
  date: Date;
  time: string;
  reason: string;
  notes: string;
  status: AppointmentStatus;
  veterinarian: string;
}
