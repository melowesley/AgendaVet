import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isNetworkOnline, syncClientPortalData } from '@/lib/local-first/sync';

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
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  return !!data;
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
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    const user = session?.user ?? null;
    const isAdmin = user ? await checkAdminRole(user.id) : false;
    useAuthStore.setState({ user, isAdmin, isLoading: false });
    if (user && isNetworkOnline()) {
      void syncClientPortalData(user.id).catch(() => undefined);
    }
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const user = session?.user ?? null;
    const isAdmin = user ? await checkAdminRole(user.id) : false;
    useAuthStore.setState({ user, isAdmin, isLoading: false });
    if (user && isNetworkOnline()) {
      void syncClientPortalData(user.id).catch(() => undefined);
    }
  });

  return () => subscription.unsubscribe();
}
