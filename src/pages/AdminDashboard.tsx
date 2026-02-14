import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Clock, Calendar, Users, PawPrint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppointmentRequestsTable } from '@/components/admin/AppointmentRequestsTable';
import { ServicesManager } from '@/components/admin/ServicesManager';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { CalendarView } from '@/components/admin/CalendarView';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { PetsListTab } from '@/components/admin/PetsListTab';
import { TutorsListTab } from '@/components/admin/TutorsListTab';
import { useAppointmentRequests } from '@/hooks/useAppointmentRequests';
import { AdminLayout } from '@/components/layout/AdminLayout';

const VALID_TABS = ['patients', 'tutors', 'calendar', 'requests', 'analytics', 'users', 'services'] as const;
type AdminTab = (typeof VALID_TABS)[number];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAdmin, isLoading } = useAdminCheck();
  const { requests, refetch: refetchRequests } = useAppointmentRequests();

  const tabFromUrl = searchParams.get('tab') || 'patients';
  const activeTab: AdminTab = VALID_TABS.includes(tabFromUrl as AdminTab)
    ? (tabFromUrl as AdminTab)
    : 'patients';

  const [stats, setStats] = useState({
    pendingRequests: 0,
    confirmedToday: 0,
    totalClients: 0,
    totalPets: 0,
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta área.',
        variant: 'destructive',
      });
      navigate('/admin/login');
    }
  }, [isAdmin, isLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin]);

  // Manter cards em sincronia com a agenda: atualizar ao abrir a aba calendário
  useEffect(() => {
    if (isAdmin && activeTab === 'calendar') {
      fetchStats();
      refetchRequests();
    }
  }, [isAdmin, activeTab]);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [pendingRes, confirmedRes, clientsRes, petsRes] = await Promise.all([
      supabase.from('appointment_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('appointment_requests').select('id', { count: 'exact' }).eq('status', 'confirmed').eq('scheduled_date', today),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('pets').select('id', { count: 'exact' }),
    ]);
    setStats({
      pendingRequests: pendingRes.count || 0,
      confirmedToday: confirmedRes.count || 0,
      totalClients: clientsRes.count || 0,
      totalPets: petsRes.count || 0,
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-teal-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-200 border-t-teal-600" />
          <span className="text-sm text-teal-600 font-medium">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 h-full min-h-0 overflow-auto">

        {/* ── Stats cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 px-3 sm:px-4 pt-3 sm:pt-4">
          <AdminStatsCard
            title="Solicitações Pendentes"
            value={stats.pendingRequests}
            icon={Clock}
            description={stats.pendingRequests > 0 ? 'Aguardando aprovação' : 'Nenhuma pendente'}
            variant="amber"
          />
          <AdminStatsCard
            title="Confirmadas Hoje"
            value={stats.confirmedToday}
            icon={Calendar}
            description="Consultas agendadas"
            variant="blue"
          />
          <AdminStatsCard
            title="Total de Clientes"
            value={stats.totalClients}
            icon={Users}
            description="Clientes cadastrados"
            variant="emerald"
          />
          <AdminStatsCard
            title="Total de Pets"
            value={stats.totalPets}
            icon={PawPrint}
            description="Animais registrados"
            variant="violet"
          />
        </div>

        {/* ── Tab content ─────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-auto mx-2 sm:mx-4 mb-4">

          {activeTab === 'patients' && (
            <div className="p-3 sm:p-4">
              <h2 className="text-base font-bold text-teal-700 flex items-center gap-2 mb-4">
                <PawPrint size={18} />
                Pacientes
              </h2>
              <PetsListTab />
            </div>
          )}

          {activeTab === 'tutors' && (
            <div className="p-3 sm:p-4">
              <h2 className="text-base font-bold text-teal-700 flex items-center gap-2 mb-4">
                <Users size={18} />
                Tutores
              </h2>
              <TutorsListTab />
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="p-3 sm:p-4 min-w-0">
              <h2 className="text-base font-bold text-teal-700 flex items-center gap-2 mb-4">
                <Calendar size={18} />
                Agenda de Consultas
              </h2>
              <CalendarView
                requests={requests}
                onStatusChange={() => {
                  fetchStats();
                  refetchRequests();
                }}
              />
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="p-3 sm:p-4 overflow-x-auto">
              <h2 className="text-base font-bold text-teal-700 mb-4">
                Solicitações de Consulta
              </h2>
              <AppointmentRequestsTable
                onUpdate={() => { fetchStats(); refetchRequests(); }}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="p-3 sm:p-4 overflow-x-auto min-w-0">
              <h2 className="text-base font-bold text-teal-700 mb-4">
                Dashboard Analítico
              </h2>
              <AnalyticsDashboard />
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-3 sm:p-4 overflow-x-auto min-w-0">
              <h2 className="text-base font-bold text-teal-700 mb-4">
                Gerenciar Usuários e Auditoria
              </h2>
              <UserManagement />
            </div>
          )}

          {activeTab === 'services' && (
            <div className="p-3 sm:p-4 overflow-x-auto min-w-0">
              <h2 className="text-base font-bold text-teal-700 mb-4">
                Gerenciar Serviços e Valores
              </h2>
              <ServicesManager />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
