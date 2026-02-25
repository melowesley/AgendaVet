const DB_NAME = 'agendavet-local-first';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

const memoryStore = new Map<string, unknown>();
let forceMemoryFallback = false;
let dbPromise: Promise<IDBDatabase> | null = null;

function canUseIndexedDb(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.indexedDB !== 'undefined'
  );
}

function openIndexedDb(): Promise<IDBDatabase> {
  if (!canUseIndexedDb()) {
    return Promise.reject(new Error('IndexedDB indisponível'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir IndexedDB'));
  });

  return dbPromise;
}

function runRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Erro em operação IndexedDB'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await openIndexedDb();
  const transaction = db.transaction(STORE_NAME, mode);
  const store = transaction.objectStore(STORE_NAME);
  return operation(store);
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (forceMemoryFallback || !canUseIndexedDb()) {
    return (memoryStore.get(key) as T | undefined) ?? null;
  }

  try {
    return await withStore('readonly', async (store) => {
      const value = await runRequest(store.get(key));
      return (value as T | undefined) ?? null;
    });
  } catch {
    forceMemoryFallback = true;
    return (memoryStore.get(key) as T | undefined) ?? null;
  }
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  memoryStore.set(key, value);

  if (forceMemoryFallback || !canUseIndexedDb()) return;

  try {
    await withStore('readwrite', async (store) => {
      await runRequest(store.put(value, key));
    });
  } catch {
    forceMemoryFallback = true;
  }
}

export async function kvDelete(key: string): Promise<void> {
  memoryStore.delete(key);

  if (forceMemoryFallback || !canUseIndexedDb()) return;

  try {
    await withStore('readwrite', async (store) => {
      await runRequest(store.delete(key));
    });
  } catch {
    forceMemoryFallback = true;
  }
}

export function clearMemoryFallbackForTests(): void {
  memoryStore.clear();
  forceMemoryFallback = false;
  dbPromise = null;
}
