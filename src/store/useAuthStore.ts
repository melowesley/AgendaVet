import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  isAdmin: false,
  isLoading: true,
}));

async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

async function getVerifiedUserFromSession(): Promise<User | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    await supabase.auth.signOut();
    return null;
  }

  return data.user;
}

/**
 * initializeAuth
 *
 * Deve ser chamado uma única vez na raiz da aplicação (App.tsx).
 * - Lê a sessão inicial e verifica o papel de admin
 * - Inscreve-se em onAuthStateChange para manter o estado atualizado
 *   em login, logout e refresh de token
 * - Retorna uma função de cleanup para cancelar a assinatura
 */
export function initializeAuth(): () => void {
  getVerifiedUserFromSession().then(async (user) => {
    const isAdmin = user ? await checkAdminRole(user.id) : false;
    useAuthStore.setState({ user, isAdmin, isLoading: false });
  }).catch(() => {
    useAuthStore.setState({ user: null, isAdmin: false, isLoading: false });
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const user = session?.user ?? null;
    if (!user) {
      useAuthStore.setState({ user: null, isAdmin: false, isLoading: false });
      return;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      await supabase.auth.signOut();
      useAuthStore.setState({ user: null, isAdmin: false, isLoading: false });
      return;
    }

    const isAdmin = await checkAdminRole(data.user.id);
    useAuthStore.setState({ user: data.user, isAdmin, isLoading: false });
  });

  return () => subscription.unsubscribe();
}
