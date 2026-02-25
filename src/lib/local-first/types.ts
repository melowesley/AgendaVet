export type SyncState = 'synced' | 'pending' | 'failed';

export interface LocalFirstPet {
  id: string;
  user_id: string;
  name: string;
  type: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sync_state: SyncState;
}

export interface LocalFirstAppointment {
  id: string;
  user_id: string;
  pet_id: string;
  preferred_date: string;
  preferred_time: string;
  reason: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  pets?: Pick<LocalFirstPet, 'id' | 'name' | 'type' | 'breed'>;
  sync_state: SyncState;
}

export interface LocalUserData {
  pets: LocalFirstPet[];
  appointments: LocalFirstAppointment[];
  last_synced_at: string | null;
}

export interface CreatePetOperationPayload {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentOperationPayload {
  id: string;
  pet_id: string;
  preferred_date: string;
  preferred_time: string;
  reason: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type OfflineOperationPayload =
  | CreatePetOperationPayload
  | CreateAppointmentOperationPayload;

export type OfflineOperationType =
  | 'create_pet'
  | 'create_appointment_request';

export interface OfflineOperation {
  id: string;
  type: OfflineOperationType;
  user_id: string;
  status: 'pending' | 'failed';
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  payload: OfflineOperationPayload;
}

export interface ResourceCacheEntry<T = unknown> {
  data: T;
  updated_at: string;
}

export interface LocalFirstStateSchema {
  users: Record<string, LocalUserData>;
  queue: OfflineOperation[];
  resources: Record<string, ResourceCacheEntry<unknown>>;
}
