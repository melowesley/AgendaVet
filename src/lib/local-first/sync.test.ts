import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => {
  const serverDb = {
    pets: [] as Array<{
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
    }>,
    appointments: [] as Array<{
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
    }>,
  };

  function createSelectChain(table: 'pets' | 'appointment_requests') {
    const filters = new Map<string, unknown>();
    const chain = {
      eq(column: string, value: unknown) {
        filters.set(column, value);
        return chain;
      },
      order(column: string, opts?: { ascending?: boolean }) {
        const asc = opts?.ascending ?? true;
        const source =
          table === 'pets' ? [...serverDb.pets] : [...serverDb.appointments];

        const filtered = source.filter((row) =>
          [...filters.entries()].every(
            ([col, value]) => (row as Record<string, unknown>)[col] === value,
          ),
        );

        filtered.sort((a, b) => {
          const aValue = new Date(
            (a as Record<string, string>)[column] ?? '',
          ).getTime();
          const bValue = new Date(
            (b as Record<string, string>)[column] ?? '',
          ).getTime();
          return asc ? aValue - bValue : bValue - aValue;
        });

        if (table === 'appointment_requests') {
          const rows = filtered.map((appointment) => {
            const pet = serverDb.pets.find((p) => p.id === appointment.pet_id);
            return {
              ...appointment,
              pets: pet
                ? {
                    id: pet.id,
                    name: pet.name,
                    type: pet.type,
                    breed: pet.breed,
                  }
                : null,
            };
          });
          return Promise.resolve({ data: rows, error: null });
        }

        return Promise.resolve({ data: filtered, error: null });
      },
    };

    return chain;
  }

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'pets') {
        return {
          insert: vi.fn(async (payload: Record<string, unknown>) => {
            const row = payload as (typeof serverDb.pets)[number];
            if (serverDb.pets.some((pet) => pet.id === row.id)) {
              return {
                error: {
                  code: '23505',
                  message: 'duplicate key value violates unique constraint',
                },
              };
            }
            serverDb.pets.push(row);
            return { error: null };
          }),
          select: vi.fn(() => createSelectChain('pets')),
        };
      }

      if (table === 'appointment_requests') {
        return {
          insert: vi.fn(async (payload: Record<string, unknown>) => {
            const row = payload as (typeof serverDb.appointments)[number];
            if (
              serverDb.appointments.some(
                (appointment) => appointment.id === row.id,
              )
            ) {
              return {
                error: {
                  code: '23505',
                  message: 'duplicate key value violates unique constraint',
                },
              };
            }
            serverDb.appointments.push(row);
            return { error: null };
          }),
          select: vi.fn(() => createSelectChain('appointment_requests')),
        };
      }

      throw new Error(`Tabela não mockada: ${table}`);
    }),
  };

  return { serverDb, supabase };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mocked.supabase }));

import {
  createAppointmentLocalFirst,
  createPetLocalFirst,
  getClientPortalSnapshot,
  syncClientPortalData,
} from '@/lib/local-first/sync';
import { resetLocalFirstStateForTests } from '@/lib/local-first/state';
import { clearMemoryFallbackForTests } from '@/lib/local-first/storage';

let onlineSpy: ReturnType<typeof vi.spyOn> | null = null;
const serverDb = mocked.serverDb;

function setOnline(value: boolean): void {
  onlineSpy?.mockRestore();
  onlineSpy = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(value);
}

describe('local-first sync', () => {
  beforeEach(async () => {
    serverDb.pets = [];
    serverDb.appointments = [];
    clearMemoryFallbackForTests();
    await resetLocalFirstStateForTests();
    setOnline(true);
  });

  afterEach(() => {
    onlineSpy?.mockRestore();
    onlineSpy = null;
  });

  it('salva pet localmente quando offline', async () => {
    setOnline(false);

    const created = await createPetLocalFirst('user-1', {
      name: 'Thor',
      type: 'dog',
      breed: 'SRD',
      age: '3 anos',
      weight: '12kg',
      notes: 'Alergia leve',
    });

    const snapshot = await getClientPortalSnapshot('user-1');

    expect(created.pet.sync_state).toBe('pending');
    expect(snapshot.pets).toHaveLength(1);
    expect(snapshot.pendingOperations).toBe(1);
    expect(serverDb.pets).toHaveLength(0);
  });

  it('sincroniza fila offline e limpa pendências ao voltar online', async () => {
    setOnline(false);

    const petResult = await createPetLocalFirst('user-1', {
      name: 'Luna',
      type: 'cat',
      breed: 'Siamês',
      age: null,
      weight: null,
      notes: null,
    });

    await createAppointmentLocalFirst('user-1', {
      pet_id: petResult.pet.id,
      preferred_date: '2026-03-10',
      preferred_time: '09:30',
      reason: 'Consulta de rotina',
      notes: null,
    });

    let snapshot = await getClientPortalSnapshot('user-1');
    expect(snapshot.pendingOperations).toBe(2);

    setOnline(true);
    await syncClientPortalData('user-1');

    snapshot = await getClientPortalSnapshot('user-1');
    expect(serverDb.pets).toHaveLength(1);
    expect(serverDb.appointments).toHaveLength(1);
    expect(snapshot.pendingOperations).toBe(0);
    expect(snapshot.pets[0].sync_state).toBe('synced');
    expect(snapshot.appointments[0].sync_state).toBe('synced');
    expect(snapshot.lastSyncedAt).not.toBeNull();
  });
});
