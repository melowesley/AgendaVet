import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

interface SupabaseStorageAdapter {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
}

const webStorage: SupabaseStorageAdapter = {
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

const nativeStorage: SupabaseStorageAdapter = {
  getItem: async (key) => (await Preferences.get({ key })).value,
  setItem: async (key, value) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key) => {
    await Preferences.remove({ key });
  },
};

export const isNativePlatform = Capacitor.isNativePlatform();
export const supabaseAuthStorage = isNativePlatform ? nativeStorage : webStorage;
