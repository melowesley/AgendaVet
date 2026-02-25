import { kvGet, kvSet } from '@/lib/local-first/storage';
import type {
  LocalFirstAppointment,
  LocalFirstPet,
  LocalFirstStateSchema,
  LocalUserData,
  OfflineOperation,
  ResourceCacheEntry,
  SyncState,
} from '@/lib/local-first/types';

const LOCAL_FIRST_STATE_KEY = 'local-first-state-v1';

const EMPTY_USER_DATA: LocalUserData = {
  pets: [],
  appointments: [],
  last_synced_at: null,
};

const EMPTY_STATE: LocalFirstStateSchema = {
  users: {},
  queue: [],
  resources: {},
};

let mutationLock: Promise<void> = Promise.resolve();

function sortByCreatedAtDesc<T extends { created_at: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return bTime - aTime;
  });
}

async function readState(): Promise<LocalFirstStateSchema> {
  const stored = await kvGet<LocalFirstStateSchema>(LOCAL_FIRST_STATE_KEY);
  if (!stored) return { ...EMPTY_STATE };

  return {
    users: stored.users ?? {},
    queue: stored.queue ?? [],
    resources: stored.resources ?? {},
  };
}

async function writeState(state: LocalFirstStateSchema): Promise<void> {
  await kvSet(LOCAL_FIRST_STATE_KEY, state);
}

async function withStateMutation<T>(
  mutate: (state: LocalFirstStateSchema) => T | Promise<T>,
): Promise<T> {
  const previous = mutationLock;
  let releaseLock: () => void = () => {};
  mutationLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  await previous;
  try {
    const state = await readState();
    const result = await mutate(state);
    await writeState(state);
    return result;
  } finally {
    releaseLock();
  }
}

function getUserDataOrDefault(state: LocalFirstStateSchema, userId: string): LocalUserData {
  return state.users[userId] ?? { ...EMPTY_USER_DATA };
}

export async function getUserLocalData(userId: string): Promise<LocalUserData> {
  const state = await readState();
  return getUserDataOrDefault(state, userId);
}

export async function replaceUserLocalData(
  userId: string,
  data: LocalUserData,
): Promise<void> {
  await withStateMutation((state) => {
    state.users[userId] = {
      pets: sortByCreatedAtDesc(data.pets),
      appointments: sortByCreatedAtDesc(data.appointments),
      last_synced_at: data.last_synced_at,
    };
  });
}

export async function upsertLocalPet(userId: string, pet: LocalFirstPet): Promise<void> {
  await withStateMutation((state) => {
    const userData = getUserDataOrDefault(state, userId);
    const withoutCurrent = userData.pets.filter((item) => item.id !== pet.id);
    userData.pets = sortByCreatedAtDesc([pet, ...withoutCurrent]);
    state.users[userId] = userData;
  });
}

export async function upsertLocalAppointment(
  userId: string,
  appointment: LocalFirstAppointment,
): Promise<void> {
  await withStateMutation((state) => {
    const userData = getUserDataOrDefault(state, userId);
    const withoutCurrent = userData.appointments.filter((item) => item.id !== appointment.id);
    userData.appointments = sortByCreatedAtDesc([appointment, ...withoutCurrent]);
    state.users[userId] = userData;
  });
}

export async function markLocalPetSyncState(
  userId: string,
  petId: string,
  syncState: SyncState,
): Promise<void> {
  await withStateMutation((state) => {
    const userData = getUserDataOrDefault(state, userId);
    userData.pets = userData.pets.map((pet) =>
      pet.id === petId ? { ...pet, sync_state: syncState } : pet,
    );
    state.users[userId] = userData;
  });
}

export async function markLocalAppointmentSyncState(
  userId: string,
  appointmentId: string,
  syncState: SyncState,
): Promise<void> {
  await withStateMutation((state) => {
    const userData = getUserDataOrDefault(state, userId);
    userData.appointments = userData.appointments.map((appointment) =>
      appointment.id === appointmentId
        ? { ...appointment, sync_state: syncState }
        : appointment,
    );
    state.users[userId] = userData;
  });
}

export async function upsertQueueOperation(operation: OfflineOperation): Promise<void> {
  await withStateMutation((state) => {
    const withoutCurrent = state.queue.filter((item) => item.id !== operation.id);
    state.queue = [...withoutCurrent, operation];
  });
}

export async function removeQueueOperation(operationId: string): Promise<void> {
  await withStateMutation((state) => {
    state.queue = state.queue.filter((operation) => operation.id !== operationId);
  });
}

export async function getQueueOperations(userId?: string): Promise<OfflineOperation[]> {
  const state = await readState();
  const operations = userId
    ? state.queue.filter((operation) => operation.user_id === userId)
    : state.queue;

  return [...operations].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export async function getPendingQueueCount(userId?: string): Promise<number> {
  const operations = await getQueueOperations(userId);
  return operations.filter((operation) => operation.status !== 'failed' || operation.attempts < 5).length;
}

export async function setResourceCache<T>(key: string, data: T): Promise<void> {
  await withStateMutation((state) => {
    state.resources[key] = {
      data,
      updated_at: new Date().toISOString(),
    };
  });
}

export async function getResourceCache<T>(key: string): Promise<ResourceCacheEntry<T> | null> {
  const state = await readState();
  const entry = state.resources[key];
  if (!entry) return null;
  return entry as ResourceCacheEntry<T>;
}

export async function resetLocalFirstStateForTests(): Promise<void> {
  await kvSet(LOCAL_FIRST_STATE_KEY, {
    users: {},
    queue: [],
    resources: {},
  });
}
