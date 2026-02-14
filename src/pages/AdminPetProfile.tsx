import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { usePetTimeline, getModuleLabel, type TimelineEntry } from '@/hooks/usePetTimeline';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar, Stethoscope, ChevronRight, ChevronLeft,
  PawPrint, Printer, Phone,
  User, X, Flame, Clock, MoreVertical, Plus, ShoppingCart, ShoppingBag,
  ClipboardCheck, Scissors, RotateCcw, Weight, Microscope,
  FileText, FlaskConical, Camera, Droplet, ClipboardList,
  MessageSquare, Video, Cross, Bug, ScissorsLineDashed, Skull, Mic,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AttendanceTypeDialog, ATTENDANCE_TYPES, type AttendanceTypeKey } from '@/components/admin/AttendanceTypeDialog';
import { HistoryEntryDetailDialog } from '@/components/admin/HistoryEntryDetailDialog';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAttendanceTypeSidebar } from '@/contexts/AttendanceTypeSidebarContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
  user_id: string;
}

interface OwnerProfile {
  full_name: string | null;
  phone: string | null;
  address: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'border-l-amber-400',
  confirmed: 'border-l-blue-500',
  completed: 'border-l-emerald-500',
  cancelled: 'border-l-red-400',
};

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-400',
};

const MODULE_ICONS: Record<string, React.ElementType> = {
  consulta: Stethoscope,
  avaliacao_cirurgica: ClipboardCheck,
  cirurgia: Scissors,
  retorno: RotateCcw,
  peso: Weight,
  patologia: Microscope,
  documento: FileText,
  exame: FlaskConical,
  fotos: Camera,
  vacina: Droplet,
  receita: ClipboardList,
  observacoes: MessageSquare,
  video: Video,
  internacao: Cross,
  diagnostico: Bug,
  banho_tosa: ScissorsLineDashed,
  obito: Skull,
  gravacoes: Mic,
  servico: ShoppingBag,
};

type DialogType = 'atendimento' | AttendanceTypeKey | null;

interface Service {
  id: string;
  name: string;
  price: number;
  description: string | null;
  duration_minutes: number | null;
  active: boolean | null;
}

interface PetService {
  id: string;
  service_name: string;
  price_snapshot: number;
  quantity: number;
  created_at: string;
}

