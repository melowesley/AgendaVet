import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/useAuthStore';
import { PawPrint } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({ children, redirectTo = '/auth' }: Props) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <PawPrint className="h-10 w-10 text-teal-600 animate-pulse" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
};
