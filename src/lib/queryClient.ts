import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutos — evita refetch desnecessário
      gcTime: 1000 * 60 * 10,         // 10 minutos de cache em memória após desmontar
      retry: 1,                        // 1 tentativa ao invés de 3
      refetchOnWindowFocus: false,     // não refetch ao trocar de aba ou janela
    },
    mutations: {
      retry: 0,
    },
  },
});
