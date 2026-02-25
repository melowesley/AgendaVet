import { supabase } from '@/integrations/supabase/client';
import {
  getPendingQueueCount,
  getQueueOperations,
  getUserLocalData,
  markLocalAppointmentSyncState,
  markLocalPetSyncState,
  removeQueueOperation,
  replaceUserLocalData,
  upsertLocalAppointment,
  upsertLocalPet,
  upsertQueueOperation,
} from '@/lib/local-first/state';
import type {
  CreateAppointmentOperationPayload,
  CreatePetOperationPayload,
  LocalFirstAppointment,
  LocalFirstPet,
  OfflineOperation,
} from '@/lib/local-first/types';

const MAX_RETRY_ATTEMPTS = 5;

function fallbackUuid(): string {
  // Fallback RFC4122 v4 quando randomUUID não estiver disponível.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function createUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return fallbackUuid();
}

export function isNetworkOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

function extractErrorMessage(error: unknown): string {
  if (!error) return 'Erro desconhecido';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') return maybeMessage;
  }

  return 'Erro desconhecido';
}

function isDuplicatePrimaryKey(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { code?: unknown }).code;
  return code === '23505';
}

function mapServerPetToLocal(input: Omit<LocalFirstPet, 'sync_state'>): LocalFirstPet {
  return {
    ...input,
    sync_state: 'synced',
  };
}

function mapServerAppointmentToLocal(
  input: Omit<LocalFirstAppointment, 'sync_state'>,
): LocalFirstAppointment {
  return {
    ...input,
    sync_state: 'synced',
  };
}

function fillAppointmentPets(
  appointments: LocalFirstAppointment[],
  pets: LocalFirstPet[],
): LocalFirstAppointment[] {
  const petMap = new Map(
    pets.map((pet) => [
      pet.id,
      {
        id: pet.id,
        name: pet.name,
        type: pet.type,
        breed: pet.breed,
      },
    ]),
  );

  return appointments.map((appointment) => ({
    ...appointment,
    pets: appointment.pets ?? petMap.get(appointment.pet_id),
  }));
}

export async function getClientPortalSnapshot(userId: string): Promise<{
  pets: LocalFirstPet[];
  appointments: LocalFirstAppointment[];
  lastSyncedAt: string | null;
  pendingOperations: number;
}> {
  const [localData, pendingOperations] = await Promise.all([
    getUserLocalData(userId),
    getPendingQueueCount(userId),
  ]);

  return {
    pets: localData.pets,
    appointments: fillAppointmentPets(localData.appointments, localData.pets),
    lastSyncedAt: localData.last_synced_at,
    pendingOperations,
  };
}

async function executeCreatePet(operation: OfflineOperation): Promise<void> {
  const payload = operation.payload as CreatePetOperationPayload;
  const { error } = await supabase.from('pets').insert({
    id: payload.id,
    user_id: operation.user_id,
    name: payload.name,
    type: payload.type,
    breed: payload.breed,
    age: payload.age,
    weight: payload.weight,
    notes: payload.notes,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
  });

  if (error && !isDuplicatePrimaryKey(error)) {
    throw error;
  }
}

async function executeCreateAppointment(operation: OfflineOperation): Promise<void> {
  const payload = operation.payload as CreateAppointmentOperationPayload;
  const { error } = await supabase.from('appointment_requests').insert({
    id: payload.id,
    user_id: operation.user_id,
    pet_id: payload.pet_id,
    preferred_date: payload.preferred_date,
    preferred_time: payload.preferred_time,
    reason: payload.reason,
    notes: payload.notes,
    status: payload.status,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
  });

  if (error && !isDuplicatePrimaryKey(error)) {
    throw error;
  }
}

