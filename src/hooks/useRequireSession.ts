/**
 * Hook para verificar sessão antes de carregar dados.
 * Redireciona para login apenas se getSession() confirmar ausência de sessão.
 *
 * Use getSession() em vez de getUser() para verificar sessão persistida
 * (getUser faz chamada à API; getSession lê do storage local — mais rápido no Android).
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface UseRequireSessionOptions {
  redirectTo?: string;
  onSession?: (session: Session) => void;
}

/**
 * Verifica sessão e redireciona se não houver.
 * Retorna { session, loading, error }.
 */
export function useRequireSession(options: UseRequireSessionOptions = {}) {
  const { redirectTo = '/auth', onSession } = options;
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session: s }, error: err } = await supabase.auth.getSession();

        if (!mounted) return;

        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }

        if (!s) {
          navigate(redirectTo, { replace: true });
          setLoading(false);
          return;
        }

        setSession(s);
        onSession?.(s);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao verificar sessão';
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s) onSession?.(s);
      else navigate(redirectTo, { replace: true });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, redirectTo, onSession]);

  return { session, loading, error };
}
