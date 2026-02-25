/**
 * Cliente Supabase — configurado para React + Capacitor (Android)
 *
 * Configurações críticas para Android:
 * - storage: window.localStorage — garante persistência no WebView
 * - persistSession: true — mantém sessão após fechar app
 * - autoRefreshToken: true — renova token automaticamente
 * - detectSessionInUrl: true — captura redirect OAuth (útil no browser)
 *
 * Variáveis de ambiente (Vite):
 * - VITE_SUPABASE_URL (obrigatório)
 * - VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY (anon key do Supabase)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { supabaseLogger } from '@/lib/supabaseLogger';

// Suporta ambos os nomes de variável (ANON_KEY é o padrão oficial)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const missing = [];
  if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY');
  supabaseLogger.error('Configuração Supabase incompleta', {
    missing,
    hasUrl: !!SUPABASE_URL,
    hasKey: !!SUPABASE_ANON_KEY,
  });
}

// Garante que não há localhost em produção (Android usa URL do Supabase)
const url = SUPABASE_URL || '';
if (url.includes('localhost') && import.meta.env.PROD) {
  supabaseLogger.warn('VITE_SUPABASE_URL contém localhost em produção', { url });
}

// Storage explícito para Capacitor — evita que o WebView use storage inconsistente
const storage = typeof window !== 'undefined' ? window.localStorage : undefined;

export const supabase = createClient<Database>(SUPABASE_URL || '', SUPABASE_ANON_KEY || '', {
  auth: {
    storage: storage ?? undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, options).catch((err) => {
        supabaseLogger.error('Erro de rede Supabase', {
          url: String(url),
          message: err?.message,
          details: err,
        });
        throw err;
      });
    },
  },
});

// Intercepta erros de auth para log detalhado
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
    supabaseLogger.debug('Auth state change', { event, hasSession: !!session });
  }
});
