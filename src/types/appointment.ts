export type AppointmentStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';

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
