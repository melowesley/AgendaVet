import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar, Users, Clock, PawPrint, BarChart3, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppointmentRequestsTable } from '@/components/admin/AppointmentRequestsTable';
import { ServicesManager } from '@/components/admin/ServicesManager';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { CalendarView } from '@/components/admin/CalendarView';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { useAppointmentRequests } from '@/hooks/useAppointmentRequests';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading } = useAdminCheck();
  const { requests, refetch: refetchRequests } = useAppointmentRequests();
  const [stats, setStats] = useState({
    pendingRequests: 0,
    confirmedToday: 0,
    totalClients: 0,
    totalPets: 0
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta área.",
        variant: "destructive"
      });
      navigate('/admin/login');
    }
  }, [isAdmin, isLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const [pendingRes, confirmedRes, clientsRes, petsRes] = await Promise.all([
      supabase.from('appointment_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('appointment_requests').select('id', { count: 'exact' }).eq('status', 'confirmed').eq('scheduled_date', today),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('pets').select('id', { count: 'exact' })
    ]);

    setStats({
      pendingRequests: pendingRes.count || 0,
      confirmedToday: confirmedRes.count || 0,
      totalClients: clientsRes.count || 0,
      totalPets: petsRes.count || 0
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">VetAgenda Admin</h1>
              <p className="text-sm text-muted-foreground">Painel Administrativo</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AdminStatsCard
            title="Solicitações Pendentes"
            value={stats.pendingRequests}
            icon={Clock}
            description={stats.pendingRequests > 0 ? "Aguardando aprovação" : "Nenhuma pendente"}
          />
          <AdminStatsCard
            title="Confirmadas Hoje"
            value={stats.confirmedToday}
            icon={Calendar}
            description="Consultas agendadas"
          />
          <AdminStatsCard
            title="Total de Clientes"
            value={stats.totalClients}
            icon={Users}
            description="Clientes cadastrados"
          />
          <AdminStatsCard
            title="Total de Pets"
            value={stats.totalPets}
            icon={PawPrint}
            description="Animais registrados"
          />
        </div>

        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="calendar">Agenda</TabsTrigger>
            <TabsTrigger value="requests">Solicitações</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-1" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users">
              <Shield className="h-4 w-4 mr-1" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Agenda de Consultas</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarView requests={requests} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Consulta</CardTitle>
              </CardHeader>
              <CardContent>
                <AppointmentRequestsTable onUpdate={() => { fetchStats(); refetchRequests(); }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Analítico</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Usuários e Auditoria</CardTitle>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Serviços e Valores</CardTitle>
              </CardHeader>
              <CardContent>
                <ServicesManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