async function pushQueueForUser(userId: string): Promise<{
  pushed: number;
  failed: number;
}> {
  const queue = await getQueueOperations(userId);
  const retryableOperations = queue.filter(
    (operation) =>
      operation.status === 'pending' ||
      (operation.status === 'failed' && operation.attempts < MAX_RETRY_ATTEMPTS),
  );

  let pushed = 0;
  let failed = 0;

  for (const operation of retryableOperations) {
    const now = new Date().toISOString();
    try {
      if (operation.type === 'create_pet') {
        await executeCreatePet(operation);
        await markLocalPetSyncState(userId, (operation.payload as CreatePetOperationPayload).id, 'synced');
      } else if (operation.type === 'create_appointment_request') {
        await executeCreateAppointment(operation);
        await markLocalAppointmentSyncState(
          userId,
          (operation.payload as CreateAppointmentOperationPayload).id,
          'synced',
        );
      }

      await removeQueueOperation(operation.id);
      pushed += 1;
    } catch (error) {
      failed += 1;
      const updatedOperation: OfflineOperation = {
        ...operation,
        status: 'failed',
        attempts: operation.attempts + 1,
        last_error: extractErrorMessage(error),
        updated_at: now,
      };
      await upsertQueueOperation(updatedOperation);

      if (operation.type === 'create_pet') {
        await markLocalPetSyncState(userId, (operation.payload as CreatePetOperationPayload).id, 'failed');
      } else if (operation.type === 'create_appointment_request') {
        await markLocalAppointmentSyncState(
          userId,
          (operation.payload as CreateAppointmentOperationPayload).id,
          'failed',
        );
      }
    }
  }

  return { pushed, failed };
}

