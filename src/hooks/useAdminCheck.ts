import { useAuthStore } from '@/store/useAuthStore';

/**
 * useAdminCheck
 *
 * Lê o estado de autenticação do store global (Zustand).
 * A verificação de admin é feita uma única vez na inicialização da app (initializeAuth),
 * eliminando queries repetidas ao banco a cada montagem de componente.
 */
export const useAdminCheck = () => {
  const { isAdmin, isLoading } = useAuthStore();
  return { isAdmin, isLoading };
};