const AdminPetProfile = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [pet, setPet] = useState<Pet | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [petLoading, setPetLoading] = useState(true);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [procedureSearch, setProcedureSearch] = useState('');
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [balanceDetailOpen, setBalanceDetailOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [petServices, setPetServices] = useState<PetService[]>([]);
  const [activeTab, setActiveTab] = useState('historico');
  const sidebarCtx = useAttendanceTypeSidebar();
  const { timeline, loading: timelineLoading, refetch: refetchTimeline } = usePetTimeline(petId);

  // Abrir dialog quando o usuário escolhe um tipo na barra lateral (botão flutuante)
  useEffect(() => {
    if (!sidebarCtx?.selection || !petId) return;
    if (sidebarCtx.selection.petId === petId) {
      setActiveDialog(sidebarCtx.selection.type);
      sidebarCtx.clearSelection();
    }
  }, [sidebarCtx?.selection, petId, sidebarCtx]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate('/admin/login');
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (petId && isAdmin) loadPetData();
  }, [petId, isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchServices();
  }, [isAdmin]);

  useEffect(() => {
    if (petId && isAdmin) fetchPetServices();
  }, [petId, isAdmin]);

  const fetchServices = async () => {
    setServicesLoading(true);
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('name');
    setServices((data as Service[]) || []);
    setServicesLoading(false);
  };

  const fetchPetServices = async () => {
    if (!petId) return;
    const { data } = await supabase
      .from('pet_services')
      .select('id, service_name, price_snapshot, quantity, created_at')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false });
    setPetServices((data as PetService[]) || []);
  };

  const handleAddService = async (svc: Service) => {
    if (!petId) return;
    setServiceMenuOpen(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: ps, error } = await supabase
        .from('pet_services')
        .insert({
          pet_id: petId,
          service_id: svc.id,
          service_name: svc.name,
          price_snapshot: svc.price,
          quantity: 1,
          added_by: user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('pet_admin_history').insert({
        pet_id: petId,
        module: 'servico',
        action: 'create',
        title: `Serviço: ${svc.name}`,
        details: {
          service_id: svc.id,
          service_name: svc.name,
          price: svc.price,
          pet_service_id: ps?.id,
        },
        source_id: ps?.id ?? null,
      });

      toast({ title: 'Serviço adicionado!', description: `${svc.name} registrado no histórico.` });
      fetchPetServices();
      refetchTimeline();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível adicionar o serviço.', variant: 'destructive' });
    }
  };

  const loadPetData = async () => {
    setPetLoading(true);
    const { data: petData } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId!)
      .single();

    if (petData) {
      setPet(petData as Pet);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone, address')
        .eq('user_id', petData.user_id)
        .single();
      if (profileData) {
        setOwner({
          full_name: profileData.full_name,
          phone: profileData.phone,
          address: (profileData as Record<string, unknown>).address as string | null ?? null,
        });
      }
    }
    setPetLoading(false);
  };

  const closeDialog = () => {
    setActiveDialog(null);
    refetchTimeline();
  };

  const handleWhatsApp = () => {
    if (!owner?.phone) {
      toast({ title: 'Sem telefone', description: 'O tutor não possui telefone cadastrado.', variant: 'destructive' });
      return;
    }
    const phone = owner.phone.replace(/\D/g, '');
    const phoneFormatted = phone.startsWith('55') ? phone : `55${phone}`;
    window.open(`https://wa.me/${phoneFormatted}?text=${encodeURIComponent(`Olá ${owner.full_name || 'Tutor'}! Entro em contato sobre o(a) ${pet?.name || 'seu pet'}.`)}`, '_blank');
  };

  if (adminLoading || petLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Pet não encontrado.</p>
      </div>
    );
  }

  const grouped = timeline.reduce<Record<string, typeof timeline>>((acc, entry) => {
    const year = new Date(entry.date).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(entry);
    return acc;
  }, {});

  return (
    <AdminLayout>
    <div className="h-full flex flex-col overflow-hidden bg-white">

      {/* ── Informações Pet (paciente) + Tutor ─────────────────────────── */}
      {(() => {
        const saldoTotal = petServices.reduce((s, ps) => s + ps.price_snapshot * ps.quantity, 0);
        const fmt = (n: number) => n.toFixed(2).replace('.', ',');
        return (
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
            {/* Pet (paciente) primeiro */}
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <PawPrint size={20} className="text-slate-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-slate-800 truncate">
                      {pet.name.toUpperCase()} {pet?.id && `(${pet.id.slice(0, 5)})`}
                    </h3>
                    <button
                      onClick={() => navigate('/admin')}
                      className="w-8 h-8 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors shrink-0"
                      title="Fechar"
                    >
                      <X size={14} className="text-slate-500" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 break-words">
                    {pet.breed && `${pet.breed.toUpperCase()}, `}
                    {pet.type === 'dog' ? 'Macho' : 'Fêmea'}, {pet.age || 'Idade não informada'}
                    {pet.weight ? ` · ${pet.weight}kg` : ' · Peso não informado'}
                  </p>
                </div>
              </div>
            </div>
            {/* Tutor */}
            <div className="mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User size={18} className="text-slate-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-base text-slate-800 truncate">
                    {owner?.full_name || 'Tutor'} {pet?.id && `(${pet.id.slice(0, 4)})`}
                  </h2>
                  <p className="text-sm text-slate-600 truncate">{owner?.phone || 'Sem telefone'} - Celular</p>
                </div>
              </div>
            </div>
            {/* Saldo devedor (clicável: abre nota detalhada) */}
            <button
              type="button"
              onClick={() => setBalanceDetailOpen(true)}
              className="inline-flex items-center px-3 py-1.5 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200/80 transition-colors cursor-pointer text-left"
            >
              <span className="text-xs font-semibold text-red-700">
                Saldo devedor de R$ {fmt(saldoTotal)}
              </span>
            </button>
          </div>
        );
      })()}

      {/* ── Abas ──────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 px-2 sm:px-6 overflow-x-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-auto p-0 gap-1 flex-nowrap w-max min-w-full sm:min-w-0">
            <TabsTrigger
              value="historico"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-slate-900 rounded-none px-3 sm:px-4 py-3 shrink-0"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-4 h-4 border-2 border-slate-400 rounded shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Histórico</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="protocolos"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-slate-900 rounded-none px-3 sm:px-4 py-3 shrink-0"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Flame size={16} className="text-slate-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Protocolos</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="linha-tempo"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-slate-900 rounded-none px-3 sm:px-4 py-3 shrink-0"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Clock size={16} className="text-slate-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Linha do tempo</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="agenda"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-slate-900 rounded-none px-3 sm:px-4 py-3 shrink-0"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Agenda</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="vendas"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-slate-900 rounded-none px-3 sm:px-4 py-3 shrink-0"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ShoppingCart size={16} className="text-slate-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Vendas</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── Conteúdo principal ───────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-6 py-4 min-h-0 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="historico" className="mt-4">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Painel esquerdo: full width em mobile, coluna em desktop */}
              <div className="w-full lg:w-64 shrink-0">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <Popover open={addMenuOpen} onOpenChange={(open) => { setAddMenuOpen(open); if (!open) setProcedureSearch(''); }}>
                    <PopoverTrigger asChild>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm flex flex-col h-auto py-2 gap-0 leading-snug">
                        <span className="flex items-center gap-1">
                          <Plus size={13} />
                          Adicionar
                        </span>
                        <span>procedimento</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popper-anchor-width)] min-w-[14rem] max-w-[20rem] p-1.5 flex flex-col gap-1" side="bottom" align="start">
                      <Input
                        placeholder="Buscar (ex: AC, Con, Re)"
                        value={procedureSearch}
                        onChange={(e) => setProcedureSearch(e.target.value)}
                        className="h-6 text-[11px] px-2 border-slate-200 focus-visible:ring-1"
                      />
                      <div className="overflow-y-auto max-h-[240px] pr-0.5 -mr-0.5">
                        <div className="flex flex-col gap-px">
                          {ATTENDANCE_TYPES.filter((type) => {
                            const search = procedureSearch.trim().toLowerCase();
                            if (!search) return true;
                            const initials = type.label
                              .split(/\s+/)
                              .map((w) => w[0] ?? '')
                              .join('')
                              .toLowerCase();
                            const labelLower = type.label.toLowerCase();
                            return (
                              initials.startsWith(search) ||
                              labelLower.includes(search) ||
                              initials.includes(search)
                            );
                          }).map((type) => {
                            const Icon = type.icon;
                            return (
                              <button
                                key={type.key}
                                onClick={() => {
                                  setActiveDialog(type.key);
                                  setAddMenuOpen(false);
                                  setProcedureSearch('');
                                }}
                                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-100 transition-colors text-left w-full"
                              >
                                <div
                                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: type.accent }}
                                >
                                  <Icon size={10} className="text-white" strokeWidth={2.5} />
                                </div>
                                <span className="text-[11px] font-medium text-slate-700 truncate leading-tight">
                                  {type.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button variant="ghost" size="sm" className="w-full mt-2 h-8 justify-start gap-2 text-slate-600">
                    <Printer size={14} />
                    Imprimir
                  </Button>

                  {/* Lista de serviços adicionados ao pet */}
                  <div className="mt-3 space-y-1.5">
                    {petServices.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">Nenhum serviço adicionado</p>
                    ) : (
                      petServices.map((ps) => (
                        <div
                          key={ps.id}
                          className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                        >
                          <span className="text-slate-600 font-medium truncate">{ps.service_name}</span>
                          <span className="text-emerald-700 font-semibold ml-2 whitespace-nowrap">
                            R$ {Number(ps.price_snapshot).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Painel direito (Timeline) */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Button variant="outline" size="sm" className="text-xs">
                      Período...
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <ChevronLeft size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <ChevronRight size={14} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      {ATTENDANCE_TYPES.slice(0, 6).map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.key}
                            className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-100 transition-colors shrink-0"
                            style={{ color: type.accent }}
                            title={type.label}
                          >
                            <Icon size={16} />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs text-slate-500 hidden sm:inline">todos | nenhum</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Popover open={serviceMenuOpen} onOpenChange={setServiceMenuOpen}>
                      <PopoverTrigger asChild>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex flex-col h-auto py-1.5 gap-0 leading-snug">
                          <span className="flex items-center gap-1 text-xs">
                            <Plus size={12} />
                            Adicionar
                          </span>
                          <span className="text-xs">serviço</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-2" align="end">
                        {servicesLoading ? (
                          <div className="py-6 text-center text-sm text-slate-400">Carregando serviços...</div>
                        ) : services.length === 0 ? (
                          <div className="py-6 text-center text-sm text-slate-400">
                            Nenhum serviço ativo cadastrado.
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {services.map((svc) => (
                              <button
                                key={svc.id}
                                onClick={() => handleAddService(svc)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors text-left group"
                              >
                                <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-800 truncate pr-2">
                                  {svc.name}
                                </span>
                                <span className="text-sm text-emerald-700 font-semibold whitespace-nowrap">
                                  R$ {svc.price.toFixed(2).replace('.', ',')}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Timeline vertical */}
                <ScrollArea className="min-h-[240px] h-[calc(100vh-280px)]">
                  {timelineLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="animate-spin rounded-full h-7 w-7 border-2 border-blue-600 border-t-transparent" />
                      <p className="text-sm text-slate-400">Carregando histórico...</p>
                    </div>
                  ) : timeline.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <PawPrint size={24} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">Nenhum registro ainda</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Use <strong>Adicionar procedimento</strong> (à esquerda) ou <strong>Adicionar serviço</strong> (acima) para adicionar
                      </p>
                    </div>
              ) : (
                Object.entries(grouped)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([year, entries]) => (
                    <div key={year} className="mb-8 relative">
                      {/* Linha vertical da timeline */}
                      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200" />
                      
                      {/* Separador de ano */}
                      <div className="mb-4">
                        <span className="text-lg font-bold text-slate-800">{year}</span>
                      </div>

                      <div className="space-y-4 pl-8 relative">
                        {entries.map((entry, idx) => {
                          const ModuleIcon = entry.module ? MODULE_ICONS[entry.module] || PawPrint : PawPrint;
                          const typeInfo = ATTENDANCE_TYPES.find(t => t.key === entry.module);
                          const dotColor = typeInfo?.accent || '#64748B';

                          return (
                            <div
                              key={entry.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedEntry(entry)}
                              onKeyDown={(e) => e.key === 'Enter' && setSelectedEntry(entry)}
                              className="relative flex items-start gap-3 cursor-pointer group"
                            >
                              {/* Bolinha colorida na linha */}
                              <div
                                className="absolute -left-12 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10"
                                style={{ backgroundColor: dotColor }}
                              />
                              
                              {/* Card do evento */}
                              <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-all">
                                <div className="flex items-start gap-2">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: dotColor + '20' }}
                                  >
                                    <ModuleIcon size={16} style={{ color: dotColor }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold text-slate-600">
                                        {format(new Date(entry.date), "dd/MM", { locale: ptBR })} às {entry.time}h
                                      </span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800">
                                      {entry.title}
                                    </p>
                                    {entry.description && (
                                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{entry.description}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                  )}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Conteúdo das outras abas (placeholder) */}
          <TabsContent value="protocolos" className="mt-4">
            <div className="text-center py-12 text-slate-500">
              <Flame size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-sm">Protocolos em desenvolvimento</p>
            </div>
          </TabsContent>

          <TabsContent value="linha-tempo" className="mt-4">
            <div className="text-center py-12 text-slate-500">
              <Clock size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-sm">Linha do tempo em desenvolvimento</p>
            </div>
          </TabsContent>

          <TabsContent value="agenda" className="mt-4">
            <div className="text-center py-12 text-slate-500">
              <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-sm">Agenda em desenvolvimento</p>
            </div>
          </TabsContent>

          <TabsContent value="vendas" className="mt-4">
            <div className="text-center py-12 text-slate-500">
              <ShoppingCart size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-sm">Vendas em desenvolvimento</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── WhatsApp flutuante ────────────────────────────────────── */}
      {owner?.phone && (
        <button
          onClick={handleWhatsApp}
          className="fixed bottom-6 right-6 z-50 w-13 h-13 w-[52px] h-[52px] bg-[#25D366] hover:bg-[#1DB954] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          title={`WhatsApp: ${owner.full_name || 'Tutor'}`}
        >
          <Phone size={22} />
        </button>
      )}

      {/* ── Barra inferior de ações ───────────────────────────────────── */}
      <div className="border-t border-slate-200 px-4 sm:px-6 py-3 bg-white flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
          Editar animal
        </Button>
        <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
          <MoreVertical size={16} className="mr-1 shrink-0" />
          Mais ações
        </Button>
      </div>

      {/* ── Dialogs ───────────────────────────────────────────────── */}
      <Dialog open={balanceDetailOpen} onOpenChange={setBalanceDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhamento do saldo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Procedimentos e serviços vinculados ao paciente {pet?.name}.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b text-xs font-semibold text-slate-600 grid grid-cols-[1fr_60px_70px] gap-2">
                <span>Descrição</span>
                <span className="text-right">Qtd</span>
                <span className="text-right">Valor</span>
              </div>
              {petServices.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">Nenhum serviço adicionado</p>
              ) : (
                petServices.map((ps) => {
                  const subtotal = ps.price_snapshot * ps.quantity;
                  return (
                    <div
                      key={ps.id}
                      className="px-3 py-2 border-b text-sm grid grid-cols-[1fr_60px_70px] gap-2 items-center"
                    >
                      <span className="font-medium text-slate-800 truncate">{ps.service_name}</span>
                      <span className="text-right text-slate-600">{ps.quantity}</span>
                      <span className="text-right text-emerald-700 font-medium">
                        R$ {subtotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  );
                })
              )}
              <div className="px-3 py-3 bg-slate-50 border-t font-semibold text-slate-800 flex justify-between items-center">
                <span>Total</span>
                <span className="text-red-700">
                  R$ {petServices.reduce((s, ps) => s + ps.price_snapshot * ps.quantity, 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <HistoryEntryDetailDialog
        open={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />
      {pet && activeDialog !== null && activeDialog !== 'atendimento' && (
        <AttendanceTypeDialog
          open={true}
          onClose={closeDialog}
          onSuccess={refetchTimeline}
          petId={pet.id}
          petName={pet.name}
          initialType={activeDialog as AttendanceTypeKey}
        />
      )}
    </div>
    </AdminLayout>
  );
};

export default AdminPetProfile;
