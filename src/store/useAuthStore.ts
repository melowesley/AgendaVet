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
  let isInitializing = true;

  // 1. Busca a sessão inicial antes de ouvir as mudanças
  supabase.auth.getSession().then(async ({ data: { session }, error }) => {
    if (error) {
      console.error('Auth getSession error:', error);
      useAuthStore.setState({ user: null, isAdmin: false, isLoading: false });
      isInitializing = false;
      return;
    }

    const user = session?.user ?? null;
    const isAdmin = user ? await checkAdminRole(user.id) : false;
    useAuthStore.setState({ user, isAdmin, isLoading: false });
    isInitializing = false;
  });

  // 2. Escuta mudanças, MAS ignora disparos se ainda estiver inicializando a sessão principal
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    // Evita loop duplo de re-renderização durante o boot inicial no Android
    if (isInitializing && event === 'INITIAL_SESSION') return;

    const user = session?.user ?? null;

    // Se fez logout de propósito, atualizar na hora
    if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ user: null, isAdmin: false, isLoading: false });
      return;
    }

    const isAdmin = user ? await checkAdminRole(user.id) : false;
    useAuthStore.setState({ user, isAdmin, isLoading: false });
  });

  return () => subscription.unsubscribe();
}