async function pullServerData(userId: string): Promise<{
  pets: LocalFirstPet[];
  appointments: LocalFirstAppointment[];
}> {
  const [petsResult, appointmentsResult] = await Promise.all([
    supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('appointment_requests')
      .select('*, pets(id, name, type, breed)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  if (petsResult.error) throw petsResult.error;
  if (appointmentsResult.error) throw appointmentsResult.error;

  const serverPets = (petsResult.data ?? []).map((pet) =>
    mapServerPetToLocal({
      id: pet.id,
      user_id: pet.user_id,
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      notes: pet.notes,
      created_at: pet.created_at,
      updated_at: pet.updated_at,
    }),
  );

  const serverAppointments = (appointmentsResult.data ?? []).map((appointment) => {
    const petData = appointment.pets as
      | { id: string; name: string; type: string; breed: string | null }
      | null;

    return mapServerAppointmentToLocal({
      id: appointment.id,
      user_id: appointment.user_id,
      pet_id: appointment.pet_id,
      preferred_date: appointment.preferred_date,
      preferred_time: appointment.preferred_time,
      reason: appointment.reason,
      notes: appointment.notes,
      status: appointment.status,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
      pets: petData ?? undefined,
    });
  });

  const localData = await getUserLocalData(userId);
  const localUnsyncedPets = localData.pets.filter((pet) => pet.sync_state !== 'synced');
  const localUnsyncedAppointments = localData.appointments.filter(
    (appointment) => appointment.sync_state !== 'synced',
  );

  const mergedPetsMap = new Map(serverPets.map((pet) => [pet.id, pet]));
  for (const localPet of localUnsyncedPets) {
    if (!mergedPetsMap.has(localPet.id)) {
      mergedPetsMap.set(localPet.id, localPet);
    }
  }

  const mergedAppointmentsMap = new Map(
    serverAppointments.map((appointment) => [appointment.id, appointment]),
  );
  for (const localAppointment of localUnsyncedAppointments) {
    if (!mergedAppointmentsMap.has(localAppointment.id)) {
      mergedAppointmentsMap.set(localAppointment.id, localAppointment);
    }
  }

  const mergedPets = [...mergedPetsMap.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const mergedAppointments = fillAppointmentPets(
    [...mergedAppointmentsMap.values()].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    mergedPets,
  );

  return { pets: mergedPets, appointments: mergedAppointments };
}

export async function syncClientPortalData(userId: string): Promise<{
  pushed: number;
  failed: number;
  pendingOperations: number;
}> {
  if (!isNetworkOnline()) {
    return {
      pushed: 0,
      failed: 0,
      pendingOperations: await getPendingQueueCount(userId),
    };
  }

  const pushSummary = await pushQueueForUser(userId);
  const pulled = await pullServerData(userId);
  await replaceUserLocalData(userId, {
    pets: pulled.pets,
    appointments: pulled.appointments,
    last_synced_at: new Date().toISOString(),
  });

  return {
    pushed: pushSummary.pushed,
    failed: pushSummary.failed,
    pendingOperations: await getPendingQueueCount(userId),
  };
}

export async function createPetLocalFirst(
  userId: string,
  payload: Omit<CreatePetOperationPayload, 'id' | 'created_at' | 'updated_at'>,
): Promise<{
  pet: LocalFirstPet;
  pendingOperations: number;
}> {
  const now = new Date().toISOString();
  const petId = createUuid();
  const operationId = createUuid();

  const pet: LocalFirstPet = {
    id: petId,
    user_id: userId,
    name: payload.name,
    type: payload.type,
    breed: payload.breed,
    age: payload.age,
    weight: payload.weight,
    notes: payload.notes,
    created_at: now,
    updated_at: now,
    sync_state: 'pending',
  };

  const operation: OfflineOperation = {
    id: operationId,
    type: 'create_pet',
    user_id: userId,
    status: 'pending',
    attempts: 0,
    last_error: null,
    created_at: now,
    updated_at: now,
    payload: {
      id: petId,
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      notes: pet.notes,
      created_at: pet.created_at,
      updated_at: pet.updated_at,
    },
  };

  await upsertLocalPet(userId, pet);
  await upsertQueueOperation(operation);

  if (isNetworkOnline()) {
    try {
      await syncClientPortalData(userId);
    } catch {
      // Mantém dados locais e pendências; próxima sync tenta novamente.
    }
  }

  const snapshot = await getClientPortalSnapshot(userId);
  return {
    pet: snapshot.pets.find((item) => item.id === petId) ?? pet,
    pendingOperations: snapshot.pendingOperations,
  };
}

export async function createAppointmentLocalFirst(
  userId: string,
  payload: Omit<CreateAppointmentOperationPayload, 'id' | 'created_at' | 'updated_at' | 'status'>,
): Promise<{
  appointment: LocalFirstAppointment;
  pendingOperations: number;
}> {
  const now = new Date().toISOString();
  const appointmentId = createUuid();
  const operationId = createUuid();

  const localData = await getUserLocalData(userId);
  const pet = localData.pets.find((item) => item.id === payload.pet_id);

  const appointment: LocalFirstAppointment = {
    id: appointmentId,
    user_id: userId,
    pet_id: payload.pet_id,
    preferred_date: payload.preferred_date,
    preferred_time: payload.preferred_time,
    reason: payload.reason,
    notes: payload.notes,
    status: 'pending',
    created_at: now,
    updated_at: now,
    pets: pet
      ? {
          id: pet.id,
          name: pet.name,
          type: pet.type,
          breed: pet.breed,
        }
      : undefined,
    sync_state: 'pending',
  };

  const operation: OfflineOperation = {
    id: operationId,
    type: 'create_appointment_request',
    user_id: userId,
    status: 'pending',
    attempts: 0,
    last_error: null,
    created_at: now,
    updated_at: now,
    payload: {
      id: appointment.id,
      pet_id: appointment.pet_id,
      preferred_date: appointment.preferred_date,
      preferred_time: appointment.preferred_time,
      reason: appointment.reason,
      notes: appointment.notes,
      status: appointment.status,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
    },
  };

  await upsertLocalAppointment(userId, appointment);
  await upsertQueueOperation(operation);

  if (isNetworkOnline()) {
    try {
      await syncClientPortalData(userId);
    } catch {
      // Mantém dados locais e pendências; próxima sync tenta novamente.
    }
  }

  const snapshot = await getClientPortalSnapshot(userId);
  return {
    appointment:
      snapshot.appointments.find((item) => item.id === appointmentId) ?? appointment,
    pendingOperations: snapshot.pendingOperations,
  };
}

export async function markQueueForRetry(userId: string): Promise<void> {
  const operations = await getQueueOperations(userId);
  const now = new Date().toISOString();

  await Promise.all(
    operations.map(async (operation) => {
      if (operation.status !== 'failed') return;
      await upsertQueueOperation({
        ...operation,
        status: 'pending',
        updated_at: now,
      });
    }),
  );
}
