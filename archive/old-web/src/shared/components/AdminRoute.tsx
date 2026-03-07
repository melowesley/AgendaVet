import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/useAuthStore';
import { PawPrint } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: Props) => {
  const { user, isAdmin, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <PawPrint className="h-10 w-10 text-teal-600 animate-pulse" />
        <p className="text-sm text-muted-foreground">Verificando acesso...</p>
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};
